'use client';

import { useEffect, useRef } from 'react';
import {
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/** High-detail street map (roads, labels, buildings) */
const DETAILED_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

type MapComponentProps = {
  coords: [number, number];
  destinationCoords?: [number, number] | null;
};

function isValidCoords([lng, lat]: [number, number]) {
  return lng !== 0 || lat !== 0;
}

export default function MapComponent({
  coords,
  destinationCoords = null,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const hasDestination =
      destinationCoords !== null && isValidCoords(destinationCoords);

    const map = new Map({
      container: mapContainerRef.current,
      style: DETAILED_STYLE,
      center: coords,
      zoom: 16,
      maxZoom: 19,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl(), 'top-right');

    const userMarker = new Marker({ color: '#3b82f6' })
      .setLngLat(coords)
      .addTo(map);

    let destinationMarker: Marker | null = null;
    if (hasDestination) {
      destinationMarker = new Marker({ color: '#e11d48' })
        .setLngLat(destinationCoords)
        .addTo(map);
    }

    const onLoad = () => {
      map.resize();

      if (hasDestination) {
        const bounds = new LngLatBounds();
        bounds.extend(coords);
        bounds.extend(destinationCoords);
        map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      }
    };

    map.on('load', onLoad);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      map.off('load', onLoad);
      resizeObserver.disconnect();
      userMarker.remove();
      destinationMarker?.remove();
      map.remove();
    };
  }, [coords, destinationCoords]);

  return <div ref={mapContainerRef} className="h-[480px] w-full" />;
}
