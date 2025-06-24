import { INTEGER, ENUM, FLOAT } from "sequelize";
import sequelize from "../util/database";

const HourlyFaceSummary = sequelize.define("hourly-face-summary", {
    id: {
        type: INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    face: ENUM,
    hour: INTEGER,
    avgTemperature: FLOAT
})

export default HourlyFaceSummary;