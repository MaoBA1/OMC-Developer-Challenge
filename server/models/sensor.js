import { INTEGER, ENUM, BIGINT, BOOLEAN } from "sequelize";
import database from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = database.sequelize;

const Sensor = sequelize.define("sensor", {
    id: {
        type: INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    face: {
      type: ENUM(...facesEnum),
      allowNull: false
    },
    timestamp: {
      allowNull: false,
      type: BIGINT
    },
    enabled: {
      type: BOOLEAN,
      defaultValue: true,
      allowNull: false,
    }
});

export default Sensor;