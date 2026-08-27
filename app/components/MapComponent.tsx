'use client';

import { useEffect, useRef } from 'react';
import { Map, Marker, NavigationControl, type StyleSpecification } from 'maplibre-gl';
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

export default function MapComponent({ coords }: { coords: [number, number] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: DETAILED_STYLE,
      center: coords,
      zoom: 16,
      maxZoom: 19,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl(), 'top-right');
    const marker = new Marker({ color: '#e11d48' }).setLngLat(coords).addTo(map);

    map.on('load', () => map.resize());

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      marker.remove();
      map.remove();
    };
  }, [coords]);

  return <div ref={mapContainerRef} className="h-[480px] w-full" />;
}
