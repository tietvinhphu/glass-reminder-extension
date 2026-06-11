const MV3_MATCH_PATTERN =
  /^(?<scheme>\*|https?|file|ftp|chrome-extension|chrome|moz-extension|safari-extension|safari-web-extension|ms-browser-extension|edge):\/\/(?<host>(\*|\*\.[^/*]+|[^/*]+))(?<path>\/.*)?$/;

export const isValidManifestMatchPattern = (pattern: string): boolean =>
  MV3_MATCH_PATTERN.test(pattern);

export const isHttpsOnlyHostPermission = (pattern: string): boolean =>
  pattern.startsWith("https://");

export const isOverlyBroadMatchPattern = (pattern: string): boolean =>
  pattern === "<all_urls>" ||
  pattern === "*://*/*" ||
  pattern === "*://*";
