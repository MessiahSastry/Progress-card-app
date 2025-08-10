const functions = require('firebase-functions');
const admin = require('firebase-admin');

try { admin.initializeApp(); } catch (e) {}

exports.resetPasswordWithPhone = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.phone_number) {
    throw new functions.https.HttpsError('unauthenticated', 'Phone verification required.');
  }
  const verifiedPhone = context.auth.token.phone_number;
  const { phone, newPassword } = data || {};

  if (!phone || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'phone and newPassword are required.');
  }
  if (verifiedPhone !== phone) {
    throw new functions.https.HttpsError('permission-denied', 'Phone mismatch.');
  }

  const db = admin.firestore();
  const q = await db.collection('users').where('phone', '==', phone).limit(1).get();
  if (q.empty) {
    throw new functions.https.HttpsError('not-found', 'No user found with this phone.');
  }

  const doc = q.docs[0];
  const targetUid = doc.id;

  await admin.auth().updateUser(targetUid, { password: newPassword });
  return { ok: true, message: 'Password updated successfully.' };
});
