# Testing

Use the smallest relevant check while developing, then run the complete source verification before a pull request.

| Command                | Coverage                                                  |
| ---------------------- | --------------------------------------------------------- |
| `pnpm test`            | Unit and integration behavior                             |
| `pnpm test:e2e`        | Browser workflows and production build                    |
| `pnpm assets:validate` | Asset metadata, hashes, licences, SVG safety, duplicates  |
| `pnpm docs:build`      | Documentation rendering, search index, and internal links |
| `pnpm verify:privacy`  | Secrets, personal data, and local-path patterns           |
| `pnpm verify:source`   | Forbidden binaries and generated release output           |
| `pnpm verify`          | Complete web/source gate                                  |

Desktop changes additionally require the Tauri build and WebdriverIO native smoke test. Pure documentation changes do not justify rebuilding Tauri locally; GitHub Actions remains the authoritative clean cross-platform run.
