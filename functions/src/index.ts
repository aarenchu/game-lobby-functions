import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as firestore from 'firebase-admin/firestore';

const app = admin.initializeApp();
const fs = firestore.getFirestore(app);
const playerCollectionRef = fs.collection('players');
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.getPlayers = functions.https.onRequest(async (req, res) => {
  await playerCollectionRef.get().then((querySnapshot) => {
    if (querySnapshot.empty) res.json('No documents found');
    else {
      // Build the result data
      let result: object[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        if (documentSnapshot.exists) result.push(documentSnapshot.data());
      });
      res.json(result);
    }
  });
});
