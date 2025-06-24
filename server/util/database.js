import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

const DB_NAME = 'system-data';
const DB_USER = 'root';
const DB_PASS = 'Aa123456!';
const DB_HOST = 'localhost';

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
  await connection.end();

  const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: 'mysql',
  });

  return sequelize;
}


export default await initializeDatabase();
