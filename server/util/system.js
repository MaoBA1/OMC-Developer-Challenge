import { Op, where } from "sequelize";
import HourlyFaceSummary from "../models/hourlyFaceSummary.js";
import MalfunctionLog from "../models/malfunctionLog.js";
import Sensor from "../models/sensor.js";
import SensorReading from "../models/sensorReading.js";
import facesEnum from "./facesEnum.js";
import { generateFakeTemperature, getUnixSeconds } from "./functions.js";
import cron from "node-cron";

  
class System {
  // values for testing
  // static sensorsCount = 12;
  // static checkingIntervalTime = 30; // 30s = 1 simulated "hour"
  // static sensorInactivityThreshold = 40; // Must be greater than checkingIntervalTime
  // static reportingThreshold = 7 * 24 * 30; // 84 minutes = 7 simulated days , 12 minutes = 1 simulated day
  // static reportingIntervalWildCard = "0 */84 * * * *";
  // static logGenerateIntervalWildCard = "* * * * * *"; // 1s interval for sensor logs
  // static checkingIntervalWildCard = "*/30 * * * * *"; // Every 30s = 1 simulated hour
  // static deviationPercentageLimit = 0.03;

  static sensorsCount = 10000;
  static checkingIntervalTime = 3600;
  static sensorInactivityThreshold = 24 * 60 * 60;
  static reportingThreshold = 7 * 24 * 60 * 60;
  static reportingIntervalWildCard = "0 0 * * 0";
  static logGenerateIntervalWildCard = "* * * * * *";
  static checkingIntervalWildCard = "0 * * * *";
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

  static async toggleSensor(sensorId) {
    try {
      const sensor = await Sensor.findByPk(sensorId);

      if (!sensor) {
        throw new Error(`Sensor with ID ${sensorId} not found`);
      }

      const newState = !sensor.enabled;

      await Sensor.update({ enabled: newState }, { where: { id: sensorId } });
      console.log(
        `Sensor ${sensorId} is now ${newState ? "enabled" : "disabled"}`
      );
      return await this.getAllSensorsGroupedByFace();      
    } catch (error) {
      console.error(error);
    }
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

  static async generateWeeklyReport(mode = "live") {
    try {
      const now = getUnixSeconds();
      const startTime = now - this.reportingThreshold;

      const summaries = await HourlyFaceSummary.findAll({
        where: {
          hour: {
            [Op.gt]: startTime,
            [Op.lte]: now,
          },
        },
        order: [["hour", "ASC"]],
      });

      if (summaries.length === 0) return {};

      const report = {};

      for (const summary of summaries) {
        const hourTimestamp = summary.hour;

        if (mode === "test") {
          const totalTestDuration = this.reportingThreshold; // 5040 seconds
          const simulatedDayDuration = totalTestDuration / 7; // 720 seconds = 12 minutes per simulated day
          const simulatedHourDuration = simulatedDayDuration / 24; // 30 seconds per simulated hour

          const relativeSec = hourTimestamp - startTime;

          const simulatedDayIndex = Math.floor(
            relativeSec / simulatedDayDuration
          );
          const simulatedHourInDay = Math.floor(
            (relativeSec % simulatedDayDuration) / simulatedHourDuration
          );

          const day = `Simulated Day ${Math.abs(simulatedDayIndex - 7)}`;
          const hour = simulatedHourInDay.toString().padStart(2, "0") + ":00";

          if (!report[day]) report[day] = {};
          if (!report[day][hour]) report[day][hour] = [];

          report[day][hour].push(summary.dataValues);
        } else {
          // Real mode (production)
          const hourDate = new Date(hourTimestamp * 1000);
          let day = hourDate.toLocaleDateString("en-US", {
            weekday: "long",
          });
          let hour = hourDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          if (!report[day]) report[day] = {};
          if (!report[day][hour]) report[day][hour] = [];

          report[day][hour].push(summary.dataValues);
        }
      }

      for (const day in report) {
        const sortedHours = Object.keys(report[day]).sort(); // ascending order
        const sortedHourMap = {};

        for (const hour of sortedHours) {
          sortedHourMap[hour] = report[day][hour];
        }

        report[day] = sortedHourMap;
      }
      return report;
    } catch (error) {
      console.error("Failed to generate weekly report:", error);
      return {};
    }
  }

  static async generateFaceMalfunctionReport(mode = "live") {
    try {
      const now = getUnixSeconds();
      const startTime = now - this.reportingThreshold;

      const summaries = await HourlyFaceSummary.findAll({
        where: {
          hour: { [Op.gt]: startTime, [Op.lte]: now },
        },
        order: [["hour", "ASC"]],
        raw: true,
      });

      const malfunctions = await MalfunctionLog.findAll({
        where: {
          loggedAt: { [Op.gt]: startTime, [Op.lte]: now },
        },
        order: [["loggedAt", "ASC"]],
        raw: true,
      });

      const faceReports = [];

      for (const face of facesEnum) {
        const report = {};
        const faceSummaries = summaries.filter((s) => s.face === face);
        const faceMalfunctions = malfunctions.filter((m) => m.face === face);

        for (const summary of faceSummaries) {
          const hourTimestamp = summary.hour;

          // Format simulated or real time
          let day, hour;
          if (mode === "test") {
            const totalDuration = this.reportingThreshold;
            const simulatedDayDuration = totalDuration / 7;
            const simulatedHourDuration = simulatedDayDuration / 24;
            const relativeSec = hourTimestamp - startTime;
            const simulatedDayIndex = Math.floor(
              relativeSec / simulatedDayDuration
            );
            const simulatedHourInDay = Math.floor(
              (relativeSec % simulatedDayDuration) / simulatedHourDuration
            );
            day = `Simulated Day ${Math.abs(simulatedDayIndex - 7)}`;
            hour = simulatedHourInDay.toString().padStart(2, "0") + ":00";
          } else {
            const date = new Date(hourTimestamp * 1000);
            day = date.toLocaleDateString("en-US", { weekday: "long" });
            hour = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          }

          if (!report[day]) report[day] = {};
          if (!report[day][hour])
            report[day][hour] = {
              summary: null,
              malfunctions: [],
            };

          report[day][hour].summary = summary;

          const relatedMalfunctions = faceMalfunctions.filter(
            (m) => m.hour === summary.hour
          );

          report[day][hour].malfunctions.push(...relatedMalfunctions);
        }

        faceReports.push({
          face,
          days: report,
        });
      }

      return faceReports;
    } catch (error) {
      console.error("Failed to generate face malfunction report:", error);
      return [];
    }
  }

  static async deleteOldData() {
    const deleteFrom = getUnixSeconds() - this.reportingThreshold;
    try {
      await HourlyFaceSummary.destroy({
        where: {
          hour: {
            [Op.lt]: deleteFrom,
          },
        },
      });

      await SensorReading.destroy({
        where: {
          timestamp: {
            [Op.lt]: deleteFrom,
          },
        },
      });
      console.log("Old data was removed");
    } catch (error) {
      console.log(error);
    }
  }

  static async getAllSensorsGroupedByFace() {
    const sensors = await Sensor.findAll();
    return facesEnum.map((face) => {
      return {
        face,
        sensors: sensors.filter((sensor) => sensor.face === face),
      };
    });
  }
}

export default System;
