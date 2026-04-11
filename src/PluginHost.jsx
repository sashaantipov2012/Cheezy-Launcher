import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as Babel from "@babel/standalone";
import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * Loads a plugin's index.js and renders it.
 *
 * Plugin index.js contract:
 *   The script must call window.__ptRegisterPlugin({ tabs, ... })
 *   where `tabs` is an array of { id, label, component: ReactComponent }
 *
 * Example plugin index.js (or .jsx, typescript is also supported):
 * (function () {
 *   const React = window.React;
 *   const { useState } = React;
 *
 *   function MyTab({ addLog, invoke }) {
 *     const [count, setCount] = useState(0);
 *
 *     return (
 *       <div>
 *         <h1>Hello Plugin</h1>
 *         <button onClick={() => setCount(count + 1)}>
 *           Count: {count}
 *         </button>
 *       </div>
 *     );
 *   }
 *
 *   window.__ptRegisterPlugin({
 *     tabs: [
 *       {
 *         id: "my-tab",
 *         label: "My Tool",
 *         component: MyTab,
 *       },
 *     ],
 *   });
 * })();
 *
 * Props forwarded to every tab component: { addLog, invoke }
 */
export default function PluginHost({ pluginId, tabId, addLog }) {
  const [tabs, setTabs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTabs(null);
    setError(null);

    // Expose React globally for plugins
    if (!window.React) {
      import("react").then((r) => {
        window.React = r;
      });
    }

    invoke("read_plugin_script", { pluginId })
      .then((code) => {
        delete window.__ptRegisterPlugin;
        let registered = null;
        window.__ptRegisterPlugin = (def) => {
          registered = def;
        };
        let compiled;

        try {
          compiled = Babel.transform(code, {
            presets: ["react", "typescript"],
            filename: "plugin.tsx", // important pour TSX
          }).code;
        } catch (e) {
          throw new Error(
            `Babel compile error in plugin "${pluginId}": ${e.message}`,
          );
        }

        try {
          new Function(compiled)();
        } catch (e) {
          throw new Error(
            `Runtime error in plugin "${pluginId}": ${e.message}`,
          );
        }
        if (!registered)
          throw new Error(
            `Plugin "${pluginId}" never called window.__ptRegisterPlugin()`,
          );
        setTabs(registered.tabs || []);
      })
      .catch((e) => setError(String(e)));
  }, [pluginId]);

  if (error)
    return (
      <div className="p-4 text-error text-sm rounded-box border border-error/30 bg-error/5">
        <p className="font-semibold mb-1">Plugin error — {pluginId}</p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">{error}</pre>
      </div>
    );

  if (!tabs)
    return (
      <div className="flex items-center justify-center h-32 text-base-content/40 text-sm">
        Loading plugin…
      </div>
    );

  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];
  if (!tab)
    return (
      <div className="p-4 text-sm text-base-content/50">
        No tab found for id "{tabId}"
      </div>
    );

  const Component = tab.component;
  return <Component addLog={addLog} invoke={invoke} openUrl={openUrl} />;
}
