

export const emitUpdatedContacts = async (userID, connectedUsers, io, SocketModel) => {
    const socketId = connectedUsers.get(userID);
    if (socketId) {
        const contacts = await SocketModel.getContacts(userID);
        io.to(socketId).emit('contactsList', contacts);
    }
};