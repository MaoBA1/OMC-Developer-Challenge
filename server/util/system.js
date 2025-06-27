import { Op } from "sequelize";
import HourlyFaceSummary from "../models/hourlyFaceSummary.js";
import MalfunctionLog from "../models/malfunctionLog.js";
import Sensor from "../models/sensor.js";
import SensorReading from "../models/sensorReading.js";
import facesEnum from "./facesEnum.js";
import { generateFakeTemperature, getUnixSeconds } from "./functions.js";
import cron from "node-cron";

// Every minuet 0 * * * *
// Every week 0 0 * * 0
class System {
  // static sensorsCount = 10000;
  // static checkingIntervalTime = 3600;
  // static sensorInactivityThreshold = 24 * 60 * 60;
  // static reportingThreshold = 7 * 24 * 60 * 60;
  // static logGenerateIntervalWildCard = "* * * * * *";
  // static checkingIntervalWildCard = "0 * * * *";
  // static reportingIntervalWildcard = "0 0 * * 0";
  // static deviationPercentageLimit = 0.2;

  // values for testing
  static sensorsCount = 12; // 3 sensors per face (north, south, east, west)
  static checkingIntervalTime = 60; // 60 seconds instead of 3600 seconds (1 hour)
  static sensorInactivityThreshold = 2 * 60;
  static reportingThreshold = 2 * 60 * 60;
  static logGenerateIntervalWildCard = "* * * * * *"; // every second
  static checkingIntervalWildCard = "* * * * *"; // every minute
  static reportingIntervalWildcard = "*/5 * * * *"; // every 5 minutes (simulates weekly report)
  static deviationPercentageLimit = 0.03;

  static disabledSensors = true ? [] : Array.from(
    { length: this.sensorsCount },
    (_, i) => i + 1
  )
  // .filter((i) => i === 1 || i === 3 || i === 5);

