import { ALL_DISTRICTS } from "@/lib/rwanda-locations";

export const DISTRICTS = ALL_DISTRICTS;

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
  { key: "has_hot_water", label: "Hot water" },
  { key: "has_generator", label: "Generator" },
  { key: "has_balcony", label: "Balcony" },
  { key: "has_ac", label: "Air conditioning" },
  { key: "has_laundry", label: "Laundry" },
  { key: "has_workspace", label: "Workspace" },
  { key: "has_housekeeping", label: "Housekeeping" },
  { key: "has_elevator", label: "Elevator" },
  { key: "has_gym", label: "Gym" },
  { key: "has_pool", label: "Pool" },
  { key: "pets_allowed", label: "Pets allowed" },
] as const;

export const CURRENCIES = ["RWF", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const STAY_OPTIONS = [
  { value: "short", maxMinStay: 3 },
  { value: "medium", maxMinStay: 12 },
  { value: "long", maxMinStay: null },
] as const;

export const SITE_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ?? "https://homelink.rw";

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

export const MOMO_PAYMENT_NUMBER = "0796332122"; // MTN MoMo number
export const SUPPORT_WHATSAPP = "250796332122"; // international format, no +
export const CONTACT_EMAIL = "hello@homelink.rw";
