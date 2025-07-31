import { hashPassword, comparePassword } from '../../utils/passwordUtils.js';
import { createPool } from '../../config/dbConfig.js'; // Ahora importamos createPool
import { v4 as uuidv4 } from 'uuid';

const pool = createPool(); // Creamos el pool una vez


export class HttpModel {

    //metodo estatico para el reload
    static async getAllByUserId(userId) {
        const connection = await pool.getConnection();

        try {
            // 1️⃣ Buscar el usuario
            const [users] = await connection.query(
                `SELECT id, email, name, dni, last_connection_type FROM users WHERE id = ?;`,
                [userId]
            );

            if (users.length === 0) {
                return { success: false, message: "Usuario no encontrado" };
            }

            const user = users[0];

            // 2️⃣ Buscar el perfil
            const [profiles] = await connection.query(
                `SELECT * FROM profile WHERE id_user = ?;`,
                [user.id]
            );

            let profile = profiles.length > 0 ? profiles[0] : null;

            // 3️⃣ Añadir imágenes si hay perfil
            if (profile) {
                const [profileImages] = await connection.query(
                    `SELECT url FROM images WHERE reference_type = 'profile' AND id_reference = ?;`,
                    [String(profile.id)]
                );

                profile.images = profileImages.map(img => img.url);
            }

            // 4️⃣ Buscar las rooms
            const [rooms] = await connection.query(
                `SELECT * FROM room WHERE user_id = ?;`,
                [user.id]
            );

            const userRooms = [];

            // 5️⃣ Añadir imágenes a cada room
            for (const room of rooms) {
                const [roomImages] = await connection.query(
                    `SELECT url FROM images WHERE reference_type = 'room' AND id_reference = ?;`,
                    [String(room.id)]
                );

                room.images = roomImages.map(img => img.url);
                userRooms.push(room);
            }

            return { success: true, user, profile, rooms: userRooms };

        } catch (error) {
            console.error('Error en getAllByUserId:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }

    // metodo estatico para el login
    static async login({ email, password }) {
        const connection = await pool.getConnection();

        try {
            // 1️⃣ Buscar al usuario
            const [users] = await connection.query(
                `SELECT id, email, password, name, dni, last_connection_type FROM users WHERE email = ?;`,
                [email]
            );

            if (users.length === 0) {
                return { success: false, message: "Usuario no encontrado" };
            }

            const user = users[0];
            const isMatch = await comparePassword(password, user.password);

            if (!isMatch) {
                return { success: false, message: "Contraseña incorrecta" };
            }

            // 2️⃣ Buscar el perfil
            const [profiles] = await connection.query(
                `SELECT * FROM profile WHERE id_user = ?;`,
                [user.id]
            );

            let profile = profiles.length > 0 ? profiles[0] : null;

            // 3️⃣ Añadir imágenes al perfil si existe
            if (profile) {
                const [profileImages] = await connection.query(
                    `SELECT url FROM images WHERE reference_type = 'profile' AND id_reference = ?;`,
                    [String(profile.id)]
                );

                profile.images = profileImages.map(img => img.url);
            }

            // 4️⃣ Buscar rooms
            const [rooms] = await connection.query(
                `SELECT * FROM room WHERE user_id = ?;`,
                [user.id]
            );

            const userRooms = [];

            // 5️⃣ Añadir imágenes a cada room
            for (const room of rooms) {
                const [roomImages] = await connection.query(
                    `SELECT url FROM images WHERE reference_type = 'room' AND id_reference = ?;`,
                    [String(room.id)]
                );

                room.images = roomImages.map(img => img.url);
                userRooms.push(room);
            }

            return { success: true, user, profile, rooms: userRooms };

        } catch (error) {
            console.error('Error en la consulta de usuario:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }


    // Función para crear un nuevo usuario
    static async register({ email, password, name, dni, last_connection_type }) {
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
            const hashedPassword = await hashPassword(password)

            // Insertar nuevo usuario
            await connection.execute(
                "INSERT INTO users (id, email, password, name, dni, last_connection_type) VALUES (UUID(), ?, ?, ?, ?, ?);",
                [email, hashedPassword, name, dni, last_connection_type]
            )

            // Traer el usuario recién creado para devolverlo
            const [users] = await connection.query(
                "SELECT id, email, name, dni, last_connection_type FROM users WHERE email = ?;",
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
        const { id, email, name, password } = user;
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
            if (password) {
                const hashedPass = await hashPassword(password);
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
    static async createProfile({ id_user, birthdate, situation, gender, children, province, profileDescription }) {
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
          INSERT INTO profile (id, id_user, birthdate, situation, gender, children, province, profileDescription)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?);
        `,
                [id_user, birthdate, situation, gender, children, province, profileDescription]
            );

            // Traer el perfil recién creado
            const [profiles] = await connection.query(
                `
                SELECT * FROM profile WHERE id_user = ?;
                `,
                [id_user]
            );

            const profile = profiles[0];
            profile.images = [];
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
                'provience',
                'profileDescription',
                // Campos de convivencia
                'smoker', 'pets', 'only_girls', 'only_boys', 'lgbt_friendly',
                'calm_environment', 'party_friendly',

                // Campos sobre el inmueble
                'admit_couples', 'admit_minors', 'air_conditioning', 'padron',
                'furnished', 'elevator', 'private_bathroom',
                'double_room', 'single_room', 'heating', 'professional_cleaning',
                'street_view', 'balcony', 'terrace',
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

            const profile = updatedProfiles[0]
            const [profileImages] = await connection.query(
                `SELECT url FROM images WHERE reference_type = 'profile' AND id_reference = ?`,
                [id]
            );

            profile.images = profileImages.map(img => img.url);

            return { success: true, profile };

        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }


    static async createRoom(roomData) {
        const {
            user_id,
            province,
            municipality,
            street,
            floor,
            cp,
            price,
            meters,
            tenants,
            roomDescription
        } = roomData;

        const connection = await pool.getConnection();
        const newRoomId = uuidv4();
        try {
            // Insertar la nueva habitación
            await connection.execute(
                `INSERT INTO room 
            (id, user_id, province, municipality, street, floor, cp, price, meters, tenants, roomDescription)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newRoomId,
                    user_id,
                    province,
                    municipality,
                    street,
                    floor,
                    cp,
                    price,
                    meters,
                    tenants,
                    roomDescription
                ]
            );

            // Obtener la habitación recién creada
            const [roomResult] = await connection.query(
                `SELECT * FROM room WHERE id = ?`,
                [newRoomId]
            );
            const room = roomResult[0];

            // Añadir array de imágenes vacío (ya que es nueva)
            room.images = [];

            // Obtener todas las habitaciones del usuario
            const [roomsResult] = await connection.query(
                `SELECT * FROM room WHERE user_id = ?`,
                [user_id]
            );

            const rooms = roomsResult.length > 0 ? roomsResult : [];

            // Para cada habitación obtener sus imágenes y añadirlas como array
            for (const r of rooms) {
                const [roomImages] = await connection.query(
                    `SELECT url FROM images WHERE reference_type = 'room' AND id_reference = ?`,
                    [r.id]
                );
                r.images = roomImages.map(img => img.url);
            }

            return {
                success: true,
                room,
                rooms
            };

        } catch (error) {
            console.error('Error en HttpModel.createRoom:', error);
            return {
                success: false,
                message: 'Error al crear la habitación'
            };
        } finally {
            connection.release();
        }
    }


    static async updateRoom(updatedRoom) {
        const {
            id,
            user_id,
            municipality,
            street,
            floor,
            cp,
            meters,
            active_room, // lo excluimos de editable
            ...restFields
        } = updatedRoom;

        const connection = await pool.getConnection();

        try {
            const [rooms] = await connection.query(
                'SELECT * FROM room WHERE id = ?',
                [id]
            );

            if (rooms.length === 0) {
                return { success: false, message: "Habitación no encontrada" };
            }

            const allowedFields = [
                'price',
                'tenants',
                'roomDescription',
                'smoker', 'pets', 'only_girls', 'only_boys', 'lgbt_friendly',
                'calm_environment', 'party_friendly',
                'admit_couples', 'admit_minors', 'air_conditioning', 'padron',
                'furnished', 'elevator', 'private_bathroom',
                'double_room', 'single_room', 'heating', 'professional_cleaning',
                'street_view', 'balcony', 'terrace'
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

            await connection.execute(
                `UPDATE room SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            // Obtener la habitación actualizada
            const [updatedRoomResult] = await connection.query(
                `SELECT * FROM room WHERE id = ?`,
                [id]
            );
            const updatedRoomData = updatedRoomResult[0];

            // Obtener imágenes para la habitación actualizada
            const [updatedRoomImages] = await connection.query(
                `SELECT url FROM images WHERE reference_type = 'room' AND id_reference = ?`,
                [updatedRoomData.id]
            );
            updatedRoomData.images = updatedRoomImages.map(img => img.url);

            // Obtener todas las habitaciones del usuario
            const [updatedRoomsResult] = await connection.query(
                `SELECT * FROM room WHERE user_id = ?`,
                [updatedRoomData.user_id]
            );

            const updatedRooms = updatedRoomsResult.length > 0 ? updatedRoomsResult : [];

            // Obtener imágenes para cada habitación
            for (const r of updatedRooms) {
                const [roomImages] = await connection.query(
                    `SELECT url FROM images WHERE reference_type = 'room' AND id_reference = ?`,
                    [r.id]
                );
                r.images = roomImages.map(img => img.url);
            }

            return { success: true, room: updatedRoomData, rooms: updatedRooms };

        } catch (error) {
            console.error('Error actualizando habitación:', error);
            return { success: false, message: "Error interno del servidor" };
        } finally {
            connection.release();
        }
    }


    // antes de enviar el like se comprueba que existan los ids
    static async checkIdExists(id) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                `SELECT 1 FROM profile WHERE id = ? 
         UNION 
         SELECT 1 FROM room WHERE id = ?`,
                [id, id]
            );
            return rows.length > 0;
        } finally {
            connection.release();
        }
    }

    // metodo para enviar likes
    static async insertLike(id_emisor, id_receptor) {
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO likes (id_emisor, id_receptor) VALUES (?, ?)',
                [id_emisor, id_receptor]
            );
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return false; // Ya existía ese like
            }
            throw error;
        } finally {
            connection.release();
        }
    }

    // metodo para eliminar likes
    static async deleteLike(id_emisor, id_receptor) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'DELETE FROM likes WHERE id_emisor = ? AND id_receptor = ?',
                [id_emisor, id_receptor]
            );
            return result.affectedRows === 1;
        } finally {
            connection.release();
        }
    }


    static async getProfiles(user_id, roomId) {
        const connection = await pool.getConnection();
        try {
            const [profiles] = await connection.query(
                `SELECT p.*, u.name
                FROM profile p
                JOIN users u ON p.id_user = u.id
                WHERE p.id_user != ? AND p.active_profile = TRUE`,
                [user_id]
            );

            if (!profiles || profiles.length === 0) {
                return [];
            }

            for (const profile of profiles) {
                // Añadir imágenes
                const [images] = await connection.query(
                    `SELECT url FROM images 
                    WHERE reference_type = 'profile' AND id_reference = ?`,
                    [profile.id]
                );
                profile.images = images.map(img => img.url);

                // Comprobar si el perfil ha dado like a la room
                const [likes] = await connection.query(
                    `SELECT 1 FROM likes 
                    WHERE id_emisor = ? AND id_receptor = ? 
                    LIMIT 1`,
                    [roomId, profile.id]
                );
                profile.liked = likes.length > 0;
            }

            return profiles;

        } catch (error) {
            console.error('Error en HttpModel.getProfiles:', error);
            throw error;

        } finally {
            connection.release();
        }
    }


    static async getRooms(user_id, profileId) {
        const connection = await pool.getConnection();

        try {
            const [rooms] = await connection.query(
                `SELECT * FROM room 
                WHERE user_id != ? AND active_room = TRUE`,
                [user_id]
            );

            if (!rooms || rooms.length === 0) {
                return [];
            }

            for (const room of rooms) {
                // Añadir imágenes
                const [images] = await connection.query(
                    `SELECT url FROM images 
                    WHERE reference_type = 'room' AND id_reference = ?`,
                    [room.id]
                );
                room.images = images.map(img => img.url);

                // Comprobar si el perfil le ha dado like
                const [likes] = await connection.query(
                    `SELECT 1 FROM likes 
                    WHERE id_emisor = ? AND id_receptor = ? 
                    LIMIT 1`,
                    [profileId, room.id]
                );
                room.liked = likes.length > 0;
            }

            return rooms;

        } catch (error) {
            console.error('Error en HttpModel.getRooms:', error);
            throw error;

        } finally {
            connection.release();
        }
    }



    static async saveImagesForReference(id_reference, reference_type, imagePaths, userId) {
        const connection = await pool.getConnection();

        try {
            // Validar tipo de referencia
            if (!['room', 'profile'].includes(reference_type)) {
                return { success: false, message: 'Tipo de referencia inválido' };
            }

            // Preparar los datos para inserción masiva
            const values = imagePaths.map(url => [uuidv4(), id_reference, reference_type, url]);

            await connection.query(
                `INSERT INTO images (id, id_reference, reference_type, url) VALUES ?`,
                [values]
            );

            return await this.getAllByUserId(userId);

        } catch (error) {
            console.error('Error en saveImagesForReference:', error);
            return { success: false, message: 'Error al guardar las imágenes' };
        } finally {
            connection.release();
        }
    }


    static async getRoomMatch(roomId) {
        const [rows] = await pool.execute(
            `SELECT 
            ANY_VALUE(m.id) AS matchId,
            p.*, 
            u.name, 
            u.email,
            JSON_ARRAYAGG(i.url) AS images
            FROM matches m
            JOIN profile p ON m.id_profile = p.id
            JOIN users u ON p.id_user = u.id
            LEFT JOIN images i ON i.id_reference = p.id AND i.reference_type = 'profile'
            WHERE m.id_room = ? AND m.active_match = TRUE
            GROUP BY p.id`,
            [roomId]
        );
        return rows;
    }


    static async getProfileMatch(profileId) {
        const [rows] = await pool.execute(
            `SELECT 
            ANY_VALUE(m.id) AS matchId,
            r.*, 
            JSON_ARRAYAGG(i.url) AS images
            FROM matches m
            JOIN room r ON m.id_room = r.id
            LEFT JOIN images i ON i.id_reference = r.id AND i.reference_type = 'room'
            WHERE m.id_profile = ? AND m.active_match = TRUE
            GROUP BY r.id`,
            [profileId]
        );
        return rows;
    }


    static async profiletoroom(userId) {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET last_connection_type = ? WHERE id = ?',
                ['room', userId]
            );

            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0
                    ? 'Tipo de conexión actualizado a room.'
                    : 'Usuario no encontrado.'
            };
        } catch (error) {
            console.error('Error en profiletoroom:', error);
            return {
                success: false,
                message: 'Error al actualizar el tipo de conexión.'
            };
        }
    }

    static async roomtoprofile(userId) {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET last_connection_type = ? WHERE id = ?',
                ['profile', userId]
            );

            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0
                    ? 'Tipo de conexión actualizado a room.'
                    : 'Usuario no encontrado.'
            };
        } catch (error) {
            console.error('Error en profiletoroom:', error);
            return {
                success: false,
                message: 'Error al actualizar el tipo de conexión.'
            };
        }
    }
}
