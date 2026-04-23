export function joinPath(...parts) {
  return parts
    .filter(Boolean)
    .map((p, i) =>
      i === 0 ? p.replace(/[/\\]+$/, "") : p.replace(/^[/\\]+|[/\\]+$/g, ""),
    )
    .join("/");
}

export function getGmlDir(modsDir) {
  if (!modsDir) return modsDir;
  return modsDir.replace(/[/\\]+$/, "").replace(/[/\\]mods$/, "/mods_GML");
}
