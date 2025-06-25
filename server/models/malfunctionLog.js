import { INTEGER, ENUM, FLOAT, BIGINT } from "sequelize";
import database from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = database.sequelize;

const MalfunctionLog = sequelize.define("malfunction-log", {
  id: {
    type: INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  face: ENUM(...facesEnum),
  hour: {
    type: BIGINT,
    allowNull: false
  },
  avgTemperature: {
    type: FLOAT, 
    allowNull: false
  },
  deviationPercentage: {
    type: FLOAT,
    allowNull: false
  },
  loggedAt: {
    type: BIGINT,
    allowNull: false
  }
});

export default MalfunctionLog;
