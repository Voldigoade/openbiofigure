# Units and DPI

OpenBioFigure currently stores document dimensions in pixels. SVG is resolution-independent, so its shapes and text remain vector-scalable. PNG is raster output: final pixel dimensions equal the document dimensions multiplied by the selected export scale.

## Converting a print requirement

Use this relationship when a journal specifies physical size and DPI:

```text
pixels = inches × DPI
inches = millimetres ÷ 25.4
```

For example, a 100 mm-wide image at 300 DPI needs approximately 1181 pixels. OpenBioFigure does not currently store or claim physical units or DPI metadata; confirm the exported dimensions in your publication workflow.
