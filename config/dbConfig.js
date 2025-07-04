import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config(); 

// Configuraciones de las bases de datos
const dbConfig = {
  mysql: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DB_NAME,
    waitForConnections: true, // Asegura que las conexiones se mantengan abiertas
    connectionLimit: 10, // Número máximo de conexiones simultáneas
    queueLimit: 0 // Sin límite en la cola de conexiones
  },
};


export function createPool() {
  const selectedConfig = dbConfig[process.env.DB_TYPE || 'mysql']; // Selección dinámica de la DB (mysql por defecto)
  return mysql.createPool(selectedConfig);
}