  // Creating all the sensors for each face of the building
  static async systemInitiator() {
    try {
      const sensorsCount = await Sensor.count();
      if (sensorsCount === 0) {
        for (let i = 1; i <= facesEnum.length; i++) {
          for (let j = 1; j <= this.sensorsCount / facesEnum.length; j++) {
            await Sensor.create({
              face: facesEnum[i - 1],
              timestamp: getUnixSeconds(),
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  static async disableSensors(sensorsIds) {
    await Sensor.update(
      { enabled: false },
      { where: { id: { [Op.in]: sensorsIds } } }
    );
  }

  static async sensorReadingGenerator() {
    const sensors = await Sensor.findAll({
      where: {
        enabled: true,
      },
    });

    const SensorsLogs = sensors.map((sensor) => ({
      sensorId: sensor.id,
      face: sensor.face,
      temperature: generateFakeTemperature(18, 35),
      timestamp: getUnixSeconds(),
    }));
    try {
      await SensorReading.bulkCreate(SensorsLogs);
      const readingsCount = await SensorReading.count();
      console.log("====================================");
      console.log("reading count for second: ", readingsCount);
      console.log("====================================");
    } catch (error) {
      console.log(error);
    }
  }

  static createCronJob(wildcard, job) {
    cron.schedule(wildcard, async () => {
      try {
        await job();
      } catch (error) {
        console.log(error);
      }
    });
    console.log("Cron jobs started");
  }

  // Function receives logs, organizes the logs into an object composed of sensor id as key
  // and sensor data + temperature sum and count, and retrieves the object.
  static organizeLastHourSensorLogsData(logs) {
    let lastHourLogsData = {};
    for (const log of logs) {
      if (!lastHourLogsData[log.sensorId]) {
        lastHourLogsData[log.sensorId] = {
          ...log.sensor.dataValues,
          temperatureSum: log.temperature,
          temperatureCount: 1,
        };
      } else if (lastHourLogsData[log.sensorId]) {
        lastHourLogsData[log.sensorId].temperatureSum += log.temperature;
        lastHourLogsData[log.sensorId].temperatureCount += 1;
      }
    }

    return lastHourLogsData;
  }

  static async faceSensorsMalfunctionCheck(
    face,
    sensorsLastHourLogsData,
    faceAvgTemperature,
    timestamp
  ) {
    for (const [sensorId, sensorData] of Object.entries(
      sensorsLastHourLogsData
    )) {
      try {
        const deviationLimit =
          faceAvgTemperature * this.deviationPercentageLimit;
        const sensorDeviation = Math.abs(
          faceAvgTemperature - sensorData.temperatureAvg
        );
        const deviationPercentage = parseFloat(
          ((sensorDeviation / faceAvgTemperature) * 100).toFixed(2)
        );

        console.log(
          `sensor avg temperature: ${sensorData.temperatureAvg.toFixed(2)}˚`
        );
        console.log(`face avg temperature: ${faceAvgTemperature.toFixed(2)}˚`);
        console.log(`maximum allowed deviation: ${deviationLimit.toFixed(2)}˚`);
        console.log(`sensor deviation: ${sensorDeviation.toFixed(2)}˚`);
        console.log(
          `sensor deviation percentage: ${deviationPercentage.toFixed(2)}%`
        );

        if (sensorDeviation > deviationLimit) {
          await MalfunctionLog.create({
            sensorId,
            face,
            hour: timestamp,
            faceAvgTemperature: faceAvgTemperature,
            sensorAvgTemperature: sensorData.temperatureAvg,
            deviationPercentage,
            loggedAt: timestamp,
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  static async createFaceHourlySummary(face) {
    try {
      const now = getUnixSeconds();
      const oneDayAgo = now - this.sensorInactivityThreshold;

      // Sensor with logs data during the last 24 hours
      const sensorsWithLogs = await Sensor.findAll({
        where: { face, enabled: true },
        include: [
          {
            model: SensorReading,
            required: true,
            where: {
              timestamp: {
                [Op.gt]: oneDayAgo,
                [Op.lte]: now,
              },
            },
          },
        ],
      });

      const activeSensorIds = sensorsWithLogs.map((sensor) => sensor.id);

      // Receiving all the sensor logs for the last hour.
      // - Including only active sensors logs
      const faceLastHourLogs = await SensorReading.findAll({
        where: {
          sensorId: { [Op.in]: activeSensorIds },
          timestamp: {
            [Op.gt]: now - this.checkingIntervalTime,
            [Op.lte]: now,
          },
        },
        include: Sensor,
      });

      // Building an object compose from sensor id as key and sensor data + temperature sum.
      let sensorsLastHourLogsData =
        this.organizeLastHourSensorLogsData(faceLastHourLogs);

      // Accumulating all temperature samples and replacing
      // the accumulated temperature with the average temperature
      const accumulatedTemperature = Object.keys(
        sensorsLastHourLogsData
      ).reduce((temperature, key) => {
        // Extracting the temperature sum from the sensor object
        const {
          temperatureSum,
          temperatureCount,
          ...restOfSensorLastHourLogData
        } = sensorsLastHourLogsData[key];
        // Re-assigning the sensor object with average temperature instead
        sensorsLastHourLogsData[key] = {
          ...restOfSensorLastHourLogData,
          temperatureAvg: parseFloat(
            (temperatureSum / temperatureCount).toFixed(2)
          ),
        };
        // Returning the accumulated temperature for the face
        return temperature + temperatureSum;
      }, 0);

      const avgTemperature = parseFloat(
        (accumulatedTemperature / faceLastHourLogs.length).toFixed(2)
      );

      this.faceSensorsMalfunctionCheck(
        face,
        sensorsLastHourLogsData,
        avgTemperature,
        now
      );

      const hourlyFaceSummary = await HourlyFaceSummary.create({
        face,
        hour: now,
        avgTemperature,
      });
      return hourlyFaceSummary;
    } catch (error) {
      console.log(error);
    }
  }

  static async createHourlySummaryForEachFace() {
    try {
      await Promise.all(
        facesEnum.map(async (face) => this.createFaceHourlySummary(face))
      );
    } catch (error) {
      console.log(error);
    }
  }

  static async generateWeeklyReport() {
    try {
      const now = getUnixSeconds();
      const oneWeekAgo = now - this.reportingThreshold;

      const summaries = await HourlyFaceSummary.findAll({
        where: {
          hour: {
            [Op.gt]: oneWeekAgo,
            [Op.lte]: now,
          },
        },
        order: [["hour", "ASC"]],
      });

      const report = {};

      for (const summary of summaries) {
        const hourTimestamp = summary.hour; // UNIX seconds
        const hourDate = new Date(hourTimestamp * 1000);

        const dayStart = new Date(hourDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayKey = dayStart.toISOString(); // Start of the day

        const hourStart = new Date(hourDate);
        hourStart.setUTCMinutes(0, 0, 0);
        const hourKey = hourStart.toISOString(); // Start of the hour

        if (!report[dayKey]) {
          report[dayKey] = {};
        }

        if (!report[dayKey][hourKey]) {
          report[dayKey][hourKey] = [];
        }

        report[dayKey][hourKey].push(summary.dataValues);
      }

      return report;
    } catch (error) {
      console.error("Failed to generate weekly report:", error);
      return {};
    }
  }
}

export default System;
