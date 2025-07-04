import { SocketModel } from "../models/mySQL/socket.js";
import { emitUpdatedContacts } from "../utils/emitUtils.js";


class SocketController {
  // Método para recuperar y mostrar los contactos
  static async getAllContacts(userID, socket) {
    try {
      const contacts = await SocketModel.getContacts(userID)
      socket.emit('contactsList', contacts)
    } catch (error) {
      console.error('Error al obtener los contactos:', error)
      socket.emit('error', 'Hubo un problema al obtener los contactos')
    }
  }

  // Método para obtener todas las solicitudes de un usuario
  static async getAllRequests(userId, socket) {
    try {
      const requests = await SocketModel.getAllRequests(userId);
      socket.emit('requestList', requests);
    } catch (error) {
      console.error('Error al obtener las solicitudes:', error);
      socket.emit('error', 'Hubo un problema al obtener las solicitudes');
      socket.emit('requestList', []);
    }
  }

  // Metodo para aceptar una solicitud
  static async acceptRequest(receptorId, socket, requestId, connectedUsers, io) {
    try {
      // Recuperar los id de los usuarios implicados y añadimos el contacto
      const emisorId = await SocketModel.getEmisor(requestId);
      const addResult = await SocketModel.addContact(receptorId, emisorId);

      if (!addResult) return; // Si no se añade correctamente

      // Eliminamos la solicitud
      await SocketModel.rejectRequest(requestId);

      // Mostramos la lista de solicitudes actualizadas
      const updatedRequests = await SocketModel.getAllRequests(receptorId);
      socket.emit('requestList', updatedRequests);

      // Mostramos los contactos actualizados a ambos usuarios
      await Promise.all([
        emitUpdatedContacts(receptorId, connectedUsers, io, SocketModel),
        emitUpdatedContacts(emisorId, connectedUsers, io, SocketModel)
      ]);

    } catch (error) {
      console.error('Error al aceptar la solicitud:', error);
      socket.emit('acceptRequestError', { error: 'Hubo un problema al aceptar la solicitud' });
    }
  }

  
  // Metodo para rechazar una solicitud
  static async rejectRequest(userId, socket, requestId) {
    try {
      const result = await SocketModel.rejectRequest(requestId)

      // Si la solicitud se eliminó, se actualiza la lista de solicitudes
      if (result) this.getAllRequests(userId, socket)

    } catch (error) {
      console.error('Error al rechazar la solicitud:', error);
      socket.emit('error', 'Hubo un problema al rechazar la solicitud'); // Emitimos el evento de error
    }
  }



  // Método para eliminar un contacto
  static async deleteContact(contact_ID, socket, connectedUsers, io) {
    try {
      // Obtenemos los id de los dos usuarios
      const [user1_ID, user2_ID] = await SocketModel.getUsersFromContact(contact_ID);

      // Eliminamos el contacto
      const deleted = await SocketModel.deleteContact(contact_ID);

      // Si se elimina correctamente
      if (deleted) {
        await Promise.all([
          emitUpdatedContacts(user1_ID, connectedUsers, io, SocketModel),
          emitUpdatedContacts(user2_ID, connectedUsers, io, SocketModel)
        ])
      }
    } catch (error) {
      console.error('Error al eliminar el contacto:', error)
      socket.emit('error', 'Hubo un problema al eliminar el contacto')
    }
  }


  // Método para enviar una solicitud
  static async sendRequest(emisor_ID, socket, email, connectedUsers, io) {
    try {
      const receptor_ID = await SocketModel.getIdByEmail(email);

      // Si no se encuentra usuario
      if (!receptor_ID) {
        socket.emit('sendRequestError', { error: 'Usuario no encontrado' })
        return
      }

      // Si se envía la solicitud a sí mismo
      if (emisor_ID === receptor_ID) {
        socket.emit('sendRequestError', { error: 'No te puedes solicitar a ti mismo' })
        return
      }

      // Si ya son amigos
      if (await SocketModel.hasFriendship(emisor_ID, receptor_ID)) {
        socket.emit('sendRequestError', { error: 'Ya sois amigos' })
        return
      }

      // Si ya hay una solicitud enviada
      const request_ID = await SocketModel.getRequest(emisor_ID, receptor_ID)
      if (request_ID) {// Si ya hay una solicitud, aceptarla
        await SocketController.acceptRequest(emisor_ID, socket, request_ID, connectedUsers, io)
        return
      }

      // No había solicitud previa, crear una nueva
      const createRequest = await SocketModel.sendRequest(emisor_ID, receptor_ID)
      if (createRequest) {
        // Emitir la solicitud al receptor
        const requestsReceptor = await SocketModel.getAllRequests(receptor_ID)
        const receptorSocketId = connectedUsers.get(receptor_ID)
        if (receptorSocketId) {
          io.to(receptorSocketId).emit('requestList', requestsReceptor)
        }
      } else {
        socket.emit('sendRequestError', { error: 'No se pudo enviar la solicitud' })
      }
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      socket.emit('sendRequestError', { error: 'Hubo un problema al enviar la solicitud' });
    }
  }



  // Añadir mensaje
  // controllers/socketController.js

  static async sendMessage(io, connectedUsers, newMessage, userId, socket, contactId) {
    try {
      const addedMessage = await SocketModel.addMessage(contactId, userId, newMessage);

      if (!addedMessage) {
        socket.emit('messageError', { error: 'No se pudo guardar el mensaje' });
        return;
      }

      const messages = await SocketModel.getAllMessage(contactId);
      const [user1_ID, user2_ID] = await SocketModel.getUsersFromContact(contactId);

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

  static async getAllMessages(contactId, socket) {
    try {
      const messages = await SocketModel.getAllMessage(contactId);
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