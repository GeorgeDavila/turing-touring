"use client";

export const CATEGORIES = [
  "Events",
  "Networking",
  "Classes",
  "Tourist",
  "Nightlife",
  "Food",
  "Conventions",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const SUB_OPTIONS: Record<Category, string[]> = {
  Events: [
    "Music Events",
    "Concerts",
    "Festivals",
    "Sports Events",
    "Theater Events",
  ],
  Food: [
    "Food Events",
    "Food Festivals",
    "Michelin Star Restaurants",
    "Famous Restaurants",
    "Historic Restaurants",
    "Winery",
    "Brewery",
    "Fine Dining",
    "Fast Food",
    "Street Food",
    "Food Trucks",
    "Food Carts",
    "Food Stands",
    "Food Markets",
  ],
  Tourist: [
    "Museums",
    "Landmarks",
    "Walking Tours",
    "Viewpoints",
    "Shopping Centers",
    "Parks",
    "Beaches",
    "Hiking Trails",
    "Historical Sites",
    "Art Galleries",
  ],
  Nightlife: [
    "Bars",
    "Clubs",
    "Live Music",
    "Late-Night Eats",
    "Dance Clubs",
    "Nightclubs",
    "Pubs",
    "Breweries",
    "Wine Bars",
    "Speakeasies",
  ],
  Classes: [
    "Cooking Classes",
    "Yoga Classes",
    "Language Classes",
    "Pottery Classes",
    "Art Classes",
  ],
  Networking: [
    "Networking Events",
    "Business Events",
    "Tech Networking Events",
    "Professional Networking Events",
    "Industry Networking Events",
    "Trade Shows",
    "Career Fairs",
    "Business Conferences",
    "Business Workshops",
    "Business Seminars",
    "Business Training",
  ],
  Conventions: [
    "Conventions",
    "Comic Cons",
    "Tech Conventions",
    "Gaming Conventions",
    "Anime Conventions",
    "Trade Conventions",
  ],
};

type CategoryOptionsProps = {
  category: Category;
  subOption: string;
  onCategoryClick: (category: Category) => void;
  onSubOptionClick: (category: Category, subOption: string) => void;
};

export default function CategoryOptions({
  category,
  subOption,
  onCategoryClick,
  onSubOptionClick,
}: CategoryOptionsProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium tracking-wide text-[#a3a3a3] uppercase">
          Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const selected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryClick(cat)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "bg-[#e5e5e5] text-[#1a1a1a]"
                    : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {CATEGORIES.map((cat) => (
        <section key={cat} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium tracking-wide text-[#a3a3a3] uppercase">
            {cat}
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUB_OPTIONS[cat].map((option) => {
              const selected = category === cat && subOption === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSubOptionClick(cat, option)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    selected
                      ? "bg-[#e5e5e5] text-[#1a1a1a]"
                      : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
