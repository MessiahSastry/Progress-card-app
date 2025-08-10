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
     const q = await db.collection('users').where('phone', '==', verifiedPhone).get();
if (q.empty) {
  throw new functions.https.HttpsError('not-found', `No Firestore user found for ${verifiedPhone}`);
}
if (q.size > 1) {
  throw new functions.https.HttpsError('failed-precondition', `Multiple user records share phone ${verifiedPhone}. Make it unique.`);
}

const userDoc = q.docs[0];
const userData = userDoc.data();
const targetEmail = (userData?.email || '').trim();
if (!targetEmail) {
  throw new functions.https.HttpsError('failed-precondition', 'User record has no email.');
}

const authUser = await admin.auth().getUserByEmail(targetEmail);
await admin.auth().updateUser(authUser.uid, { password: newPassword });

return {
  ok: true,
  message: `Password updated.`,
  targetEmail,
  uid: authUser.uid
};
    } catch (err) {
      console.error('resetPasswordWithPhone error:', err);
      if (err instanceof functions.https.HttpsError) throw err;
      throw new functions.https.HttpsError('internal', err?.message || 'Reset failed.');
    }
  });
