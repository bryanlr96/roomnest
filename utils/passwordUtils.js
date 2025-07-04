import bcrypt from 'bcrypt';

// Función para generar un hash de la contraseña
export const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Función para comparar una contraseña con su hash
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};