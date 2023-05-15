/* eslint-disable no-console */
import express from 'express';
import WebSocket from 'ws';
import Redis from 'ioredis';

const app = express();
const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

const wss = new WebSocket.Server({ server });

// Redis configuration
const redis = new Redis();

// WebSocket listener
wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection established');

  // Handle WebSocket messages
  ws.on('message', async (message: string) => {
    try {
      // Store data in Redis as a single key
      const { pubkey, presence } = JSON.parse(message);
      console.log(pubkey, presence);
      await redis.set('presence_' + pubkey, JSON.stringify(presence));
    } catch (error) {
      console.error('Failed to store data in Redis:', error);
    }
  });
});

app.get('/register', async (req, res) => {
  try {
    // Store data in Redis as a single key
    const { email } = req.query;
    if (!email) {
      res.send('No email provided in query');
    } else {
      const pubkey =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const fetchkey = Buffer.from(email.toString()).toString('base64');
      await redis.hset(`publisher`, fetchkey, pubkey);
      await redis.hset(`subscriber`, pubkey, fetchkey);
      res.send({
        fetchkey: fetchkey,
        publisherkey: pubkey,
      });
    }
    res.json({ data: 'test' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store data' });
  }
});

// REST API to get fetchKey using publisher key
app.get('/fetchkey/:publisherkey', async (req, res) => {
  try {
    // Retrieve the value of the 'data' key from Redis
    // Check if the publisher key exists
    const value = await redis.hget('subscriber', req.params.publisherkey);
    if (!value) {
      res.status(404).json({ data: 'Publisher key not found' });
      return;
    } else {
      const encEmail = value.toString();
      res.json({ data: encEmail });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// REST API to retrieve the stored value
app.get('/presence/:fetchkey', async (req, res) => {
  try {
    const newLocal = 'publisher';
    // Retrieve the value of the 'data' key from Redis
    const pubkey = await redis.hget(newLocal, req.params.fetchkey);
    const value: any = await redis.get(`presence_${pubkey}`);
    let output = JSON.parse(value);
    output = {
      ...output,
      currentTimestamp: Date.now(),
      timeDiff: Date.now() - output.startTimestamp,
      iconURL: `https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${output.smallImageKey}.svg`,
    };
    res.json({ data: output });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

export default app;
