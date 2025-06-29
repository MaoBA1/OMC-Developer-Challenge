import { useCallback, useEffect, useState } from "react";
import WeeklyReporting from "./WeeklyReporting";
import FaceMalfunctioningGraph from "./FaceMalfunctioningGraph";

function Reporting(props) {
  const [weeklyMalfunctioningReport, setWeeklyMalfunctioningReport] =
    useState(null);

  const getWeeklyMalfunctioningReport = useCallback(async () => {
    const response = await fetch(
      "/api/get_weekly_malfunctioning_summary_report",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    console.log(data);

    const weeklyMalfunctioningReportData =
      data.weeklyMalfunctioningReport || {};
    setWeeklyMalfunctioningReport(weeklyMalfunctioningReportData);
  }, []);

  useEffect(() => {
    if (!weeklyMalfunctioningReport) {
      getWeeklyMalfunctioningReport();
    }
  }, [weeklyMalfunctioningReport, getWeeklyMalfunctioningReport]);
  return (
    <div className="flex flex-col gap-y-10 items-center">
      <h1 className="text-[25px]">Reporting</h1>
      <div className="flex flex-col gap-y-2">
        <div>Weekly Report</div>
        <WeeklyReporting />
      </div>

      <div className="flex flex-col gap-y-2 w-full">
        <div>Malfunctioning Weekly Report</div>
        {!weeklyMalfunctioningReport ||
        weeklyMalfunctioningReport.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 gap-y-4 border-solid border-[1px] w-[50vw] h-[40vh]">
            There is no malfunctioning notifications yet.
          </div>
        ) : (
          <div className="flex flex-row flex-wrap justify-center gap-5">
            {weeklyMalfunctioningReport.map((face, faceIndex) => {
              return (
                <div
                  key={faceIndex}
                  className="flex flex-col items-center p-4 gap-y-4 border-solid border-[1px]"
                >
                  <div>{face.face.toUpperCase()} Last 7 Days</div>
                  <FaceMalfunctioningGraph days={face.days} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reporting;
