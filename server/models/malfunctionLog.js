import { INTEGER, ENUM, FLOAT } from "sequelize";
import sequelize from "../util/database";

const MalfunctionLog = sequelize.define("malfunction-log", {
  id: {
    type: INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  face: ENUM,
  hour: INTEGER,
  avgTemperature: FLOAT,
  deviationPercentage: FLOAT,
  loggedAt: INTEGER
});

export default MalfunctionLog;
