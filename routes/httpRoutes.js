import express from 'express';
import { HttpController } from '../controllers/httpController.js';
const router = express.Router();

//ruta para regargar
router.get('/reload', HttpController.reload)

//peticion para el login
router.post("/login", HttpController.login)

//peticion para el registro
router.post("/register", HttpController.register)

//peticion para actualizar el usuario
router.put('/updateUser', HttpController.updateUser);

//peticion para crear el perfil del usuario
router.post('/createProfile', HttpController.createProfile);

//peticion para actualizar el profile
router.put('/updateProfile', HttpController.updateProfile);

//peticion para el logout
router.get('/logout', HttpController.logout)


export default router;
