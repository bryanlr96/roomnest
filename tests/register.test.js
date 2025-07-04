import request from 'supertest';
import app from '../app.js';
import { HttpModel } from '../models/mySQL/http.js';

// Mock del método estático register
jest.mock('../models/mySQL/http.js', () => ({
  HttpModel: {
    register: jest.fn()
  }
}));

describe('POST /register', () => {

  it('debería fallar si falta el email', async () => {
    const res = await request(app).post('/register').send({ pass: '123', userName: 'Bryan' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined(); 
  });

  it('debería fallar si falta el pass', async () => {
    const res = await request(app).post('/register').send({ email: 'correo@correo.com', userName: 'Bryan' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined(); 
  });

  it('debería fallar si falta el userName', async () => {
    const res = await request(app).post('/register').send({ email: 'correo@correo.com', pass: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined(); 
  });

  it('debería fallar si el email tiene formato inválido', async () => {
    const res = await request(app).post('/register').send({ email: 'noesemail', pass: '123', userName: 'Bryan' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('debería fallar si la pass es muy corta', async () => {
    const res = await request(app).post('/register').send({ email: 'correo@correo.com', pass: '12', userName: 'Bryan' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('debería fallar si el usuario ya existe', async () => {
    HttpModel.register.mockResolvedValueOnce({ success: false, message: 'El usuario ya existe' });

    const res = await request(app).post('/register').send({ email: 'correo@correo.com', pass: '123', userName: 'Bryan' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('El usuario ya existe');
  });

  it('registro correcto', async () => {
    const user = { id: 1, userName: 'Bryan', email: 'correo@correo.com' };
    HttpModel.register.mockResolvedValueOnce({ success: true, user });

    const res = await request(app).post('/register').send({ email: user.email, pass: '123', userName: user.userName });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toEqual(user);

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/access_token=/);
  });

});
