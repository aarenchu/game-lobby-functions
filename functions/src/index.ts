import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as firestore from 'firebase-admin/firestore';

const app = admin.initializeApp();
const fs = firestore.getFirestore(app);
const playerCollectionRef = fs.collection('players');

const getPlayerDocRef = async (playerId: string) => {
  let query = playerCollectionRef.where('uid', '==', playerId);
  let querySnapshot = await query.get();
  let doc = querySnapshot.docs[0];
  return doc.ref;
};

import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';

const expressApp = express();

// Automatically allow cross-origin requests
expressApp.use(cors({ origin: true }));

// Add middleware to authenticate requests
// expressApp.use(myMiddleware);

expressApp.use(bodyParser.json());

// getPlayers by uids and colours
expressApp.get('/', async (req, res) => {
  await playerCollectionRef.get().then((querySnapshot) => {
    if (querySnapshot.empty) res.json('No documents found');
    else {
      // Build the result data
      let result: object[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        if (documentSnapshot.exists) {
          let data = { uid: documentSnapshot.get('uid') };
          let colour = documentSnapshot.get('colour');
          if (colour) {
            let pair = { colour: colour };
            data = { ...data, ...pair };
          }
          result.push(data);
        }
      });
      res.json(result);
    }
  });
});

// addPlayer
expressApp.post('/', async (req, res) => {
  // Grab the text parameter.
  const email = req.body.email;
  const uid = req.body.uid;
  const username = req.body.username;
  let newPlayer = {
    uid,
    username,
    authProvider: 'local',
    email,
    colour: '',
  };
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await playerCollectionRef.add(newPlayer);
  // Send back a message that we've successfully written the message
  res.json({ id: writeResult.id });
});

// update player colour
expressApp.put('/:uid', async (req, res) => {
  const newColour = req.body.colour;
  (await getPlayerDocRef(req.params.uid))
    .update({ colour: newColour })
    .then(() => {
      res.json('updated item');
    })
    .catch((err) => res.json(err));
});

// Get player info by uid
expressApp.get('/:uid', async (req, res) => {
  (await getPlayerDocRef(req.params.uid))
    .get()
    .then((documentSnapshot) => {
      if (documentSnapshot.exists) {
        let documentData = documentSnapshot.data();
        res.json(documentData);
      }
    })
    .catch((err) => res.json(err));
});

exports.players = functions.https.onRequest(expressApp);
