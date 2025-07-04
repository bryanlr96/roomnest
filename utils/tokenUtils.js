import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET
const EXPIRE = process.env.JWT_EXPIRE

export function generateToken(user) {

    return jwt.sign(user, SECRET_KEY, {
        expiresIn: EXPIRE
    })
}

export function setTokenCookie(res, user) {
    const token = generateToken(user);
    res.cookie('access_token', token, {
        httpOnly: true,
        secure: 'production',
        sameSite: 'None'
    })
}