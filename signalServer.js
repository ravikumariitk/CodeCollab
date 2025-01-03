const WebSocket = require('ws');
const http = require('http');

// Create an HTTP server for health checks
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
});

// Combine WebSocket with HTTP server
const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');
  
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
    console.log('Client disconnected');
    clients.forEach((clientWs, peerId) => {
      if (clientWs === ws) {
        clients.delete(peerId);
        console.log(`Unregistered peer: ${peerId}`);
      }
    });
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

wss.on('error', (err) => {
  console.error('WebSocket server error:', err);
});

// Start the server
const port = process.env.PORT || 1234;
server.listen(port, () => {
  console.log(`Signaling server is running on port ${port}`);
});