type LocationButtonProps = {
  location: string;
  locating: boolean;
  onClick: () => void;
};

export default function LocationButton({
  location,
  locating,
  onClick,
}: LocationButtonProps) {
  return (
    <button
      className="rounded-md bg-[#3a3a3a] px-4 py-2 text-sm text-[#e5e5e5] transition-colors hover:bg-[#454545] disabled:opacity-60"
      type="button"
      disabled={locating}
      onClick={onClick}
    >
      {locating
        ? "🌎 Locating… 🌍"
        : location
          ? `🌎 ${location} 🌍`
          : "🌎 Get Location 🌍"}
    </button>
  );
}
