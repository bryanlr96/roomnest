// index.js
import http from "http";
import { Server } from "socket.io";
import app from './app.js';
import { socketHandlers } from './routes/socketRoutes.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server,{
  cors: {
    origin: process.env.FRONT_URL, 
    methods: ['GET', 'POST'],
    credentials: true,  // Permite que las cookies se envíen
  }
});

// Registro de usuarios conectados
const connectedUsers = new Map();

// control de las acciones de socket
io.on('connection', socket => socketHandlers(socket, connectedUsers, io));


server.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
