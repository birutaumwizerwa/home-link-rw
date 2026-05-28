export const DISTRICTS = [
  // Kigali
  "Gasabo", "Kicukiro", "Nyarugenge",
  // Eastern
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  // Northern
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  // Southern
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  // Western
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rutsiro", "Rusizi",
] as const;

export const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room only" },
  { value: "commercial", label: "Commercial space" },
] as const;

export const LISTING_TYPES = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
] as const;

export const PRICE_PERIODS = [
  { value: "monthly", label: "Per month" },
  { value: "yearly", label: "Per year" },
  { value: "fixed", label: "Fixed price" },
] as const;

export const BEDROOM_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

export const BATHROOM_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3+" },
];

export const AMENITIES = [
  { key: "has_kitchen", label: "Kitchen" },
  { key: "has_furnished", label: "Furnished" },
  { key: "has_security", label: "Security / Gate" },
  { key: "has_parking", label: "Parking" },
  { key: "has_wifi", label: "WiFi" },
  { key: "has_water", label: "Water 24/7" },
  { key: "has_generator", label: "Generator" },
  { key: "has_balcony", label: "Balcony" },
] as const;

export const PLANS = {
  basic: {
    name: "Basic",
    price_rwf: 5000,
    posts_limit: 10,
    duration_days: 30,
    features: ["10 active listings", "Featured badge", "Priority in search"],
  },
  pro: {
    name: "Pro",
    price_rwf: 15000,
    posts_limit: null,
    duration_days: 30,
    features: ["Unlimited listings", "Verified badge", "Boosted visibility", "Analytics"],
  },
} as const;

export const FREE_POST_LIMIT = 3;

export const MOMO_PAYMENT_NUMBER = "0788 000 000"; // placeholder — admin updates
export const SUPPORT_WHATSAPP = "250788000000"; // placeholder
