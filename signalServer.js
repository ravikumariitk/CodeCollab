const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;

import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', (ws) => {
  let room = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.room) {
        room = msg.room;
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room).add(ws);
      }

      if (room && rooms.has(room)) {
        rooms.get(room).forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(data);
          }
        });
      }
    } catch (err) {
      console.error('Message parse error:', err);
    }
  });

  ws.on('close', () => {
    if (room && rooms.has(room)) {
      rooms.get(room).delete(ws);
      if (rooms.get(room).size === 0) rooms.delete(room);
    }
  });
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => console.log(`Signaling server running on ${PORT}`));
