# Troubleshooting

## The editor opens on Home instead of my figure

Choose a recent project or **Open project**. To resume the active local autosave automatically, select **Reopen previous figure** in General settings.

## A project file will not open

Confirm it is an OpenBioFigure `.obf.json` file and has not been edited or truncated. Unsupported or malformed data is rejected to protect the active figure. Keep the file and report the exact version and error if you believe it is valid.

## An SVG import is rejected or looks different

Active SVG content, external references, scripts, event handlers, and unsupported embedded content are removed or rejected. Simplify the SVG in a trusted vector editor, convert unsupported features to paths, then import again. Never disable sanitization.

## Offline mode is not ready in the browser

Open the web app once while connected and wait for it to finish loading. The desktop application already bundles its assets and does not use the PWA service worker.

## Export did not download

Check whether the browser blocked downloads. On desktop, confirm the selected folder is writable and try a different filename. The active project remains in the editor after a failed export.
