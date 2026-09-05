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

const collator = new Intl.Collator("en", { sensitivity: "base" });

function relevance(asset: AssetMetadata, terms: string[]): number {
  if (!terms.length) return 0;

  const title = normalize(asset.title);
  const description = normalize(asset.description);
  const category = normalize(asset.category);
  const provider = normalize(asset.source.provider);
  const keywords = asset.keywords.map(normalize);

  return terms.reduce((score, term) => {
    if (title === term) return score;
    if (title.startsWith(term)) return score + 10;
    if (title.includes(term)) return score + 20;
    if (keywords.includes(term)) return score + 30;
    if (keywords.some((keyword) => keyword.startsWith(term))) return score + 40;
    if (keywords.some((keyword) => keyword.includes(term))) return score + 50;
    if (category.includes(term)) return score + 60;
    if (provider.includes(term)) return score + 70;
    if (description.includes(term)) return score + 80;
    return score + 100;
  }, 0);
}

export function searchAssets(
  assets: AssetMetadata[],
  filters: AssetFilters,
): AssetMetadata[] {
  const query = normalize(filters.query);
  const terms = query.split(/\s+/).filter(Boolean);

  const matches = assets.filter((asset) => {
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

  if (!terms.length) return matches;

  return [...matches].sort((left, right) => {
    const score = relevance(left, terms) - relevance(right, terms);
    return score || collator.compare(left.title, right.title);
  });
}
