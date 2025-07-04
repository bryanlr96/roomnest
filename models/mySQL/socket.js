import { createPool } from "../../config/dbConfig.js";

const pool = createPool()

export class SocketModel {
    static async getAllRequests(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT r.id AS requestId, u1.userName AS emisorName, u1.email AS emisorEmail
                 FROM requestTable r
                 JOIN userTable u1 ON r.emisor = u1.id
                 WHERE r.receptor = UUID_TO_BIN(?);`,
                [userId]
            );
            return rows;
        } catch (error) {
            console.error('Error al obtener las solicitudes de la base de datos:', error);
            throw error;
        }
    }

    static async getIdByEmail(email) {
        const [rows] = await pool.execute(
            `SELECT BIN_TO_UUID(id) AS id FROM userTable WHERE email = ?;`,
            [email]
        );
        return rows.length > 0 ? rows[0].id : false;
    }

    static async hasFriendship(user1, user2) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count 
             FROM contactTable 
             WHERE (user1 = UUID_TO_BIN(?) AND user2 = UUID_TO_BIN(?)) 
                OR (user1 = UUID_TO_BIN(?) AND user2 = UUID_TO_BIN(?));`,
            [user1, user2, user2, user1]
        );
        return rows[0].count > 0;
    }

    static async isRequestSent(userEmisorID, userTargetID) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM requestTable
             WHERE emisor = UUID_TO_BIN(?) AND receptor = UUID_TO_BIN(?);`,
            [userEmisorID, userTargetID]
        );
        return rows[0].count > 0;
    }

    // Método para obtener la solicitud entre dos usuarios (si existe)
    static async getRequest(emisor_ID, receptor_ID) {
        try {
            const query = `
            SELECT id 
            FROM requestTable 
            WHERE emisor = UUID_TO_BIN(?) 
              AND receptor = UUID_TO_BIN(?)
          `;
            const [rows] = await pool.execute(query, [receptor_ID, emisor_ID]); // ¡Intercambiados correctamente!
            return rows[0]?.id || null;
        } catch (error) {
            console.error('Error en getRequest:', error);
            throw error;
        }
    }


    static async rejectRequest(request_ID) {
        try {
            const [result] = await pool.execute(
                `DELETE FROM requestTable WHERE id = ?;`,
                [request_ID]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al rechazar la solicitud en la base de datos:', error);
            throw error;
        }
    }

    static async deleteContact(contact_ID) {
        const [result] = await pool.execute(
            `DELETE FROM contactTable WHERE id = ?;`,
            [contact_ID]
        );
        return result.affectedRows > 0;
    }

    static async getEmisor(request_ID) {
        try {
            const [rows] = await pool.execute(
                `SELECT BIN_TO_UUID(emisor) AS emisorID FROM requestTable WHERE id = ?;`,
                [request_ID]
            );
            return rows[0]?.emisorID;
        } catch (error) {
            console.error('Error al obtener emisor:', error);
            throw error;
        }
    }

    static async getContacts(userID) {
        const [rows] = await pool.execute(
            `SELECT c.id AS contactId, u.userName, u.email
             FROM contactTable c
             JOIN userTable u ON u.id = (
                 CASE 
                     WHEN c.user1 = UUID_TO_BIN(?) THEN c.user2 
                     ELSE c.user1 
                 END
             )
             WHERE c.user1 = UUID_TO_BIN(?) OR c.user2 = UUID_TO_BIN(?);`,
            [userID, userID, userID]
        );
        return rows;
    }

    static async addContact(receptor_ID, emisor_ID) {
        const [result] = await pool.execute(
            `INSERT INTO contactTable (user1, user2) 
             VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?));`,
            [emisor_ID, receptor_ID]
        );
        return result.affectedRows > 0;
    }

    static async sendRequest(userEmisorID, userTargetID) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO requestTable (emisor, receptor) 
                 VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?));`,
                [userEmisorID, userTargetID]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error al enviar solicitud:", error);
            return false;
        }
    }

    static async getUsersFromContact(contact_ID) {
        try {
            const [rows] = await pool.execute(
                `SELECT BIN_TO_UUID(user1) AS user1_ID, BIN_TO_UUID(user2) AS user2_ID
                 FROM contactTable
                 WHERE id = ?;`,
                [contact_ID]
            );
            return rows.length > 0 ? [rows[0].user1_ID, rows[0].user2_ID] : [null, null];
        } catch (error) {
            console.error("Error al obtener usuarios del contacto:", error);
            return [null, null];
        }
    }

    static async getReceiverID(contactId, userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    CASE 
                        WHEN user1 = UUID_TO_BIN(?) THEN BIN_TO_UUID(user2)
                        WHEN user2 = UUID_TO_BIN(?) THEN BIN_TO_UUID(user1)
                    END AS receiverId
                 FROM contactTable
                 WHERE id = ?;`,
                [userId, userId, contactId]
            );
            return rows[0]?.receiverId || null;
        } catch (error) {
            console.error("Error fetching receiver ID:", error);
            return null;
        }
    }

    static async addMessage(contactId, senderId, message) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO messagesTable (contactId, senderId, message)
                 VALUES (?, UUID_TO_BIN(?), ?);`,
                [contactId, senderId, message]
            );
            return result.affectedRows === 1;
        } catch (error) {
            console.error("Error adding message:", error);
            return false;
        }
    }

    static async getAllMessage(contactId) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, contactId, BIN_TO_UUID(senderId) AS senderId, message, dateStamp
                 FROM messagesTable
                 WHERE contactId = ?
                 ORDER BY dateStamp ASC;`,
                [contactId]
            )

            return rows;
        } catch (error) {
            console.error("Error fetching messagesfvferrfrefer:", error);
            return [];
        }
    }
}
