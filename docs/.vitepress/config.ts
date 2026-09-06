import { defineConfig } from "vitepress";

const userSidebar = [
  {
    text: "Getting started",
    items: [
      { text: "Overview", link: "/getting-started/overview" },
      { text: "Installation", link: "/getting-started/installation" },
      { text: "Your first figure", link: "/getting-started/first-figure" },
    ],
  },
  {
    text: "Using OpenBioFigure",
    items: [
      { text: "Home and new figures", link: "/guide/home-new-figure" },
      { text: "Templates", link: "/guide/templates" },
      { text: "Editor basics", link: "/guide/editor-basics" },
      { text: "Scientific assets", link: "/guide/scientific-assets" },
      { text: "Text, shapes, and connectors", link: "/guide/drawing" },
      { text: "Layers", link: "/guide/layers" },
      { text: "Scientific tools and charts", link: "/guide/scientific-tools" },
    ],
  },
  {
    text: "Projects and export",
    items: [
      { text: "Saving projects", link: "/projects/saving" },
      { text: "Exporting", link: "/projects/exporting" },
      { text: "Units and DPI", link: "/projects/units-dpi" },
      {
        text: "Publication readiness",
        link: "/projects/publication-readiness",
      },
      {
        text: "Licensing and attribution",
        link: "/projects/licensing-attribution",
      },
    ],
  },
  {
    text: "Application",
    items: [
      { text: "Desktop and offline use", link: "/application/desktop-offline" },
      { text: "Settings", link: "/application/settings" },
      { text: "Keyboard shortcuts", link: "/application/keyboard-shortcuts" },
      { text: "Troubleshooting", link: "/help/troubleshooting" },
      { text: "FAQ", link: "/help/faq" },
    ],
  },
];

const developerSidebar = [
  {
    text: "Developers",
    items: [
      { text: "Developer overview", link: "/developers/" },
      { text: "Architecture", link: "/ARCHITECTURE" },
      { text: "Project format", link: "/PROJECT_FORMAT" },
      { text: "Asset pipeline", link: "/developers/asset-pipeline" },
      { text: "Adding an asset provider", link: "/developers/asset-provider" },
      { text: "Licensing model", link: "/ASSET_LICENSING" },
      { text: "Security model", link: "/SECURITY_MODEL" },
      { text: "Desktop architecture", link: "/DESKTOP" },
      { text: "Release process", link: "/developers/release-process" },
      { text: "Verify a release", link: "/developers/verify-release" },
      { text: "Testing", link: "/developers/testing" },
      { text: "Contributing", link: "/developers/contributing" },
    ],
  },
  {
    text: "Architecture decisions",
    collapsed: true,
    items: [
      { text: "Vector engine", link: "/architecture/ADR-001-vector-engine" },
      { text: "Project format", link: "/architecture/ADR-002-project-format" },
      {
        text: "Asset provenance",
        link: "/architecture/ADR-003-asset-provenance",
      },
      {
        text: "Desktop runtime",
        link: "/architecture/ADR-004-desktop-runtime",
      },
      {
        text: "Bioicons ingestion",
        link: "/architecture/ADR-005-bioicons-catalog-ingestion",
      },
    ],
  },
];

export default defineConfig({
  lang: "en-US",
  title: "OpenBioFigure Docs",
  titleTemplate: ":title · OpenBioFigure Docs",
  description:
    "Learn to create editable, attribution-aware scientific figures with OpenBioFigure.",
  base: "/openbiofigure/docs/",
  outDir: "../dist/docs",
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: false,
  appearance: true,
  head: [
    ["meta", { name: "theme-color", content: "#f4f7f9" }],
    ["meta", { name: "color-scheme", content: "light dark" }],
  ],
  themeConfig: {
    siteTitle: "OpenBioFigure",
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "Search docs",
            buttonAriaLabel: "Search documentation",
          },
        },
      },
    },
    nav: [
      { text: "User guide", link: "/getting-started/overview" },
      { text: "Developers", link: "/developers/" },
      {
        text: "Open app",
        link: "https://voldigoade.github.io/openbiofigure/app/",
      },
      {
        text: "Download",
        link: "https://voldigoade.github.io/openbiofigure/download/",
      },
    ],
    sidebar: {
      "/developers/": developerSidebar,
      "/architecture/": developerSidebar,
      "/ARCHITECTURE": developerSidebar,
      "/PROJECT_FORMAT": developerSidebar,
      "/ASSET_LICENSING": developerSidebar,
      "/SECURITY_MODEL": developerSidebar,
      "/DESKTOP": developerSidebar,
      "/": userSidebar,
    },
    outline: { level: [2, 3], label: "On this page" },
    docFooter: { prev: "Previous", next: "Next" },
    lastUpdated: { text: "Updated" },
    socialLinks: [
      { icon: "github", link: "https://github.com/Voldigoade/openbiofigure" },
    ],
    footer: {
      message:
        "Apache-2.0 software. Scientific assets retain their own licences.",
      copyright: "OpenBioFigure documentation",
    },
  },
});
