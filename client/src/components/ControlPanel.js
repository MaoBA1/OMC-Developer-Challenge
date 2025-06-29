function ControlPanel({ sensors, setSensors }) {
  
  const toggleSensorState = async (sensorId) => {
    const response = await fetch(
      "/api/toggle_sensor_state",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sensorId })
      }
    );
    const data = await response.json();
    setSensors(data.sensors);
  };

  return (
    <div className="flex flex-row flex-wrap justify-center gap-10">
      {sensors.map((face) => {
        return (
          <div
            key={face.face}
            className="flex flex-col items-center p-4 gap-y-4 border-solid border-[1px] w-[40vw] max-h[300px] overflow-hidden overflow-y-auto"
          >
            <div>{face.face.toUpperCase()}</div>
            <div className="flex flex-row flex-wrap gap-2">
              {face.sensors.map((sensor) => {
                return (
                  <button
                    key={sensor.id}
                    className={`flex flex-col items-center justify-center w-[50px] aspect-square border-[2px] border-solid text-white-0 ${
                      sensor.enabled ? "bg-green-enabled" : "bg-red-disabled"
                    }`}
                    onClick={() => toggleSensorState(sensor.id)}
                  >
                    {sensor.id}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ControlPanel;
