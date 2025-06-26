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
  // static sensorsCount = 100;
  // static checkingIntervalTime = 3600;
  // static logGenerateIntervalWildCard = "* * * * * *";
  // static checkingIntervalWildCard = "0 * * * *";
  // static reportingIntervalWildcard = "0 0 * * 0";

  static sensorsCount = 12; // 3 sensors per face (north, south, east, west)
  static checkingIntervalTime = 60; // 60 seconds instead of 3600 seconds (1 hour)
  static logGenerateIntervalWildCard = "* * * * * *"; // every second
  static checkingIntervalWildCard = "* * * * *"; // every minute
  static reportingIntervalWildcard = "*/5 * * * *"; // every 5 minutes (simulates weekly report)
  static deviationPercentageLimit = 0.2;

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

  static async getAllSensors() {
    return await Sensor.findAll();
  }

  static async sensorReadingGenerator() {
    const sensors = await this.getAllSensors();
    const SensorsLogs = sensors.map((sensor) => ({
      sensorId: sensor.id,
      face: sensor.face,
      temperature: generateFakeTemperature(18, 28),
      timestamp: getUnixSeconds(),
    }));
    try {
      await SensorReading.bulkCreate(SensorsLogs);
    } catch (error) {
      console.log(error);
    }
  }

  static createCronJob(wildcard, job) {
    cron.schedule(wildcard, job);
  }

  // Function receives logs, organizes the logs into an object composed of sensor id as key
  // and sensor data + temperature sum, and retrieves the object.
  static organizeLastHourSensorLogsData(logs) {
    let lastHourLogsData = {};
    for (const log of logs) {
      if (Object.keys(lastHourLogsData).length === 0) {
        lastHourLogsData[log.sensorId] = {
          ...log.sensor,
          temperatureSum: log.temperature,
        };
      } else if (lastHourLogsData[log.sensorId]) {
        lastHourLogsData[log.sensorId]["temperatureSum"] += log.temperature;
      }
    }
    return lastHourLogsData;
  }

  static async faceSensorsMalfunctionCheck(
    face,
    sensorsLastHourLogsData,
    hourlyAccumulatedTemperature,
    timestamp
  ) {
    for (const [sensorId, sensorData] of Object.entries(
      sensorsLastHourLogsData
    )) {
      try {
        const deviationLimit =
          hourlyAccumulatedTemperature * this.deviationPercentageLimit;
        const sensorDeviation = Math.abs(
          hourlyAccumulatedTemperature - sensorData.temperatureAvg
        );

        if (sensorDeviation > deviationLimit) {
          await MalfunctionLog.create({
            sensorId,
            face,
            hour: timestamp,
            avgTemperature: sensorData.temperatureAvg,
            deviationPercentage:
              (sensorDeviation / hourlyAccumulatedTemperature) * 100,
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
      // Receiving all the sensor logs for the last hour.
      const faceLastHourLogs = await SensorReading.findAll({
        where: {
          timestamp: getUnixSeconds() - this.checkingIntervalTime,
          face,
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
        const { temperatureSum, ...restOfSensorLastHourLogData } =
          sensorsLastHourLogsData[key];
        // Re-assigning the sensor object with average temperature instead
        sensorsLastHourLogsData[key] = {
          ...restOfSensorLastHourLogData,
          temperatureAvg: temperatureSum / this.checkingIntervalTime,
        };
        // Returning the accumulated temperature for the face
        return temperature + temperatureSum;
      }, 0);

      this.faceSensorsMalfunctionCheck(
        face,
        sensorsLastHourLogsData,
        accumulatedTemperature,
        getUnixSeconds()
      );

      const faceSensorsCount = this.sensorsCount / facesEnum.length;
      const avgTemperature = accumulatedTemperature / faceSensorsCount;

      const hourlyFaceSummary = await HourlyFaceSummary.create({
        face,
        hour: getUnixSeconds(),
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
}

export default System;
