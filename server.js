const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const Y = require('yjs');
const { Awareness } = require('y-protocols/awareness');
const { encodeStateAsUpdate, applyUpdate } = Y;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('build'));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
const docs = new Map(); // roomId -> { ydoc, awareness }

function getYDoc(roomId) {
    if (!docs.has(roomId)) {
        const ydoc = new Y.Doc();
        const awareness = new Awareness(ydoc);
        docs.set(roomId, { ydoc, awareness });
    }
    return docs.get(roomId);
}

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => ({
            socketId,
            username: userSocketMap[socketId],
        })
    );
}

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const { ydoc, awareness } = getYDoc(roomId);

        // Send current document state
        const stateUpdate = Y.encodeStateAsUpdate(ydoc);
        socket.emit('yjs-update', stateUpdate);

        // Set awareness for the new client
        const clientID = socket.id;
        awareness.setLocalStateField('user', { name: username });

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // Handle Yjs document updates
    socket.on('yjs-update', ({ roomId, update }) => {
        const { ydoc } = getYDoc(roomId);
        Y.applyUpdate(ydoc, update); // Apply update to the server doc
        socket.to(roomId).emit('yjs-update', update); // Broadcast to others
    });

    // Awareness updates (presence info like cursor, user status)
    socket.on('awareness-update', ({ roomId, update }) => {
        const { awareness } = getYDoc(roomId);
        awareness.applyUpdate(update);
        socket.to(roomId).emit('awareness-update', update);
    });

    // Chat message
    socket.on('chat', ({ roomId, username, text }) => {
        socket.in(roomId).emit('chat-r', { userName: username, text });
    });

    // Video streaming
    socket.on('video-stream', (data) => {
        socket.in(data.roomId).emit('video-incoming', {
            videoFrame: data.frameData,
            socketId: data.socketId,
            username: userSocketMap[data.socketId]
        });
    });

    // Disconnect
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
