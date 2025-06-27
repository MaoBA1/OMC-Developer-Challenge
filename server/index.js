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


app.get("/api/get_weekly_summary_report", async (req, res) => {
  console.log("/api/get_weekly_summary_report");
  const weeklyReport = await System.generateWeeklyReport();
  return res.json({
    weeklyReport,
  });
});

Sensor.hasMany(SensorReading, { foreignKey: "sensorId" });
SensorReading.belongsTo(Sensor, {
  foreignKey: "sensorId",
  constraints: true,
  onDelete: "CASCADE",
});

Sensor.hasMany(MalfunctionLog, { foreignKey: "sensorId" });
MalfunctionLog.belongsTo(Sensor, {
  foreignKey: "sensorId",
  constraints: true,
  onDelete: "CASCADE",
});

database
  .initializeDatabase()
  .then(() => {
    database.sequelize.sync({ force: true }).then(async (result) => {
      await System.systemInitiator();
      console.log(System.disabledSensors);

      await System.disableSensors(System.disabledSensors);
      console.log("System initialized");
      console.log("Waiting for the start of the next full minute...");
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          const now = new Date();
          if (now.getSeconds() === 0) {
            clearInterval(interval);
            resolve();
          }
        }, 100); // Check every 100ms
      });

      System.createCronJob(System.logGenerateIntervalWildCard, async () =>
        System.sensorReadingGenerator()
      );
      System.createCronJob(System.checkingIntervalWildCard, async () =>
        System.createHourlySummaryForEachFace()
      );

      app.listen(port, () => {
        console.log(`Server is listening on ${port}`);
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });
