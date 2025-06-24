import { INTEGER, ENUM, FLOAT } from "sequelize";
import initializeDatabase from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = initializeDatabase;

const SensorReading = sequelize.define("sensor-reading", {
    id: {
        type: INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    face: ENUM(...facesEnum),
    timestamp: INTEGER,
    temperature: FLOAT
})

export default SensorReading;