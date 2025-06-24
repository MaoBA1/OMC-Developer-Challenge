import { INTEGER, ENUM } from "sequelize";
import initializeDatabase from "../util/database.js";
import facesEnum from "../util/facesEnum.js";

const sequelize = initializeDatabase;

const Sensor = sequelize.define("sensor", {
    id: {
        type: INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    face: ENUM(...facesEnum)
}, {
  timestamps: true
})

export default Sensor;