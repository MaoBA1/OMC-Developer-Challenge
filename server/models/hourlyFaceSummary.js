import { INTEGER, ENUM, FLOAT, BIGINT } from "sequelize";
import database from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = database.sequelize;

const HourlyFaceSummary = sequelize.define("hourly-face-summary", {
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
    hour: {
        type: BIGINT,
        allowNull: false
    },
    avgTemperature: {
        type: FLOAT, 
        allowNull: false
    }
})

export default HourlyFaceSummary;