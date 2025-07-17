import express from 'express';
import loginRoutes from './routes/httpRoutes.js';
import cookieParser from 'cookie-parser';
import addSession from './middleware/addSession.js';
import cors from 'cors'
const app = express();

app.use(cors({
    origin: process.env.FRONT_URL,
    credentials: true,
}))

// check route
app.get("/", (req, res) => {
    res.send("OK");
});

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.get("*", addSession);
app.use('/imagenes', express.static('imagenes'));

// Rutas HTTP
app.use('/', loginRoutes);

export default app;
