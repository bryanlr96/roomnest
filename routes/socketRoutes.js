import SocketController from "../controllers/socketController.js";

export function socketHandlers(socket, connectedUsers, io) {

    const userId = socket.handshake.auth.userId;
    if (!userId) {
        console.log("Usuario no identificado, desconectando...");
        socket.disconnect();
        return;
    }

    connectedUsers.set(userId, socket.id);

    socket.on('sendMessage', ({ newMessage, matchId,  id_emisor }) => SocketController.sendMessage(io, connectedUsers, newMessage, socket, matchId, id_emisor));
    socket.on('getAllMessages', ({ matchId }) => SocketController.getAllMessages(matchId, socket));
    socket.on("disconnect", () => SocketController.handleUserDisconnect(userId, connectedUsers));
}