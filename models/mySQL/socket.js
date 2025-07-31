import { createPool } from "../../config/dbConfig.js";
import { v4 as uuidv4 } from 'uuid';

const pool = createPool()

export class SocketModel {


    static async addMessage(matchId, id_emisor, newMessage) {
        try {
            const id = uuidv4();
            const [result] = await pool.execute(
                `INSERT INTO messages (id, id_match, id_emisor, message)
                 VALUES (?, ?, ?, ?);`,
                [id, matchId, id_emisor, newMessage]
            );
            return result.affectedRows === 1;
        } catch (error) {
            console.error("Error adding message:", error);
            return false;
        }
    }

    static async getUsersFromMatch(matchId) {
        try {
            const [rows] = await pool.execute(
                `SELECT id_profile, id_room FROM matches WHERE id = ?`,
                [matchId]
            );

            if (rows.length === 0) {
                return [null, null]; // No existe el match
            }

            const { id_profile, id_room } = rows[0];
            return [id_profile, id_room];
        } catch (error) {
            console.error("Error fetching users from match:", error);
            return [null, null];
        }
    }

    static async getAllMessage(matchId) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, id_emisor, message
                FROM messages
                WHERE id_match = ?
                ORDER BY created_at ASC;`,
                [matchId]
            )

            return rows;
        } catch (error) {
            console.error("Error fetching messagesfvferrfrefer:", error);
            return [];
        }
    }
}
