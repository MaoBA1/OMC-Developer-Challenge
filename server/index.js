import express from "express";

import sequelize from "./util/database.js";
import Sensor from "./models/sensor.js";
import SensorReading from "./models/sensorReading.js";
import HourlyFaceSummary from "./models/hourlyFaceSummary.js";
import MalfunctionLog from "./models/malfunctionLog.js";

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


SensorReading.belongsTo(Sensor, { constraints: true, onDelete: "CASCADE" });
MalfunctionLog.belongsTo(Sensor, { constraints: true, onDelete: "CASCADE" });


sequelize
  .sync()
  .then((result) => {
    console.log(result);
    app.listen(port, () => {
      console.log(`Server is listening on ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
