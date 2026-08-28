"use client";

type GoogleMapProps = {
  coords: [number, number];
  zoom?: number;
  className?: string;
};

export default function GoogleMap({
  coords,
  zoom = 15,
  className,
}: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <p className="p-4 text-sm text-[#a3a3a3]">
        Google Maps API key is not configured.
      </p>
    );
  }

  const [longitude, latitude] = coords;
  const src = `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(apiKey)}&center=${latitude},${longitude}&zoom=${zoom}`;

  return (
    <iframe
      title="Google Map"
      width="100%"
      height="480"
      style={{ border: 0 }}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      src={src}
      allowFullScreen
      className={className}
    />
  );
}
