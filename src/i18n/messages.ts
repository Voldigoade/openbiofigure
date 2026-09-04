export type Locale = "en" | "fr";

export const messages = {
  en: {
    assets: "Assets",
    searchAssets: "Search scientific assets",
    clearSearch: "Clear search",
    category: "Category",
    source: "Source",
    license: "License",
    attribution: "Attribution",
    all: "All",
    required: "Required",
    notRequired: "Not required",
    addToCanvas: "Add to canvas",
    noResults: "No assets match these filters.",
    clearFilters: "Clear filters",
    style: "Style",
    position: "Position",
    layers: "Layers",
    licensing: "Attribution / Licensing",
    savedLocally: "Saved locally",
    saving: "Saving…",
    saveFailed: "Local save failed",
    legalNotice:
      "OpenBioFigure helps track licensing metadata; it does not provide legal advice.",
  },
  fr: {
    assets: "Ressources",
    searchAssets: "Rechercher des ressources scientifiques",
    clearSearch: "Effacer la recherche",
    category: "Catégorie",
    source: "Source",
    license: "Licence",
    attribution: "Attribution",
    all: "Toutes",
    required: "Requise",
    notRequired: "Non requise",
    addToCanvas: "Ajouter au canevas",
    noResults: "Aucune ressource ne correspond à ces filtres.",
    clearFilters: "Effacer les filtres",
    style: "Style",
    position: "Position",
    layers: "Calques",
    licensing: "Attribution / Licences",
    savedLocally: "Enregistré localement",
    saving: "Enregistrement…",
    saveFailed: "Échec de l’enregistrement local",
    legalNotice:
      "OpenBioFigure aide à suivre les licences ; il ne fournit pas de conseil juridique.",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];
export const t = (locale: Locale, key: MessageKey) =>
  messages[locale][key] ?? messages.en[key];
