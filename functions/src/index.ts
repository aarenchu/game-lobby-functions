import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as pg from 'pg';

const expressApp = express();

const pool = new pg.Pool({
  user: 'aarenchu',
  host: 'localhost',
  database: 'aarenchu',
  password: 'secret',
  port: 5432,
});

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Automatically allow cross-origin requests
expressApp.use(cors({ origin: true }));

expressApp.use(bodyParser.json());

// getPlayers by uids and colours
expressApp.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT uid, colour FROM game_lobby');
    res.status(200).json(result.rows);
  } catch (err) {
    res.json(err);
  } finally {
    client.release();
  }
});

// addPlayer
expressApp.post('/', async (req, res) => {
  // Grab the text parameter.
  const email = req.body.email;
  const uid = req.body.uid;
  const username = req.body.username;
  const client = await pool.connect();
  try {
    // Send back a message that we've successfully written the message
    await client.query(
      'INSERT INTO game_lobby(uid, email, username, auth_provider) VALUES($1, $2, $3, $4)',
      [uid, email, username, 'local']
    );
    res.status(200).json('successful upload');
  } catch (err) {
    res.json(err);
  } finally {
    client.release();
  }
});

// update player colour
expressApp.put('/:uid', async (req, res) => {
  const newColour = req.body.colour;
  const uid = req.params.uid;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE game_lobby SET colour = $1 WHERE uid = $2',
      [newColour, uid]
    );
    if (result.rowCount > 0) res.status(200).json('updated item');
    else res.status(404).json('no item exists by that uid');
  } catch (err) {
    res.json(err);
  } finally {
    client.release();
  }
});

// Get player info by uid
expressApp.get('/:uid', async (req, res) => {
  const uid = req.params.uid;
  const client = await pool.connect();
  try {
    const documentData = await client.query(
      'SELECT username, colour FROM game_lobby WHERE uid = $1',
      [uid]
    );
    if (documentData.rowCount > 0) res.status(200).json(documentData.rows[0]);
    else res.status(404).json('not found');
  } catch (err) {
    res.json(err);
  } finally {
    client.release();
  }
});

exports.players = functions.https.onRequest(expressApp);
