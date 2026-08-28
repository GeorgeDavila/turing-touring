const REVERSE_GEOCODE_URL =
  "https://nominatim.openstreetmap.org/reverse";

export type AddressResult = {
  formatted: string;
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  postcode?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
};

export async function getCityFromCoords(
  latitude: number,
  longitude: number,
): Promise<string> {
  const url = `${REVERSE_GEOCODE_URL}?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&localityLanguage=en`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TuringTouring/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocode failed (${response.status})`);
  }

  const data = (await response.json()) as NominatimResponse;
  const addr = data.address;

  return (
    addr?.city ??
    addr?.town ??
    addr?.village ??
    "Unknown place"
  );
}
