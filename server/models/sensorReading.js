import { INTEGER, ENUM, FLOAT } from "sequelize";
import sequelize from "../util/database";

const SensorReading = sequelize.define("sensor-reading", {
    id: {
        type: INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    face: ENUM,
    timestamp: INTEGER,
    temperature: FLOAT
})

export default SensorReading;