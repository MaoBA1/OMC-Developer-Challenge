import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";

function FaceMalfunctioningGraph({ days }) {
  const [selectedMalfunctioningDay, setSelectedMalfunctioningSay] = useState(
    Object.keys(days).length > 0 ? Object.entries(days)[0][0] : null
  );

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: selectedMalfunctioningDay ? selectedMalfunctioningDay : "Chart",
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Temperatures",
            },
          },
          x: {
            title: {
              display: true,
              text: "Hour",
            },
          },
        },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: false,
          callbacks: {
            label: function (context) {
              return `${context.raw}˚`;
            },
          },
        },
      },
    };
  }, [selectedMalfunctioningDay]);

  const data = useMemo(() => {
    if (!days || !selectedMalfunctioningDay)
      return { labels: [], datasets: [] };

    const hours = Object.keys(days[selectedMalfunctioningDay]);

    const sensorMap = {};
    const summaryTemps = [];
    for (const hour of hours) {
      const { malfunctions, summary } = days[selectedMalfunctioningDay][hour];

      summaryTemps.push(summary?.avgTemperature || null);

      for (const log of malfunctions) {
        const { sensorId, sensorAvgTemperature } = log;

        if (!sensorMap[sensorId]) {
          sensorMap[sensorId] = Array(hours.indexOf(hour)).fill(null);
        }

        const expectedLength = hours.indexOf(hour);
        while (sensorMap[sensorId].length < expectedLength) {
          sensorMap[sensorId].push(null);
        }

        sensorMap[sensorId].push(sensorAvgTemperature);
      }
    }

    const maxLength = hours.length;
    Object.keys(sensorMap).forEach((sensorId) => {
      while (sensorMap[sensorId].length < maxLength) {
        sensorMap[sensorId].push(null);
      }
    });

    const sensorDatasets = Object.entries(sensorMap).map(
      ([sensorId, temps], index) => ({
        label: `Sensor ${sensorId}`,
        data: temps,
        borderColor: `hsl(${index * 60}, 70%, 50%)`,
        backgroundColor: `hsl(${index * 60}, 70%, 70%)`,
        spanGaps: true,
      })
    );

    const summaryDataset = {
      label: "Hourly Avg Temperature",
      data: summaryTemps,
      borderColor: "#000000",
      backgroundColor: "#00000050",
      borderWidth: 2,
      pointRadius: 4,
      tension: 0.2,
      spanGaps: true,
    };

    return {
      labels: hours,
      datasets: [summaryDataset, ...sensorDatasets],
    };
  }, [days, selectedMalfunctioningDay]);

  return (
    <>
      {Object.keys(days).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-4 gap-y-4 border-solid border-[1px] w-[44vw] h-[40vh]">
          There is no malfunctioning notifications yet.
        </div>
      ) : (
        <>
          <div className="flex flex-row flex-wrap w-[44vw] gap-x-[10px] gap-y-[10px] border-solid border-[1px] p-4">
            {Object.keys(days).map((day, dayIndex) => {
              return (
                <button
                  className="bg-blue-10 text-white-10 p-2 rounded-md"
                  key={dayIndex}
                  onClick={() => setSelectedMalfunctioningSay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="w-[44vw] h-[32vh] border-solid border-[1px]">
            <Line options={options} data={data} />
          </div>
        </>
      )}
    </>
  );
}

export default FaceMalfunctioningGraph;
