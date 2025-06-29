import { useEffect, useState } from "react";
import Reporting from "./components/Reporting";
import ControlPanel from "./components/ControlPanel";

function App() {
  const [selectedView, setSelectedView] = useState("report");
  const [sensors, setSensors] = useState(null);
  const getAllSensors = async () => {
    const response = await fetch("/api/get_all_sensor_grouped_by_face", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    setSensors(data.sensors);
  };

  useEffect(() => {
    if (!sensors) {
      getAllSensors();
    }
  }, [sensors]);

  return (
    <div className="bg-white-20 h-[100dvh] p-10 flex flex-col gap-y-10 items-center overflow-hidden overflow-y-auto ">
      <div className="flex flex-row w-full gap-10 border-b-[1px] border-gray-0 border-solid p-2">
        <button
          onClick={() => setSelectedView("report")}
          className={
            selectedView === "report"
              ? "text-blue-700"
              : "hover:text-blue-10 opacity-[0.7]"
          }
          disabled={selectedView === "report"}
        >
          Reporting
        </button>
        <button
          onClick={() => setSelectedView("control")}
          className={
            selectedView === "control"
              ? "text-blue-700"
              : "hover:text-blue-10 opacity-[0.7]"
          }
          disabled={selectedView === "control"}
        >
          Control Panel
        </button>
      </div>
      {selectedView === "report" && <Reporting />}
      {selectedView === "control" && <ControlPanel sensors={sensors} setSensors={setSensors}/>}
    </div>
  );
}

export default App;
