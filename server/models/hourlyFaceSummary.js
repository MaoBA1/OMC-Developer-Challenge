import { INTEGER, ENUM, FLOAT } from "sequelize";
import initializeDatabase from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = initializeDatabase;

const HourlyFaceSummary = sequelize.define("hourly-face-summary", {
    id: {
        type: INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    face: ENUM(...facesEnum),
    hour: INTEGER,
    avgTemperature: FLOAT
})

export default HourlyFaceSummary;