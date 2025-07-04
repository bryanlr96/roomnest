import { hashPassword, comparePassword } from '../../utils/passwordUtils.js';
import { createPool } from '../../config/dbConfig.js'; // Ahora importamos createPool

const pool = createPool(); // Creamos el pool una vez


export class HttpModel {

    static async login({ email, pass }) {
        const connection = await pool.getConnection(); // Obtener una conexión del pool

        try {
            // Buscar el usuario
            const [users] = await connection.query(
                `SELECT id, email, password, name, dni FROM users WHERE email = ?;`,
                [email]
            );

            if (users.length === 0) {
                return { success: false, message: "Usuario no encontrado" };
            }

            const user = users[0];
            const isMatch = await comparePassword(pass, user.password);

            if (!isMatch) {
                return { success: false, message: "Contraseña incorrecta" };
            }

            delete user.password; // Nunca devolver el password

            // Buscar el perfil del usuario
            const [profiles] = await connection.query(
                `SELECT * FROM profile WHERE id_user = ?;`,
                [user.id]
            );

            const profile = profiles.length > 0 ? profiles[0] : null;

            return { success: true, user, profile };

        } catch (error) {
            console.error('Error en la consulta de usuario:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release(); // Liberar la conexión
        }
    }


    // Función para crear un nuevo usuario
    static async register({ email, pass, name, dni }) {
        const connection = await pool.getConnection();

        try {
            // Comprobar si existe un usuario con el mismo email
            const [usersWithEmail] = await connection.query(
                "SELECT id FROM users WHERE email = ?;",
                [email]
            )
            if (usersWithEmail.length > 0) {
                return { success: false, message: "Ya existe un usuario con este correo" }
            }

            // Comprobar si existe un usuario con el mismo dni
            const [usersWithDni] = await connection.query(
                "SELECT id FROM users WHERE dni = ?;",
                [dni]
            )
            if (usersWithDni.length > 0) {
                return { success: false, message: "Ya existe un usuario con este DNI" }
            }

            // Hashear la contraseña
            const hashedPassword = await hashPassword(pass)

            // Insertar nuevo usuario
            await connection.execute(
                "INSERT INTO users (id, email, password, name, dni) VALUES (UUID(), ?, ?, ?, ?);",
                [email, hashedPassword, name, dni]
            )

            // Traer el usuario recién creado para devolverlo
            const [users] = await connection.query(
                "SELECT id, email, name, dni FROM users WHERE email = ?;",
                [email]
            )

            const user = users[0];
            return { success: true, user };

        } catch (error) {
            console.error('Error creando usuario:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }

    // actualizar el usuario
    static async updateUser(user) {
        const { id, email, name, pass } = user;
        const connection = await pool.getConnection();

        try {
            // Verificar usuario
            const [users] = await connection.query('SELECT id, email FROM users WHERE id = ?', [id]);
            if (users.length === 0) {
                return { success: false, message: "Usuario no encontrado" };
            }

            // Si cambia email, verificar disponibilidad
            if (email && email !== users[0].email) {
                const [existingEmails] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
                if (existingEmails.length > 0) {
                    return { success: false, message: "El correo ya está en uso" };
                }
            }

            // Preparar campos a actualizar solo si existen y no están vacíos
            const updateFields = [];
            const updateValues = [];

            if (email) {
                updateFields.push('email = ?');
                updateValues.push(email);
            }
            if (name) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            if (pass) {
                const hashedPass = await hashPassword(pass);
                updateFields.push('password = ?');
                updateValues.push(hashedPass);
            }

            if (updateFields.length === 0) {
                return { success: false, message: "No hay campos para actualizar" };
            }

            updateValues.push(id);

            await connection.execute(
                `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            // Traer usuario actualizado
            const [updatedUsers] = await connection.query(
                'SELECT id, email, name, dni FROM users WHERE id = ?',
                [id]
            );

            return { success: true, user: updatedUsers[0] };
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }

    // crear perfil
    static async createProfile({ id_user, birthdate, situation, gender, children }) {
        const connection = await pool.getConnection();

        try {
            // Verificar que exista el usuario
            const [users] = await connection.query(
                'SELECT id FROM users WHERE id = ?;',
                [id_user]
            );

            if (users.length === 0) {
                return { success: false, message: "El usuario no existe" };
            }

            // Verificar que no exista ya un perfil
            const [existingProfiles] = await connection.query(
                'SELECT id FROM profile WHERE id_user = ?;',
                [id_user]
            );

            if (existingProfiles.length > 0) {
                return { success: false, message: "Este usuario ya tiene un perfil creado" };
            }

            // Insertar perfil nuevo
            await connection.execute(
                `
          INSERT INTO profile (id, id_user, birthdate, situation, gender, children)
          VALUES (UUID(), ?, ?, ?, ?, ?);
        `,
                [id_user, birthdate, situation, gender, children]
            );

            // Traer el perfil recién creado
            const [profiles] = await connection.query(
                `
                SELECT * FROM profile WHERE id_user = ?;
                `,
                [id_user]
            );

            const profile = profiles[0];
            return { success: true, profile };

        } catch (error) {
            console.error('Error creando perfil:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }

    // Actualizar el perfil
    static async updateProfile(updatedProfile) {
        const {
            id,         // obligatorio
            id_user,    // no editable
            birthdate,  // no editable
            active_profile, // no editable
            ...restFields   // campos editables
        } = updatedProfile;

        const connection = await pool.getConnection();

        try {
            const [profiles] = await connection.query(
                'SELECT * FROM profile WHERE id = ?',
                [id]
            );

            if (profiles.length === 0) {
                return { success: false, message: "Perfil no encontrado" };
            }

            const allowedFields = [
                'situation',
                'gender',
                'children',

                // Campos de convivencia
                'smoker', 'pets', 'only_girls', 'only_boys', 'lgbt_friendly',
                'calm_environment', 'party_friendly',

                // Campos sobre el inmueble
                'admit_couples', 'admit_minors', 'air_conditioning', 'padron',
                'furnished', 'elevator', 'private_bathroom',
                'double_room', 'single_room', 'heating', 'professional_cleaning',
                'street_view', 'balcony'
            ];

            const updateFields = [];
            const updateValues = [];

            for (const field of allowedFields) {
                if (restFields[field] !== undefined) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(restFields[field]);
                }
            }

            if (updateFields.length === 0) {
                return { success: false, message: "No hay campos para actualizar" };
            }

            updateValues.push(id);

            // 3. Ejecutar el UPDATE
            await connection.execute(
                `UPDATE profile SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            // 4. Traer perfil actualizado (todo)
            const [updatedProfiles] = await connection.query(
                `SELECT * FROM profile WHERE id = ?`,
                [id]
            );

            return { success: true, profile: updatedProfiles[0] };

        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }


}
