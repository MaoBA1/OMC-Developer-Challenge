import express from "express";
import dotenv from "dotenv";
import database from "./util/database.js";
import Sensor from "./models/sensor.js";
import SensorReading from "./models/sensorReading.js";
import HourlyFaceSummary from "./models/hourlyFaceSummary.js";
import MalfunctionLog from "./models/malfunctionLog.js";
import { getUnixSeconds } from "./util/functions.js";
import System from "./util/system.js";

dotenv.config();
console.log(
  process.env.PORT,
  process.env.DB_HOST,
  process.env.DB_USER,
  process.env.DB_PASS,
  process.env.DB_NAME
);

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

SensorReading.belongsTo(Sensor, { constraints: true, onDelete: "CASCADE" });
MalfunctionLog.belongsTo(Sensor, { constraints: true, onDelete: "CASCADE" });

database
  .initializeDatabase()
  .then(() => {
    database.sequelize.sync({ force: true }).then(async (result) => {
      await System.systemInitiator();
      System.createCronJob(System.logGenerateIntervalWildCard, () => System.sensorReadingGenerator());
      System.createCronJob(System.checkingIntervalWildCard, () => System.createHourlySummaryForEachFace());

      app.listen(port, () => {
        console.log(`Server is listening on ${port}`);
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });
