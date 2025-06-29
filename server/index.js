import express from "express";
import path from 'path';
import dotenv from "dotenv";
import database from "./util/database.js";
import Sensor from "./models/sensor.js";
import SensorReading from "./models/sensorReading.js";
import MalfunctionLog from "./models/malfunctionLog.js";
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

// Serve React static files
app.use(express.static(path.join(process.cwd(), '../client/build')));

app.get('/', (req, res) => {
  res.sendFile(path.join('/app/', 'client/build', 'index.html'));
});

app.get("/api/get_weekly_summary_report", async (req, res) => {
  console.log("/api/get_weekly_summary_report");
  const weeklyReport = await System.generateWeeklyReport("test");
  return res.json({
    weeklyReport,
  });
});

app.get("/api/get_weekly_malfunctioning_summary_report", async (req, res) => {
  console.log("/api/get_weekly_malfunctioning_summary_report");
  const weeklyMalfunctioningReport = await System.generateFaceMalfunctionReport("test");
  return res.json({
    weeklyMalfunctioningReport,
  });
});

app.get("/api/get_all_sensor_grouped_by_face", async (req, res) => {
  console.log("/api/get_weekly_malfunctioning_summary_report");
  const sensors = await System.getAllSensorsGroupedByFace();
  return res.json({
    sensors,
  });
});

app.post("/api/toggle_sensor_state", async (req, res) => {
  console.log("/api/toggle_sensor_state");
  const { sensorId } = req.body;
  const sensors = await System.toggleSensor(sensorId);
  return res.json({
    sensors,
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

      System.createCronJob(System.logGenerateIntervalWildCard, async () =>
        System.sensorReadingGenerator()
      );
      System.createCronJob(System.checkingIntervalWildCard, async () =>
        System.createHourlySummaryForEachFace()
      );
      System.createCronJob(System.reportingIntervalWildCard, async() => System.deleteOldData());

      app.listen(port, '0.0.0.0', () => {
        console.log(`Server is listening on ${port}`);
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });
