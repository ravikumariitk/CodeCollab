const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const Y = require("yjs");
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
const docs = new Map(); // roomId -> Y.Doc

function getYDoc(roomId) {
    if (!docs.has(roomId)) {
        docs.set(roomId, new Y.Doc());
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
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const ydoc = getYDoc(roomId);

        // Send current state of the document to the new client
        const stateUpdate = Y.encodeStateAsUpdate(ydoc);
        socket.emit('yjs-update', stateUpdate);

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // When client sends Yjs update
    socket.on('yjs-update', ({ roomId, update }) => {
        const ydoc = getYDoc(roomId);
        Y.applyUpdate(ydoc, update); // Apply update to server doc
        socket.to(roomId).emit('yjs-update', update); // Broadcast to others
    });

    socket.on("chat", ({ roomId, username, text }) => {
        socket.in(roomId).emit('chat-r', { userName: username, text });
    });

    socket.on("video-stream", (data) => {
        const videoFrame = data.frameData;
        socket.in(data.roomId).emit('video-incoming', {
            videoFrame,
            socketId: data.socketId,
            username: userSocketMap[data.socketId]
        });
    });

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
