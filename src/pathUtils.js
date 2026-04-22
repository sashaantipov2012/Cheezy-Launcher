export function joinPath(...parts) {
  const sep = parts[0]?.includes("\\") ? "\\" : "/";
  return parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p : p.replace(/^[/\\]+/, "")))
    .join(sep);
}

export function getGmlDir(modsDir) {
  if (!modsDir) return modsDir;
  const sep = modsDir.includes("\\") ? "\\" : "/";
  return modsDir.replace(/[/\\]mods$/, `${sep}mods_GML`);
}
