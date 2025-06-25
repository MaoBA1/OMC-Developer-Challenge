import Sensor from "../models/sensor.js";
import SensorReading from "../models/sensorReading.js";
import facesEnum from "./facesEnum.js";
import { generateFakeTemperature, getUnixSeconds } from "./functions.js";
import cron from 'node-cron';

// Run every hour at minute 0
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly job...');
  // Call your logic to compute hourly summaries or detect malfunctions
});

class System {    
  static async systemInitiator() {
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 25; j++) {
        await Sensor.create({
          face: facesEnum[i - 1],
          timestamp: getUnixSeconds(),
        });
      }
    }
  }

  static async getAllSensors() {
    return await Sensor.findAll();
  }

  static generateSensorReading(sensor) {
    SensorReading.create({
      sensorId: sensor.id,
      face: sensor.face,
      temperature: generateFakeTemperature(18, 28),
      timestamp: getUnixSeconds(),
    });
  }

  static async sensorReadingGenerator() {
    const sensors = await this.getAllSensors();
    sensors.forEach((sensor) => {
      setInterval(() => {
        this.generateSensorReading(sensor);
      }, 1000);
    });
  }
}

export default System;
