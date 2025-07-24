import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { roomId, profileId } = req.body;
    if (!roomId && !profileId) {
      return cb(new Error('Falta roomId'), null);
    }

    let dir = "";
    if(!profileId){
      dir = path.join('imagenes', 'rooms', roomId);
    }else{
      dir = path.join('imagenes', 'profiles', profileId);
    }
    

    // Crear carpeta si no existe (de forma recursiva)
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

export default upload;
