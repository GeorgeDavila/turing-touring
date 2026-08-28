"use server";

import { getAddressFromCoords } from "./get_address";
import { getCityFromCoords } from "./get_city";

export async function getAddressFull(latitude: number, longitude: number) {
  return getAddressFromCoords(latitude, longitude);
}

export async function getAddressSimple(latitude: number, longitude: number) {
  const address = await getAddressFromCoords(latitude, longitude);
  const street = [address.houseNumber, address.road].filter(Boolean).join(" ");
  return [street, address.city, address.principalSubdivision]
    .filter(Boolean)
    .join(", ") || address.formatted;
}

export async function getCity(latitude: number, longitude: number) {
  return getCityFromCoords(latitude, longitude);
}
