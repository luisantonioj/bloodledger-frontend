# OCR third-party assets

This folder contains pinned browser assets used by the BloodLedger mobile OCR prototype:

- `tesseract.min.js` and `worker.min.js` from Tesseract.js 6.0.1
- `tesseract-core-lstm.wasm.js` from Tesseract.js Core 6.0.0
- `eng.traineddata.gz` from `@tesseract.js-data/eng` 1.0.0 (`4.0.0_best_int`)

Tesseract.js and Tesseract.js Core are distributed under the Apache License 2.0. The language data originates from the Tesseract trained-data project. These assets are stored locally so camera scans do not depend on a third-party CDN at runtime.
