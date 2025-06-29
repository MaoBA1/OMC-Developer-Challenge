import { Chart, registerables } from "chart.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";

Chart.register(...registerables);

function WeeklyReporting(props) {
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [selectedDay, setSelectedSay] = useState(null);

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
          text: selectedDay ? selectedDay : "Chart",
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
  }, [selectedDay]);

  const getWeeklyReport = useCallback(async () => {
    const response = await fetch("/api/get_weekly_summary_report", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log(data);

    const weeklyReportData = data.weeklyReport || {};
    setWeeklyReport(weeklyReportData);
    setSelectedSay(
      Object.keys(weeklyReportData).length > 0
        ? Object.entries(weeklyReportData)[0][0]
        : null
    );
  }, []);

  const data = useMemo(() => {
    if (weeklyReport && selectedDay) {
      return {
        labels: Object.keys(weeklyReport[selectedDay]),
        datasets: ["north", "south", "east", "west"].map((face, index) => {
          return {
            label: face,
            data: Object.keys(weeklyReport[selectedDay]).map(
              (hour) =>
                weeklyReport[selectedDay][hour]
                  .filter((summary) => summary.face === face)
                  .map((summary) => `${summary.avgTemperature}`)[0]
            ),
            backgroundColor: [
              "rgba(255, 99, 132, 0.5)",
              "rgba(53, 162, 235, 0.5)",
              "rgba(53, 62, 235, 0.5)",
              "rgba(53, 362, 25, 0.5)",
            ][index],
          };
        }),
      };
    }
    return { labels: [], datasets: [] };
  }, [weeklyReport, selectedDay]);

  useEffect(() => {
    if (!weeklyReport) {
      getWeeklyReport();
    }
  }, [weeklyReport, getWeeklyReport]);


  return (
    <>
      {!weeklyReport || Object.keys(weeklyReport).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-4 gap-y-4 border-solid border-[1px] w-[50vw] h-[40vh]">
          There is no information yet.
        </div>
      ) : (
        <div className="flex flex-col items-center p-4 gap-y-4 border-solid border-[1px]">
          <div>Last 7 Days</div>
          <div className="flex flex-col border-solid border-[1px] p-4 gap-y-4">
            <div className="flex flex-row flex-wrap gap-x-[10px] gap-y-[10px] border-solid border-[1px] p-4">
              {Object.keys(weeklyReport).map((day, dayIndex) => {
                return (
                  <button
                    className="bg-blue-10 text-white-10 p-2 rounded-md"
                    key={dayIndex}
                    onClick={() => setSelectedSay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="w-[90vw] h-[35vh] border-solid border-[1px]">
              <Line options={options} data={data} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WeeklyReporting;
