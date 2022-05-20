import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as firestore from 'firebase-admin/firestore';

const app = admin.initializeApp();
const fs = firestore.getFirestore(app);
const playerCollectionRef = fs.collection('players');

const getPlayerDocRef = (playerId: string) => {
  return fs.doc('players/' + playerId);
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

// getPlayers by ids
expressApp.get('/', async (req, res) => {
  await playerCollectionRef.get().then((querySnapshot) => {
    if (querySnapshot.empty) res.json('No documents found');
    else {
      // Build the result data
      let result: object[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        if (documentSnapshot.exists) {
          let data = { id: documentSnapshot.id };
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
  const username = req.body.username;
  const password = req.body.password;
  let newPlayer = {
    username: username,
    password: password,
    // TODO: Profile pic
  };
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await playerCollectionRef.add(newPlayer);
  // Send back a message that we've successfully written the message
  res.json({ result: `Player with ID: ${writeResult.id} added.` });
});

// update player colour
expressApp.put('/:id', async (req, res) => {
  const playerDocRef = getPlayerDocRef(req.params.id);
  const newColour = req.body.colour;
  await playerDocRef
    .update({ colour: newColour })
    .then((result) => {
      res.json('updated item');
    })
    .catch((err) => res.json(err));
});

// Get player info by id
expressApp.get('/:id', async (req, res) => {
  const playerDocRef = getPlayerDocRef(req.params.id);
  await playerDocRef
    .get()
    .then((documentSnapshot) => {
      if (documentSnapshot.exists) {
        let documentData = documentSnapshot.data();
        let pair = { id: documentSnapshot.id };
        documentData = { ...documentData, ...pair };
        res.json(documentData);
      }
    })
    .catch((err) => res.json(err));
});

exports.players = functions.https.onRequest(expressApp);
