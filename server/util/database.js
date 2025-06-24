import { Sequelize } from "sequelize";

const sequelize = new Sequelize("system-data", "root", "Aa123456!", {
  dialect: "mysql",
  host: "localhost",
});

export default sequelize;
