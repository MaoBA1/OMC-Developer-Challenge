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
      logging: false,
    });

    this.sequelize = sequelize;
  }

  async initializeDatabase(retries = 20, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await mysql.createConnection({
        host: this.dbHost,
        user: this.dbUser,
        password: this.dbPass,
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${this.dbName}\`;`);
      await connection.end();
      console.log("✅ MySQL is ready");
      break;
    } catch (error) {
      console.log(`MySQL not ready, retrying... (${attempt})`);
      if (attempt === retries) {
        throw new Error("MySQL is not ready after retries.");
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
}

const db = new Database(
  process.env.DB_HOST,
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS
);

export default await db;
