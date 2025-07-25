import express from 'express';
import { HttpController } from '../controllers/httpController.js';
import upload from '../middleware/uploadImage.js';
const router = express.Router();

//ruta para regargar
router.get('/reload', HttpController.reload)

//peticion para el login ✔️
router.post("/login", HttpController.login)

//peticion para el registro ✔️
router.post("/register", HttpController.register)

//peticion para actualizar el usuario ✔️
router.put('/updateUser', HttpController.updateUser);

//peticion para crear el perfil del usuario ✔️
router.post('/createProfile', HttpController.createProfile);

//peticion para actualizar el profile
router.put('/updateProfile', HttpController.updateProfile);

//peticion para crear una habitacion ✔️
router.post('/createRoom', HttpController.createRoom);

//peticion para actualizar una habitacion ✔️
router.put('/updateRoom', HttpController.updateRoom);

//peticion para enviar un like ✔️
router.post('/sendLike', HttpController.sendLike);

//peticion para quitar un like ✔️
router.delete('/deleteLike', HttpController.deleteLike);

//peticion para pedilr los Perfiles
router.post('/getProfiles', HttpController.getProfiles)

// peticion para pedir las rooms
router.post('/getRooms', HttpController.getRooms)

// peticion para subir imagenes (Habitacion)
router.post('/uploadRoomImage', upload.array("roomImages", 99), HttpController.uploadRoomImage)

// peticion para subir imagenes (perfil)
router.post('/uploadProfileImage', upload.array("profileImages", 99), HttpController.uploadProfileImage)

//peticion para obtener un listado de match
router.post('/getMatch', HttpController.getMatch)

//peticion para el logout
router.post('/logout', HttpController.logout)


export default router;
