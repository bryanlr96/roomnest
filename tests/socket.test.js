import SocketController from "../controllers/socketController.js";
import { SocketModel } from "../models/mySQL/socket.js";
import { emitUpdatedContacts } from "../utils/emitUtils.js";

// Mock para los métodos estáticos de SocketModel
jest.mock("../models/mySQL/socket.js", () => ({
  SocketModel: {
    getAllRequests: jest.fn(),
    rejectRequest: jest.fn(),
    getIdByEmail: jest.fn(),
    hasFriendship: jest.fn(),
    sendRequest: jest.fn(),
    getRequest: jest.fn(),
    addContact: jest.fn(),
    getContacts: jest.fn(),
    getUsersFromContact: jest.fn(),
    addMessage: jest.fn(),
    getAllMessage: jest.fn(),
    getEmisor: jest.fn(),
    deleteContact: jest.fn()
  }
}));

describe('SocketController', () => {
  let socket

  beforeEach(() => {
    socket = { emit: jest.fn() }
    jest.clearAllMocks()
  });

  describe('getAllRequests', () => {
    it('debería emitir "all_requests" con las solicitudes del usuario', async () => {
      const userId = 1
      const mockRequests = [{ id: 123, emisorName: "Test", emisorEmail: "test@correo.com" }]
      SocketModel.getAllRequests.mockResolvedValue(mockRequests)

      
      await SocketController.getAllRequests(userId, socket)

      expect(SocketModel.getAllRequests).toHaveBeenCalledWith(userId)

      // Verificamos que se emitió el evento 'all_requests' con los mockRequests
      expect(socket.emit).toHaveBeenCalledWith('all_requests', mockRequests)
    })

    it('debería manejar el error y emitir un array vacío si ocurre un fallo', async () => {
        const userId = 1;
        
        SocketModel.getAllRequests.mockRejectedValue(new Error('Error al obtener las solicitudes'));
  
        await SocketController.getAllRequests(userId, socket);
        expect(SocketModel.getAllRequests).toHaveBeenCalledWith(userId);
        
        // Verificamos que se emiteun error y un array vacío
        expect(socket.emit).toHaveBeenCalledWith('error', 'Hubo un problema al obtener las solicitudes');
        expect(socket.emit).toHaveBeenCalledWith('all_requests', []);
      });
  })

  describe('rejectRequest', () => {
    it('debería rechazar una solicitud y emitir las solicitudes actualizadas', async () => {
        const userId = 1;
        const requestId = 123;
        const mockRequests = [{ id: 124, emisorName: "Test 2", emisorEmail: "test2@correo.com" }];
        
        SocketModel.rejectRequest.mockResolvedValue(true)
        SocketModel.getAllRequests.mockResolvedValue(mockRequests)
        
        // Llamamos al método rejectRequest
        await SocketController.rejectRequest(userId, socket, requestId);
  
        expect(SocketModel.rejectRequest).toHaveBeenCalledWith(requestId);
        expect(SocketModel.getAllRequests).toHaveBeenCalledWith(userId);
  
        // Verificamos que se emitieron las solicitudes actualizadas
        expect(socket.emit).toHaveBeenCalledWith('all_requests', mockRequests);
      });
  
      it('debería manejar el error si ocurre un fallo al rechazar la solicitud', async () => {
        const userId = 1;
        const requestId = 123;
        
        // Simulamos un error al intentar rechazar la solicitud
        SocketModel.rejectRequest.mockRejectedValue(new Error('Error al rechazar la solicitud'));
  
        await SocketController.rejectRequest(userId, socket, requestId);
  
        expect(socket.emit).toHaveBeenCalledWith('error', 'Hubo un problema al rechazar la solicitud');
      });
  })

})
