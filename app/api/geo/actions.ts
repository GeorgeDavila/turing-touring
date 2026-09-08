"use server";

import { getAddressFromCoords } from "./get_address";
import { getCityFromCoords as getCityFromBigDataCloud } from "./get_city_bigdatacloud";

export type UserLocationResult = {
  city: string;
  address: string;
};

export async function getAddressFull(latitude: number, longitude: number) {
  return getAddressFromCoords(latitude, longitude);
}

export async function getAddressSimple(latitude: number, longitude: number) {
  const address = await getAddressFromCoords(latitude, longitude);
  const street = [address.houseNumber, address.road].filter(Boolean).join(" ");
  return (
    [street, address.city, address.principalSubdivision]
      .filter(Boolean)
      .join(", ") || address.formatted
  );
}

export async function getCity(latitude: number, longitude: number) {
  try {
    return await getCityFromCoordsViaAddress(latitude, longitude);
  } catch {
    return getCityFromBigDataCloud(latitude, longitude);
  }
}

async function getCityFromCoordsViaAddress(
  latitude: number,
  longitude: number,
) {
  const address = await getAddressFromCoords(latitude, longitude);
  return address.city || address.locality || "Unknown place";
}

/** One reverse-geocode round trip for city + formatted address. */
export async function getUserLocation(
  latitude: number,
  longitude: number,
): Promise<UserLocationResult> {
  try {
    const address = await getAddressFromCoords(latitude, longitude);
    const street = [address.houseNumber, address.road]
      .filter(Boolean)
      .join(" ");
    return {
      city: address.city || address.locality || "Unknown place",
      address:
        [street, address.city, address.principalSubdivision]
          .filter(Boolean)
          .join(", ") || address.formatted,
    };
  } catch {
    const city = await getCityFromBigDataCloud(latitude, longitude);
    return { city, address: city };
  }
}
