export async function resolveCountryFromCoords(latitude: number, longitude: number) {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    { signal: AbortSignal.timeout(8000) },
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const data = (await response.json()) as { countryName?: string };
  const country = data.countryName?.trim() ?? "";

  if (!country) {
    throw new Error("Country not found");
  }

  return country;
}

export function getGeolocationErrorMessage(code: number) {
  switch (code) {
    case 1:
      return "Location permission was denied. You can choose your country manually.";
    case 2:
      return "Location information is unavailable.";
    case 3:
      return "Location request timed out.";
    default:
      return "Could not retrieve your location.";
  }
}

export function requestBrowserCountry(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const country = await resolveCountryFromCoords(
            position.coords.latitude,
            position.coords.longitude,
          );
          resolve(country);
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Could not detect country."));
        }
      },
      (error) => {
        reject(new Error(getGeolocationErrorMessage(error.code)));
      },
      { timeout: 15000, enableHighAccuracy: false },
    );
  });
}
