import { SocketModel } from "../models/mySQL/socket.js";
import { emitUpdatedContacts } from "../utils/emitUtils.js";


class SocketController {

  // Añadir mensaje

  static async sendMessage(io, connectedUsers, newMessage, socket, matchId, id_emisor) {
    try {
      const addedMessage = await SocketModel.addMessage(matchId, id_emisor, newMessage);

      if (!addedMessage) {
        socket.emit('messageError', { error: 'No se pudo guardar el mensaje' });
        return;
      }

      const messages = await SocketModel.getAllMessage(matchId);
      const [user1_ID, user2_ID] = await SocketModel.getUsersFromMatch(matchId);

      for (const userID of [user1_ID, user2_ID]) {
        const socketId = connectedUsers.get(userID);
        if (socketId) {
          io.to(socketId).emit('messagesList', messages);
        }
      }
    } catch (error) {
      console.error('Error al añadir mensaje:', error);
      socket.emit('messageError', { error: 'Hubo un problema al enviar el mensaje' });
    }
  }

  static async getAllMessages(matchId, socket) {
    try {
      const messages = await SocketModel.getAllMessage(matchId);
      socket.emit('messagesList', messages);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      socket.emit('messageError', { error: 'Hubo un problema al obtener los mensajes' });
    }
  }


  // Manejo de desconexión de usuario
  static handleUserDisconnect(userId, connectedUsers) {
    connectedUsers.delete(userId);
    console.log(`Usuario ${userId} desconectado`);
  }
}

export default SocketController;