/* eslint-disable no-console */
import 'dotenv/config';
import express from 'express';
import WebSocket from 'ws';
import Redis from 'ioredis';
import { Presence } from './presence.interface';

const app = express();
const server = app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

const wss = new WebSocket.Server({ server });

// Redis configuration
const redis = new Redis(process.env.REDIS_HOST_URL as string);

// WebSocket listener
wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');

    // Handle WebSocket messages
    ws.on('message', async (message: string) => {
        try {
            // Store data in Redis as a single key
            const { msgType, pubkey, presence } = JSON.parse(message);
            if (msgType === 'presence') {
                await redis.set('presence_' + pubkey, JSON.stringify(presence));
            } else if (msgType === 'heartbeat') {
                await redis.setex(`heartbeat_${pubkey}`, 10, Date.now());
            }
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
            return res.send({
                success: false,
                error: 'No email provided in query',
            });
        } else {
            const pubkey =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
            const fetchkey = Buffer.from(email.toString()).toString('base64');
            await redis.hset(`publisher`, fetchkey, pubkey);
            await redis.hset(`subscriber`, pubkey, fetchkey);
            return res.send({
                success: true,
                fetchkey: fetchkey,
                publisherkey: pubkey,
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to store data',
        });
    }
});

// REST API to get fetchKey using publisher key
app.get('/fetchkey/:publisherkey', async (req, res) => {
    try {
        // Retrieve the value of the 'data' key from Redis
        // Check if the publisher key exists
        const value = await redis.hget('subscriber', req.params.publisherkey);
        if (!value) {
            res.status(404).json({
                success: false,
                error: 'Publisher key not found',
            });
            return;
        } else {
            const encEmail = value.toString();
            res.json({
                data: encEmail,
                success: false,
                error: null,
            });
            return;
        }
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve data',
            isError: true,
        });
    }
});

// REST API to retrieve the stored value
app.get('/presence/:fetchkey', async (req, res) => {
    try {
        // Retrieve the value of the 'data' key from Redis
        const pubkey = await redis.hget(`publisher`, req.params.fetchkey);
        const isUserOnline = await redis.get(`heartbeat_${pubkey}`);
        const value: any = await redis.get(`presence_${pubkey}`);
        if (!pubkey) {
            res.status(404).json({
                success: false,
                error: 'Publisher key not found',
            });
            return;
        } else if (isUserOnline === null) {
            res.status(404).json({
                success: false,
                error: 'User is Currently offline',
            });
            return;
        } else if (!value) {
            res.status(404).json({
                success: false,
                error: 'Presence data not found',
            });
            return;
        }
        let output: Presence = JSON.parse(value);
        output = {
            ...output,
            currentTimestamp: Date.now(),
            timeDiff: Date.now() - output.startTimestamp,
            iconURL: `https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${output.smallImageKey}.svg`,
        };
        res.json({
            data: output,
            isUserOnline: true,
            success: false,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve data',
        });
    }
});

export default app;
