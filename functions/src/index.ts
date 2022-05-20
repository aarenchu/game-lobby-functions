import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as firestore from 'firebase-admin/firestore';

const app = admin.initializeApp();
const fs = firestore.getFirestore(app);
const playerCollectionRef = fs.collection('players');
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';

const expressApp = express();

// Automatically allow cross-origin requests
expressApp.use(cors({ origin: true }));

// Add middleware to authenticate requests
// expressApp.use(myMiddleware);

expressApp.use(bodyParser.json());

// getPlayers
expressApp.get('/', async (req, res) => {
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

// addPlayer
expressApp.post('/', async (req, res) => {
  // Grab the text parameter.
  console.log('this is the req body');
  console.log(req.body);
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
// expressApp.put('/:id', (req, res) =>
//   res.send(Widgets.update(req.params.id, req.body))
// );

// expressApp.get('/:id', (req, res) => res.send(Widgets.list()));

exports.players = functions.https.onRequest(expressApp);
