"use client";

export interface DetectedDeviceInfo {
  deviceName: string;
  osVersion: string;
  browser: string;
  screenResolution: string;
}

function parseDeviceName(ua: string): string {
  const uaLower = ua.toLowerCase();

  // Phones
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Pixel")) {
    const match = ua.match(/Pixel\s*\d+[a-z]?/i);
    return match ? match[0] : "Google Pixel";
  }
  if (ua.includes("Samsung") || ua.includes("SM-")) return "Samsung Galaxy";
  if (ua.includes("OnePlus")) return "OnePlus";
  if (ua.includes("Xiaomi") || ua.includes("Mi ")) return "Xiaomi";
  if (ua.includes("Huawei")) return "Huawei";
  if (ua.includes("Sony")) return "Sony Xperia";
  if (ua.includes("Nokia")) return "Nokia";
  if (ua.includes("LG")) return "LG";
  if (ua.includes("Motorola")) return "Motorola";
  if (ua.includes("HTC")) return "HTC";

  // Tablets
  if (ua.includes("Android") && ua.includes("Tablet")) return "Android Tablet";

  // Desktop / Laptop
  if (uaLower.includes("macintosh") || uaLower.includes("mac os")) {
    if (ua.includes("MacBook")) return "MacBook";
    if (ua.includes("iMac")) return "iMac";
    return "Mac";
  }
  if (uaLower.includes("windows")) {
    if (ua.includes("Surface")) return "Microsoft Surface";
    return "Windows PC";
  }
  if (uaLower.includes("linux")) {
    if (uaLower.includes("ubuntu")) return "Ubuntu PC";
    if (uaLower.includes("debian")) return "Debian PC";
    if (uaLower.includes("fedora")) return "Fedora PC";
    return "Linux PC";
  }
  if (uaLower.includes("crOS")) return "Chromebook";

  // Generic fallback
  if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) return "Mobile Device";
  return "Desktop / Laptop";
}

function parseOS(ua: string): string {
  const uaLower = ua.toLowerCase();

  if (ua.includes("Windows NT 10.0")) return "Windows 11 / 10";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Windows")) return "Windows";

  const macMatch = ua.match(/Mac OS X ([\d_]+)/);
  if (macMatch) return `macOS ${macMatch[1].replace(/_/g, ".")}`;
  if (uaLower.includes("mac os")) return "macOS";

  const iosMatch = ua.match(/OS\s+(\d+[._\d]*)/i);
  if (ua.includes("iPhone") || ua.includes("iPad")) {
    return iosMatch ? `iOS ${iosMatch[1].replace(/_/g, ".")}` : "iOS";
  }

  const androidMatch = ua.match(/Android\s+([\d.]+)/);
  if (androidMatch) return `Android ${androidMatch[1]}`;
  if (uaLower.includes("android")) return "Android";

  const chromeMatch = ua.match(/CrOS\s+armv\d+\s+([\d.]+)/);
  if (chromeMatch) return `Chrome OS ${chromeMatch[1]}`;
  if (ua.includes("CrOS")) return "Chrome OS";

  const linuxMatch = ua.match(/Linux\s+([\d.]+)/);
  if (linuxMatch) return `Linux ${linuxMatch[1]}`;
  if (uaLower.includes("linux")) return "Linux";

  return "Unknown OS";
}

function parseBrowser(ua: string): string {
  const uaLower = ua.toLowerCase();

  // Edge must be checked before Chrome (Edge includes "Edg/")
  const edgeMatch = ua.match(/Edg\/([\d.]+)/);
  if (edgeMatch) return `Edge ${edgeMatch[1]}`;

  const chromeMatch = ua.match(/Chrome\/([\d.]+)/);
  if (chromeMatch && !ua.includes("Edg/")) return `Chrome ${chromeMatch[1]}`;

  const firefoxMatch = ua.match(/Firefox\/([\d.]+)/);
  if (firefoxMatch) return `Firefox ${firefoxMatch[1]}`;

  const safariMatch = ua.match(/Version\/([\d.]+).*Safari/);
  if (safariMatch && !ua.includes("Chrome")) return `Safari ${safariMatch[1]}`;

  const operaMatch = ua.match(/OPR\/([\d.]+)/);
  if (operaMatch) return `Opera ${operaMatch[1]}`;

  if (uaLower.includes("trident") || uaLower.includes("msie")) return "Internet Explorer";

  return "Unknown Browser";
}

