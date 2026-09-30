const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isAllowedBrowserOrigin(origin, requestHost, configuredOrigins, isProduction) {
  if (!origin) return true;

  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) return false;
  if (configuredOrigins.includes(parsed.origin)) return true;

  // Browser requests to the API's own host remain valid behind same-origin hosting.
  if (requestHost && parsed.host === requestHost.toLowerCase()) return true;
  return !isProduction && LOOPBACK_HOSTS.has(parsed.hostname);
}
