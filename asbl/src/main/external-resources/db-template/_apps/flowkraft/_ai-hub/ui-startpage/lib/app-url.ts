/**
 * Where the viewer's browser reaches another app of this installation.
 *
 * Links to the apps are written `http://localhost:<port>`, right when the browser runs on the same
 * machine. Opened any other way (`http://reports.acme.com:8440`, or a reverse proxy's
 * `https://apps-8440.acme.com`), the AI Hub's own address says where the others are: the same
 * address with the AI Hub's port, 8440, swapped for theirs.
 */
const OWN_PORT = "8440";

export function appUrl(url: string): string {
  if (typeof window === "undefined") return url;
  const origin = window.location.origin;
  if (!origin.includes(OWN_PORT)) return url;
  return url.replace(/^http:\/\/localhost:(\d+)/, (_m, port: string) => origin.replace(OWN_PORT, port));
}
