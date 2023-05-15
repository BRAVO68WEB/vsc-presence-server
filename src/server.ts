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
      await redis.set('data', message);
    } catch (error) {
      console.error('Failed to store data in Redis:', error);
    }
  });
});

// REST API to retrieve the stored value
app.get('/data', async (req, res) => {
  try {
    // Retrieve the value of the 'data' key from Redis
    const value = await redis.get('data');
    res.json({ data: value });
  } catch (error) {
    console.error('Failed to retrieve data from Redis:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

export default app;
