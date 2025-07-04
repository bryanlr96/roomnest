import request from 'supertest';
import app from '../app.js';
import { HttpModel } from '../models/mySQL/http.js'

// Mock del método estático login
jest.mock('../models/mySQL/http.js', () => ({
  HttpModel: {
    login: jest.fn()
  }
}));

describe('POST /login', () => {

  it('debería fallar si falta el email', async () => {
    const res = await request(app).post('/login').send({ pass: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined(); 
  });

  it('debería fallar si falta el pass', async () => {
    const res = await request(app).post('/login').send({ email: 'correo@correo.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined(); 
  });

  it('debería fallar el formato del correo es invalido', async () => {
    const res = await request(app).post('/login').send({ email: 'invalid format', pass: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined(); 
  });

  it('debería fallar el formato de la pass es invalido', async () => {
    const res = await request(app).post('/login').send({ email: 'correo@correo.com', pass: '12' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined(); 
  });

  it('debería fallar si el usuario no existe en la base de datos', async () => {
    HttpModel.login.mockResolvedValueOnce({ success: false, message: 'Usuario no encontrado' });

    const res = await request(app).post('/login').send({ email: 'usuario@noexiste.com', pass: '123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Usuario no encontrado');
    expect(res.body.success).toBe(false);
  });

  it('debería fallar si el pass es erroneo', async () => {
    HttpModel.login.mockResolvedValueOnce({ success: false, message: 'Contraseña incorrecta' });

    const res = await request(app).post('/login').send({ email: 'usuario@existe.com', pass: 'contraseñaErronea' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Contraseña incorrecta');
    expect(res.body.success).toBe(false);
  });

  it('Login correcto', async () => {
    // Definir el objeto `user`
    const user = { id: 1, email: 'usuario@existe.com', name: 'Usuario Ejemplo' };

    // Mock para simular un login exitoso
    HttpModel.login.mockResolvedValueOnce({ success: true, user });

    const res = await request(app).post('/login').send({ email: 'usuario@existe.com', pass: '123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toEqual(user); // Verifica que el usuario esté en la respuesta
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/access_token=/);
  });


});
