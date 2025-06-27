import dotenv from "dotenv";

import mysql from "mysql2/promise";
import { Sequelize } from "sequelize";

dotenv.config();

class Database {
  constructor(dbHost, dbName, dbUser, dbPass) {
    this.dbHost = dbHost;
    this.dbName = dbName;
    this.dbUser = dbUser;
    this.dbPass = dbPass;
    
    const sequelize = new Sequelize(this.dbName, this.dbUser, this.dbPass, {
      host: this.dbHost,
      dialect: "mysql",
      logging: false
    });

    this.sequelize = sequelize;
  }

  async initializeDatabase() {
    const connection = await mysql.createConnection({
      host: this.dbHost,
      user: this.dbUser,
      password: this.dbPass,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${this.dbName}\`;`);
    await connection.end();
  }
}

const db = new Database(
  process.env.DB_HOST,
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS
);

export default await db;
