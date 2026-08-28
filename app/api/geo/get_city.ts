const REVERSE_GEOCODE_URL =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

type ReverseGeocodeResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

export async function getCityFromCoords(
  latitude: number,
  longitude: number,
): Promise<string> {
  const response = await fetch(
    `${REVERSE_GEOCODE_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );

  if (!response.ok) {
    throw new Error(`Reverse geocode failed (${response.status})`);
  }

  const data = (await response.json()) as ReverseGeocodeResponse;

  return (
    [data.city || data.locality, data.principalSubdivision, data.countryName]
      .filter(Boolean)
      .filter((part, i, arr) => arr.indexOf(part) === i)
      .slice(0, 2)
      .join(", ") || "Unknown place"
  );
}