function getScreenResolution(): string {
  if (typeof window === "undefined") return "";
  const w = window.screen.width;
  const h = window.screen.height;
  const dpr = window.devicePixelRatio;
  return dpr && dpr > 1 ? `${w}×${h} (@${dpr}x)` : `${w}×${h}`;
}

async function fetchCountryFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.countryCode || "";
  } catch {
    return "";
  }
}

function detectCountryFromTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzMap: Record<string, string> = {
      "America/New_York": "US", "America/Chicago": "US",
      "America/Denver": "US", "America/Los_Angeles": "US",
      "America/Phoenix": "US", "America/Anchorage": "US",
      "America/Honolulu": "US", "Europe/London": "GB",
      "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Madrid": "ES",
      "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
      "Europe/Brussels": "BE", "Europe/Vienna": "AT",
      "Europe/Zurich": "CH", "Europe/Stockholm": "SE",
      "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
      "Europe/Helsinki": "FI", "Europe/Warsaw": "PL",
      "Europe/Prague": "CZ", "Europe/Budapest": "HU",
      "Europe/Athens": "GR", "Europe/Lisbon": "PT",
      "Europe/Dublin": "IE", "Europe/Moscow": "RU",
      "Europe/Istanbul": "TR", "Europe/Kiev": "UA",
      "Europe/Bucharest": "RO", "Europe/Sofia": "BG",
      "Asia/Tokyo": "JP", "Asia/Shanghai": "CN",
      "Asia/Hong_Kong": "HK", "Asia/Singapore": "SG",
      "Asia/Seoul": "KR", "Asia/Taipei": "TW",
      "Asia/Bangkok": "TH", "Asia/Jakarta": "ID",
      "Asia/Manila": "PH", "Asia/Kuala_Lumpur": "MY",
      "Asia/Dubai": "AE", "Asia/Riyadh": "SA",
      "Asia/Kolkata": "IN", "Asia/Dhaka": "BD",
      "Australia/Sydney": "AU", "Pacific/Auckland": "NZ",
      "America/Sao_Paulo": "BR", "America/Mexico_City": "MX",
      "America/Bogota": "CO", "America/Lima": "PE",
      "America/Santiago": "CL", "Africa/Cairo": "EG",
      "Africa/Lagos": "NG", "Africa/Johannesburg": "ZA",
      "Africa/Nairobi": "KE", "Africa/Casablanca": "MA",
      "Africa/Algiers": "DZ", "Africa/Tunis": "TN",
      "Africa/Tripoli": "LY", "Africa/Khartoum": "SD",
      "Africa/Dakar": "SN", "Africa/Abidjan": "CI",
    };
    if (tzMap[timezone]) return tzMap[timezone];
    for (const [tz, country] of Object.entries(tzMap)) {
      if (timezone.startsWith(tz.split("/").slice(0, 2).join("/"))) return country;
    }
    return "";
  } catch {
    return "";
  }
}

export function getCountryFromGeolocation(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(detectCountryFromTimezone());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const country = await fetchCountryFromCoords(
          position.coords.latitude,
          position.coords.longitude
        );
        resolve(country || detectCountryFromTimezone());
      },
      () => {
        // Permission denied or error — fall back to timezone
        resolve(detectCountryFromTimezone());
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

export function detectDeviceInfo(): DetectedDeviceInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  return {
    deviceName: parseDeviceName(ua),
    osVersion: parseOS(ua),
    browser: parseBrowser(ua),
    screenResolution: getScreenResolution(),
  };
}
