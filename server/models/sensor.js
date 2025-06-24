import { INTEGER, ENUM } from "sequelize";
import sequelize from "../util/database";

const Sensor = sequelize.define("sensor", {
    id: {
        type: INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    face: ENUM,
    createdAt: INTEGER
})

export default Sensor;