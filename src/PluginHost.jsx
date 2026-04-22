import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as Babel from "@babel/standalone";
import { openUrl } from "@tauri-apps/plugin-opener";
import { joinPath, getGmlDir } from "./pathUtils";
import "./App.css";

const h = (...args) => window.React.createElement(...args);

export default function PluginHost({ pluginId, tabId, addLog }) {
  const [tabs, setTabs] = useState(null);
  const [error, setError] = useState(null);

  const pluginAPI = {
    addLog,
    invoke,
    openUrl,
    joinPath,
    getGmlDir,
  };

  useEffect(() => {
    setTabs(null);
    setError(null);

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
            filename: "plugin.tsx",
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

        if (!registered) {
          throw new Error(
            `Plugin "${pluginId}" never called window.__ptRegisterPlugin()`,
          );
        }

        setTabs(registered.tabs || []);
      })
      .catch((e) => setError(String(e)));
  }, [pluginId]);

  if (error) {
    return h(
      "div",
      {
        className:
          "p-4 text-error text-sm rounded-box border border-error/30 bg-error/5",
      },
      h("p", { className: "font-semibold mb-1" }, `Plugin error — ${pluginId}`),
      h(
        "pre",
        { className: "text-xs overflow-auto whitespace-pre-wrap" },
        error,
      ),
    );
  }

  // ⏳ loading
  if (!tabs) {
    return h(
      "div",
      {
        className:
          "flex items-center justify-center h-32 text-base-content/40 text-sm",
      },
      "Loading plugin…",
    );
  }

  if (tabs.length === 0) return null;

  if (tabId) {
    const tab = tabs.find((t) => t.id === tabId);

    if (!tab) {
      return h(
        "div",
        { className: "p-4 text-sm text-base-content/50" },
        `No tab found for id "${tabId}"`,
      );
    }

    const Component = tab.component;

    return h(Component, pluginAPI);
  }

  return h(
    "div",
    {
      className:
        "w-full h-full p-4 bg-base-100 text-base-content overflow-auto",
    },
    h(
      "div",
      {
        className:
          "w-full p-4 rounded-box bg-base-200 shadow-md border border-base-300",
      },
      h(Component, pluginAPI),
    ),
  );
}
