"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserLocation } from "@/app/api/geo/actions";

type UseUserLocationOptions = {
  fetchOnMount?: boolean;
};

export function useUserLocation({
  fetchOnMount = true,
}: UseUserLocationOptions = {}) {
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation("Location unavailable");
      setAddress("");
      setCoords(null);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setCoords([longitude, latitude]);
          const result = await getUserLocation(latitude, longitude);
          setLocation(result.city);
          setAddress(result.address);
        } catch {
          setLocation("Unknown place");
          setAddress("");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocation("Location denied");
        setAddress("");
        setCoords(null);
        setLocating(false);
      },
    );
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      refreshLocation();
    }
  }, [fetchOnMount, refreshLocation]);

  return { location, address, coords, locating, refreshLocation };
}
