import { ChevronDown, FilePlus2, Search, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { getSeedAssetUrl, seedCatalog } from "../../assets/catalog";
import { FormField } from "../../components/ui/FormField";
import { IconButton } from "../../components/ui/IconButton";
import { searchAssets, type AssetFilters } from "../../domain/assets/search";
import type { AssetMetadata } from "../../domain/assets/schema";
import { t, type Locale } from "../../i18n/messages";
import { DEFAULT_ASSET_FILTERS } from "./filters";

const RESULT_PAGE_SIZE = 48;

interface AssetsPanelProps {
  locale: Locale;
  filters: AssetFilters;
  setFilters: (filters: AssetFilters) => void;
  onAdd: (asset: AssetMetadata) => void;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onRequestFile?: () => void;
}

export function AssetsPanel({
  locale,
  filters,
  setFilters,
  onAdd,
  onFile,
  onRequestFile,
}: AssetsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [visibleCount, setVisibleCount] = useState(RESULT_PAGE_SIZE);
  const results = useMemo(() => searchAssets(seedCatalog, filters), [filters]);
  const visibleResults = results.slice(0, visibleCount);
  const categories = [
    ...new Set(seedCatalog.map((asset) => asset.category)),
  ].sort((left, right) => left.localeCompare(right));
  const providers = [
    ...new Set(seedCatalog.map((asset) => asset.source.provider)),
  ].sort((left, right) => left.localeCompare(right));
  const licenses = [
    ...new Set(seedCatalog.map((asset) => asset.license.id)),
  ].sort((left, right) => left.localeCompare(right));

  useEffect(() => setVisibleCount(RESULT_PAGE_SIZE), [filters]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
        return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <aside className="left-panel" aria-label="Scientific asset library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t(locale, "verifiedCatalog")}</p>
          <h2>{t(locale, "assets")}</h2>
        </div>
        <span className="count-badge">{seedCatalog.length}</span>
      </div>
      <div className="search-control">
        <Search aria-hidden="true" />
        <input
          ref={searchInputRef}
          aria-label={t(locale, "searchAssets")}
          placeholder={t(locale, "searchAssets")}
          value={filters.query}
          onChange={(event) =>
            setFilters({ ...filters, query: event.currentTarget.value })
          }
        />
        {filters.query && (
          <IconButton
            label={t(locale, "clearSearch")}
            onClick={() => setFilters({ ...filters, query: "" })}
          >
            <X />
          </IconButton>
        )}
      </div>
      <details className="filters">
        <summary>
          <span>{t(locale, "filters")}</span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="filter-grid">
          <FormField label={t(locale, "category")}>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters({ ...filters, category: event.currentTarget.value })
              }
            >
              <option value="">{t(locale, "all")}</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t(locale, "source")}>
            <select
              value={filters.provider}
              onChange={(event) =>
                setFilters({ ...filters, provider: event.currentTarget.value })
              }
            >
              <option value="">{t(locale, "all")}</option>
              {providers.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t(locale, "license")}>
            <select
              value={filters.license}
              onChange={(event) =>
                setFilters({ ...filters, license: event.currentTarget.value })
              }
            >
              <option value="">{t(locale, "all")}</option>
              {licenses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t(locale, "attribution")}>
            <select
              value={filters.attribution}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  attribution: event.currentTarget
                    .value as AssetFilters["attribution"],
                })
              }
            >
              <option value="all">{t(locale, "all")}</option>
              <option value="required">{t(locale, "required")}</option>
              <option value="not-required">{t(locale, "notRequired")}</option>
            </select>
          </FormField>
        </div>
      </details>
      <div className="asset-results" aria-live="polite">
        <p className="asset-result-summary">
          {results.length} {t(locale, "results")}
        </p>
        {visibleResults.map((asset) => (
          <article
            className="asset-card"
            key={asset.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(
                "application/x-openbiofigure-asset",
                asset.id,
              );
            }}
            onDoubleClick={() => onAdd(asset)}
          >
            <div className="asset-thumb" aria-hidden="true">
              <img src={getSeedAssetUrl(asset)} alt="" loading="lazy" />
            </div>
            <div className="asset-card-copy">
              <strong>{asset.title}</strong>
              <span>{asset.category}</span>
              <small>
                {asset.license.id}
                {asset.license.attributionRequired ? " · credit" : ""}
              </small>
            </div>
            <button
              type="button"
              className="asset-add"
              onClick={() => onAdd(asset)}
              aria-label={`${t(locale, "addToCanvas")}: ${asset.title}`}
              title={t(locale, "addToCanvas")}
            >
              <FilePlus2 />
            </button>
          </article>
        ))}
        {!results.length && (
          <div className="empty-state">
            <Search />
            <p>{t(locale, "noResults")}</p>
            <button
              type="button"
              className="text-button"
              onClick={() => setFilters(DEFAULT_ASSET_FILTERS)}
            >
              {t(locale, "clearFilters")}
            </button>
          </div>
        )}
        {visibleCount < results.length && (
          <button
            type="button"
            className="show-more-button"
            onClick={() => setVisibleCount((count) => count + RESULT_PAGE_SIZE)}
          >
            {t(locale, "showMore")} · {results.length - visibleCount}
          </button>
        )}
      </div>
      <button
        type="button"
        className="import-button"
        onClick={onRequestFile ?? (() => fileInputRef.current?.click())}
      >
        <Upload aria-hidden="true" /> {t(locale, "importLocalSvg")}
      </button>
      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="image/svg+xml,.svg"
        onChange={onFile}
      />
    </aside>
  );
}
