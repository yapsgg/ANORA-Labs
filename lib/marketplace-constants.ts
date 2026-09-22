export const MARKETPLACE_CATEGORIES = [
  { value: "image-generation", label: "Image Generation" },
  { value: "video-generation", label: "Video Generation" },
  { value: "text-generation", label: "Text Generation" },
  { value: "multi-modal", label: "Multi-Modal" },
  { value: "creative", label: "Creative" },
  { value: "productivity", label: "Productivity" },
  { value: "data-pipeline", label: "Data Pipeline" },
  { value: "other", label: "Other" },
] as const;

export const MARKETPLACE_CATEGORY_VALUES = MARKETPLACE_CATEGORIES.map(
  (c) => c.value
);

export type MarketplaceCategory =
  (typeof MARKETPLACE_CATEGORIES)[number]["value"];

export const CONSULTANT_SPECIALTIES = [
  "Workflow Discovery",
  "Workflow Implementation",
  "Custom Training",
  "Integration",
  "Migration",
  "Automation",
] as const;

export type ConsultantSpecialty = (typeof CONSULTANT_SPECIALTIES)[number];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "top-rated", label: "Top Rated" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
