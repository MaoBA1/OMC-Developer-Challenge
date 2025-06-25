import { INTEGER, ENUM, FLOAT, BIGINT } from "sequelize";
import database from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = database.sequelize;

const SensorReading = sequelize.define("sensor-reading", {
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
        type: BIGINT,
        allowNull: false
    },
    temperature: {
        type: FLOAT,
        allowNull: false
    }
})

export default SensorReading;