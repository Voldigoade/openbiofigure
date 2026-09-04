import type { AssetMetadata } from "./schema";

export interface AssetFilters {
  query: string;
  category: string;
  provider: string;
  license: string;
  attribution: "all" | "required" | "not-required";
}

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .trim();

export function searchAssets(
  assets: AssetMetadata[],
  filters: AssetFilters,
): AssetMetadata[] {
  const query = normalize(filters.query);
  const terms = query.split(/\s+/).filter(Boolean);

  return assets.filter((asset) => {
    const haystack = normalize(
      [
        asset.title,
        asset.description,
        asset.category,
        asset.source.provider,
        ...asset.keywords,
      ].join(" "),
    );
    const matchesQuery = terms.every((term) => haystack.includes(term));
    const matchesCategory =
      !filters.category || asset.category === filters.category;
    const matchesProvider =
      !filters.provider || asset.source.provider === filters.provider;
    const matchesLicense =
      !filters.license || asset.license.id === filters.license;
    const matchesAttribution =
      filters.attribution === "all" ||
      (filters.attribution === "required" &&
        asset.license.attributionRequired) ||
      (filters.attribution === "not-required" &&
        !asset.license.attributionRequired);
    return (
      matchesQuery &&
      matchesCategory &&
      matchesProvider &&
      matchesLicense &&
      matchesAttribution
    );
  });
}
