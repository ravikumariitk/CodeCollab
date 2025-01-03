const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT | 1234 });

const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    const parsedMessage = JSON.parse(message);

    // Handle signaling messages
    if (parsedMessage.type === 'register') {
      clients.set(parsedMessage.peerId, ws);
      console.log(`Registered peer: ${parsedMessage.peerId}`);
    } else if (parsedMessage.type === 'signal') {
      const targetWs = clients.get(parsedMessage.target);
      if (targetWs) {
        targetWs.send(JSON.stringify(parsedMessage));
      }
    }
  });

  ws.on('close', () => {
    clients.forEach((clientWs, peerId) => {
      if (clientWs === ws) {
        clients.delete(peerId);
      }
    });
  });
});

console.log(`Signaling server is running on ws://localhost:${process.env.PORT }`);
