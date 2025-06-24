import { INTEGER, ENUM, FLOAT } from "sequelize";
import initializeDatabase from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = initializeDatabase;

const MalfunctionLog = sequelize.define("malfunction-log", {
  id: {
    type: INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  face: ENUM(...facesEnum),
  hour: INTEGER,
  avgTemperature: FLOAT,
  deviationPercentage: FLOAT,
  loggedAt: INTEGER
});

export default MalfunctionLog;
