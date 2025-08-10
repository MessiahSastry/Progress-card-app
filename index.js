const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

try { admin.initializeApp(); } catch (e) {}
const db = getFirestore();

exports.resetPasswordWithPhone = functions
  .region('asia-south1') // ← match your deployed region
  .https.onCall(async (data, context) => {
    try {
      // 1) Require verified phone via OTP session
      const verifiedPhone = context?.auth?.token?.phone_number;
      if (!verifiedPhone) {
        throw new functions.https.HttpsError('unauthenticated', 'Phone verification required.');
      }

      // 2) Validate input
      const newPassword = (data?.newPassword || '').trim();
      if (newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
      }

      // 3) Find the *app user* in Firestore by verified phone (E.164, e.g., +91...)
      const snap = await db.collection('users').where('phone', '==', verifiedPhone).limit(1).get();
      if (snap.empty) {
        throw new functions.https.HttpsError('not-found', `No Firestore user found for ${verifiedPhone}`);
      }

      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      const targetEmail = userData?.email;
      if (!targetEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'User record has no email.');
      }

      // 4) Resolve the Auth UID by email (robust even if doc.id != uid)
      const authUser = await admin.auth().getUserByEmail(targetEmail);

      // 5) Update password for that UID
      await admin.auth().updateUser(authUser.uid, { password: newPassword });

      return { ok: true, message: `Password updated for ${targetEmail}. Please sign in with your new password.` };
    } catch (err) {
      console.error('resetPasswordWithPhone error:', err);
      if (err instanceof functions.https.HttpsError) throw err;
      throw new functions.https.HttpsError('internal', err?.message || 'Reset failed.');
    }
  });
