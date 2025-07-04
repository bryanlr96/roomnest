import jwt from 'jsonwebtoken'

const addSession = (req, res, next) => {
    const token = req.cookies.access_token
    req.session = { user: null }
    if(!token) return next()
        
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET)

        // limpiamos el user para que no tenga los datos del token innecesarios como la fecha de exp
        const { iat, exp, ...userWithoutTokenProps } = data
        req.session.user = userWithoutTokenProps

    } catch { }

    next()
}

export default addSession