const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const { PeerServer } = require('peer');
const Y = require("yjs");
const { encodeStateAsUpdate, applyUpdate } = Y;
const { WebsocketProvider } = require('y-websocket');
const ydoc = new Y.Doc();

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

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        // Initialize the WebSocket provider for real-time document synchronization
        // const provider = new WebsocketProvider('ws://localhost:1234', roomId, ydoc);

        const initialUpdate = Y.encodeStateAsUpdate(ydoc);
        io.to(socket.id).emit(ACTIONS.INITIAL_DOCUMENT, initialUpdate);

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });
    socket.on("chat", ({roomId , username , text}) => {
        // console.log(text)
        socket.in(roomId).emit('chat-r', {
           userName : username,
           text
        });
    });

    socket.on("video-stream", (data) => {
        const videoFrame = data.frameData;
        socket.in(data.roomId).emit('video-incoming', {
            videoFrame : videoFrame,
            socketId : data.socketId,
            username : userSocketMap[data.socketId]
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
        socket.leave();
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
