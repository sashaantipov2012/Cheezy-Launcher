import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

const GAME_DIR = "D:\\SteamLibrary\\steamapps\\common\\Pizza Tower";

function ModCard({ name }) {
  return (
    <div className="rounded-xl border border-gray-600 hover:border-gray-400 transition-colors shadow-md">
      <div className="card-body flex flex-col justify-center items-center p-4">
        <span className="text-3xl mb-2">📦</span>
        <h2 className="card-title text-center truncate text-sm">{name}</h2>
      </div>
    </div>
  );
}

function OverwriteCheckbox({ overwiteDir }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (!enabled) {
        await invoke("apply_overwrite", { overwritePath: overwiteDir, targetPath: GAME_DIR });
      } else {
        await invoke("remove_overwrite", { overwritePath: overwiteDir, targetPath: GAME_DIR });
      }
      setEnabled(!enabled);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        className="checkbox checkbox-primary checkbox-sm"
        checked={enabled}
        disabled={loading || !overwiteDir}
        onChange={handleToggle}
      />
      <span className="text-sm text-gray-300">
        {loading ? "..." : enabled ? "Overwrite actif" : "Overwrite"}
      </span>
    </label>
  );
}

function Tab1({ modsDir, overwiteDir }) {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMods = () => {
    if (!modsDir) return;
    invoke("list_mods", { modsPath: modsDir })
      .then((folders) => setMods(folders))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMods();
    const interval = setInterval(fetchMods, 2000);
    return () => clearInterval(interval);
  }, [modsDir]);

  const handleRunFile = () => {
    const path = `${GAME_DIR}//PizzaTower.exe`;
    invoke("run_file", { path })
      .then(() => console.log(`${path} exécuté !`))
      .catch(console.error);
  };

  return (
    <div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={handleRunFile} className="btn btn-primary">
          Exec Test
        </button>
        <button
          className="btn btn-secondary"
          onClick={() =>
            invoke("apply_xdelta_patch", { source: "", patch: "", output: "" })
              .then(() => alert("Patch appliqué !"))
              .catch(console.error)
          }
        >
          Patch Test
        </button>
        <OverwriteCheckbox overwiteDir={overwiteDir} />
      </div>
      <div className="mt-4">
        {loading && <p className="text-gray-400 text-sm">Loading...</p>}
      {!loading && mods.length === 0 && (
        <p className="text-gray-400 text-sm">No mods found in{modsDir}</p>
      )}
      {!loading && mods.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mods.map((mod) => (
            <ModCard key={mod} name={mod} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [modsDir, setModsDir] = useState(null);
  const [overwiteDir, setOverwiteDir] = useState(null);

  useEffect(() => {
    invoke("get_main_dir", { folderName: "mods" })
      .then((path) => setModsDir(path))
      .catch(console.error);

    invoke("get_main_dir", { folderName: "overwrite" })
      .then((path) => setOverwiteDir(path))
      .catch(console.error);
  }, []);

  return (
  <div>
    <div role="tablist" className="tabs tabs-lifted mb-4">
      <a role="tab" className={`tab ${activeTab === "tab1" ? "tab-active" : ""}`} onClick={() => setActiveTab("tab1")}>Tab 1</a>
      <a role="tab" className={`tab ${activeTab === "tab2" ? "tab-active" : ""}`} onClick={() => setActiveTab("tab2")}>Tab 2</a>
      <a role="tab" className={`tab ${activeTab === "tab3" ? "tab-active" : ""}`} onClick={() => setActiveTab("tab3")}>Tab 3</a>
    </div>
    <div className="p-4 bg-gray-800 rounded-lg min-h-[150px]">
      {activeTab === "tab1" && <Tab1 modsDir={modsDir} overwiteDir={overwiteDir} />}
      {activeTab === "tab2" && <p>2nd (will be GMLoader suuport)</p>}
      {activeTab === "tab3" && <p>3rd (will be maybe Gamebanana search like PO)</p>}
    </div>
  </div>
);
}

export default App;