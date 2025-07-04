import SocketController from "../controllers/socketController.js";

export function socketHandlers(socket, connectedUsers, io) {

    const userId = socket.handshake.query.userId;
    if (!userId) {
        console.log("Usuario no identificado, desconectando...");
        socket.disconnect();
        return;
    }

    connectedUsers.set(userId, socket.id);


    socket.on('getAllContacts', () => SocketController.getAllContacts(userId, socket))
    socket.on('getAllRequests', () => SocketController.getAllRequests(userId, socket))
    socket.on('acceptRequest', ({ requestId }) => SocketController.acceptRequest(userId, socket, requestId, connectedUsers, io))
    socket.on('rejectRequest', ({ requestId }) => SocketController.rejectRequest(userId, socket, requestId))
    socket.on('deleteContact', ({ contactId}) => SocketController.deleteContact(contactId, socket, connectedUsers, io))
    socket.on('sendRequest', ({ email }) => SocketController.sendRequest(userId, socket, email, connectedUsers, io))
    socket.on('sendMessage', ({ newMessage, contactId }) => SocketController.sendMessage(io, connectedUsers, newMessage, userId, socket, contactId));
    socket.on('getAllMessages', ({ contactId }) => SocketController.getAllMessages(contactId, socket));
    socket.on("disconnect", () => SocketController.handleUserDisconnect(userId, connectedUsers));
}