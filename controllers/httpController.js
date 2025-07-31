import { HttpModel } from '../models/mySQL/http.js';
import { setTokenCookie } from '../utils/tokenUtils.js';
import path from "path";
import fs from "fs";

export class HttpController {

  // Reenviar el usuario si se recarga la pagina
  static async reload(req, res) {
    const { user } = req.session
    if (user) {
      const result = await HttpModel.getAllByUserId(user.id)
      res.json(result)
    } else {
      res.json({ success: false, message: "No user session" })
    }
  }


  // Login
  static async login(req, res) {
    //peticion a la bd
    const { email, password } = req.body
    const result = await HttpModel.login({ email, password })
    if (result.success) {
      setTokenCookie(res, result.user)
      return res.json(result)
    }
    return res.status(401).json(result)
  }


  // Registro
  static async register(req, res) {

    //peticion a la bd
    const { email, password, name, dni, last_connection_type } = req.body
    const result = await HttpModel.register({ email, password, name, dni, last_connection_type })

    if (result.success) {//Si se puede hacer Registro añadimes el token a la cookie
      setTokenCookie(res, result.user)
      return res.json(result)
    }
    return res.status(401).json(result)
  }

  //actualizamos el usuario
  static async updateUser(req, res) {
    try {
      const updatedUser = req.body; // Recibimos el objeto user completo (id, name, email, password...)

      if (!updatedUser.id) {
        return res.status(400).json({ success: false, message: "El id del usuario es obligatorio" });
      }

      const result = await HttpModel.updateUser(updatedUser);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('Error en UserController.updateUser:', error);
      return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
  }

  // crear perfil
  static async createProfile(req, res) {
    const { id_user, birthdate, situation, gender, children, province, profileDescription } = req.body;

    // Validar campos requeridos
    if (!id_user || !birthdate || !situation || !gender || children === undefined) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    try {
      const result = await HttpModel.createProfile({
        id_user,
        birthdate,
        situation,
        gender,
        children,
        province,
        profileDescription
      })

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json({ success: true, profile: result.profile });

    } catch (error) {
      console.error('Error en createProfile:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  // Actualizar el profile
  static async updateProfile(req, res) {
    try {
      const updatedProfile = req.body; // recibimos el objeto profile completo

      if (!updatedProfile.id) {
        return res.status(400).json({ success: false, message: "El id del perfil es obligatorio" });
      }

      // Excluir campos no editables
      const { id, id_user, birthdate, active_profile, ...editableFields } = updatedProfile;

      if (Object.keys(editableFields).length === 0) {
        return res.status(400).json({ success: false, message: "No hay campos para actualizar" });
      }

      // Pasamos solo los campos editables junto con el id
      const result = await HttpModel.updateProfile(updatedProfile);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('Error en HttpController.updateProfile:', error);
      return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
  }

  // Crear habitación
  static async createRoom(req, res) {
    const {
      user_id,
      province,
      municipality,
      street,
      floor,
      cp,
      price,
      meters,
      tenants,
      roomDescription
    } = req.body;

    // Validar campos requeridos
    if (
      !user_id ||
      !province ||
      !municipality ||
      !street ||
      floor === undefined ||
      !cp ||
      price === undefined ||
      meters === undefined ||
      tenants === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    try {
      const result = await HttpModel.createRoom({
        user_id,
        province,
        municipality,
        street,
        floor,
        cp,
        price,
        meters,
        tenants, 
        roomDescription
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);

    } catch (error) {
      console.error('Error en createRoom:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  static async updateRoom(req, res) {
    try {
      const updatedRoom = req.body;

      if (!updatedRoom.id) {
        return res.status(400).json({ success: false, message: "El id de la habitación es obligatorio" });
      }

      // Excluir campos no editables
      const {
        id,
        user_id,
        municipality,
        street,
        floor,
        cp,
        meters,
        ...editableFields
      } = updatedRoom;

      if (Object.keys(editableFields).length === 0) {
        return res.status(400).json({ success: false, message: "No hay campos para actualizar" });
      }

      // Crear objeto con id + campos editables
      const dataToUpdate = { id, ...editableFields };

      const result = await HttpModel.updateRoom(dataToUpdate);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);

    } catch (error) {
      console.error('Error en HttpController.updateRoom:', error);
      return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
  }

  // Enviar like
  static async sendLike(req, res) {
    const { id_emisor, id_receptor } = req.body;

    if (!id_emisor || !id_receptor) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    try {
      // Validar que ambos IDs existan
      const emisorExists = await HttpModel.checkIdExists(id_emisor);
      const receptorExists = await HttpModel.checkIdExists(id_receptor);

      if (!emisorExists || !receptorExists) {
        return res.status(400).json({ success: false, message: 'ID emisor o receptor no existe' });
      }

      // Insertar like
      const inserted = await HttpModel.insertLike(id_emisor, id_receptor);
      if (!inserted) {
        return res.status(409).json({ success: false, message: 'Ya existe un like de este emisor a este receptor' });
      }

      return res.json({ success: true});
    } catch (error) {
      console.error('Error en sendLike:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async deleteLike(req, res) {
    const { id_emisor, id_receptor } = req.body;

    if (!id_emisor || !id_receptor) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    try {
      // Validar que ambos IDs existan
      const emisorExists = await HttpModel.checkIdExists(id_emisor);
      const receptorExists = await HttpModel.checkIdExists(id_receptor);

      if (!emisorExists || !receptorExists) {
        return res.status(400).json({ success: false, message: 'ID emisor o receptor no existe' });
      }
      // Eliminar like
      const deleted = await HttpModel.deleteLike(id_emisor, id_receptor);
      if (!deleted) {
        return res.status(409).json({ success: false, message: 'No existe like para eliminar' });
      }

      return res.json({ success: true});
    } catch (error) {
      console.error('Error en deleteLike:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }


  static async getProfiles(req, res) {
    try {
      const { user_id, roomId } = req.body;
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'El user_id es obligatorio'
        });
      }

      const profiles = await HttpModel.getProfiles(user_id, roomId);

      return res.json({
        success: true,
        profiles
      });

    } catch (error) {
      console.error('Error en HttpController.getProfiles:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  static async getRooms(req, res) {
    try {
      const { user_id, profileId } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'El user_id es obligatorio'
        });
      }

      const rooms = await HttpModel.getRooms(user_id, profileId);

      return res.json({
        success: true,
        rooms
      });

    } catch (error) {
      console.error('Error en HttpController.getRooms:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }


  static async uploadRoomImage(req, res) {
    const { userId, roomId } = req.body;
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No se envió imagen' });
      }

      if (!roomId) {
        return res.status(400).json({ success: false, message: 'Falta roomId' });
      }

      // Array con las rutas relativas de las imágenes subidas
      const imagePaths = req.files.map(file =>
        path.join('/imagenes/rooms/', roomId, file.filename)
      );

      const result = await HttpModel.saveImagesForReference(roomId, 'room', imagePaths, userId);
      res.json(result); // ← Devuelve todo directamente desde getAllByUserId

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error al subir imagen' });
    }
  }

    static async uploadProfileImage(req, res) {
    const { userId, profileId } = req.body;

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No se envió imagen' });
      }
      if (!profileId) {
        return res.status(400).json({ success: false, message: 'Falta profile' });
      }
      // Array con las rutas relativas de las imágenes subidas
      const imagePaths = req.files.map(file =>
        path.join('/imagenes/profiles/', profileId, file.filename)
      );
      const result = await HttpModel.saveImagesForReference(profileId, 'profile', imagePaths, userId);
      res.json(result); // ← Devuelve todo directamente desde getAllByUserId
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Error al subir imagen' });
    }
  }

  static async getMatch(req, res){
    const {roomId, profileId} = req.body;
    let result = []
    if(!roomId && !profileId){
      return res.status(400).json({ success: false, message: 'No se envió id' });
    }

    if(!profileId){
      result = await HttpModel.getRoomMatch(roomId);  
      
    }else{
      result= await HttpModel.getProfileMatch(profileId)
    }

    res.json({success:true, match: result})
  }

  static async profiletoroom(req, res){
    const {userId} = req.body
    if(!userId)return res.status(400).json({ success: false, message: 'No se envió id' });
    
    const result = await HttpModel.profiletoroom(userId)
    res.json(result)
  }


   static async roomtoprofile(req, res){
    const {userId} = req.body
    if(!userId)return res.status(400).json({ success: false, message: 'No se envió id' });
    
    const result = await HttpModel.roomtoprofile(userId)
    res.json(result)
  }

  //Logout
  static async logout(req, res) {
    res.clearCookie('access_token')
    res.json({ success: true })
  }

}


