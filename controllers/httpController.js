import { HttpModel } from '../models/mySQL/http.js';
import { setTokenCookie } from '../utils/tokenUtils.js';



export class HttpController {

  // Reenviar el usuario si se recarga la pagina
  static async reload(req, res) {
    const { user } = req.session
    let result = { success: false }

    if (user) result = { success: true, user }
    res.json(result)
  }


  // Login
  static async login(req, res) {

    //peticion a la bd
    const { email, pass } = req.body
    const result = await HttpModel.login({ email, pass })
    if (result.success) {
      setTokenCookie(res, result.user)
      return res.json(result)
    }
    return res.status(401).json(result)
  }


  // Registro
  static async register(req, res) {

    //peticion a la bd
    const { email, pass, name, dni } = req.body
    const result = await HttpModel.register({ email, pass, name, dni })

    if (result.success) {//Si se puede hacer Registro añadimes el token a la cookie
      setTokenCookie(res, result.user)
      return res.json(result)
    }
    return res.status(401).json(result)
  }

  //actualizamos el usuario
  static async updateUser(req, res) {
    try {
      const updatedUser = req.body; // Recibimos el objeto user completo (id, name, email, pass...)

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
    const { id_user, birthdate, situation, gender, children } = req.body;

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
        children
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


  //Logout
  static async logout(req, res) {
    res.clearCookie('access_token')
    res.json({ success: true })
  }

}


