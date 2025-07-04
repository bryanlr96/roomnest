import request from 'supertest'
import app from '../app.js'
import path from 'path'
import fs from 'fs'
import { generateToken } from '../utils/tokenUtils.js'


describe('GET /login', () => {

  it('Si no hay coockie y se quiere acceder al login', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toBe(200)
    const distPath = path.join(process.cwd(), "..", "client", "dist", "index.html")
    const expectedHtml = fs.readFileSync(distPath, 'utf8')

    expect(res.text).toBe(expectedHtml)
  })

  it('Si hay coockie y se quiere acceder al login', async () => {
    
    const user = { id: 1, email: "correo@correo.com", userName: 'UsuarioTest' }

    const res = await request(app)
      .get('/') 
      .set('Cookie', `access_token=${generateToken(user)}`); // Pasamos la cookie con el token generado

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/home')
  
  })

})


describe('GET /home', () => {
  it('Debería redirigir a /login si no hay sesión de usuario', async () => {

    const res = await request(app).get('/home')

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/')

  })

  it('Debería mostrar la página de inicio si el usuario tiene sesión activa', async () => {

    const user = { id: 1, email: "correo@correo.com", userName: 'UsuarioTest' }

    const res = await request(app)
      .get('/home')
      .set('Cookie', `access_token=${generateToken(user)}`)

    expect(res.statusCode).toBe(200)

    const distPath = path.join(process.cwd(), "..", "client", "dist", "index.html")
    const expectedHtml = fs.readFileSync(distPath, 'utf8')

    expect(res.text).toBe(expectedHtml)
  })
})


describe('GET /reload )', () => {
  it('Debería devolver los datos del usuario si la cookie es válida', async () => {
    const user = { id: 1, email: "correo@correo.com", userName: 'UsuarioTest' }


    const res = await request(app)
      .get('/reload') 
      .set('Cookie', `access_token=${generateToken(user)}`)

    
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user).toEqual(user)
  })

  it('Debería devolver success: false si no hay cookie', async () => {
    // Hacemos una petición a /reload sin cookie
    const res = await request(app).get('/reload')

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(false) // success debe ser false cuando no haya cookie
  })
})
