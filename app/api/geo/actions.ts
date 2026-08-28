"use server";

import { getAddressFromCoords } from "./get_address";
import { getCityFromCoords } from "./get_city";

export async function getAddress(latitude: number, longitude: number) {
  return getAddressFromCoords(latitude, longitude);
}

export async function getCity(latitude: number, longitude: number) {
  return getCityFromCoords(latitude, longitude);
}
