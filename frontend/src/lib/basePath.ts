export function getAppBasePath(): string {
  if (typeof window === "undefined") return "";
  const match = /^(\/app\/[^/]+)/.exec(window.location.pathname);
  return match ? match[1] : "";
}

export function withBasePath(path: string): string {
  const base = getAppBasePath();
  if (!base) return path;
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
