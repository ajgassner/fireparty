FireParty [![MIT License][license-image]][license-url]
=========

Web app to plan who works where during a party – built for the festivities of a volunteer fire brigade,
but useful for any club event. No installation, no account, no server: everything runs in the browser.

![FireParty](doc/screen.png?raw=true "FireParty")

Features
--------

* Timeline with drag'n'drop: drag people onto locations, move and resize shifts
* Table view per location and a filter "who is on duty between X and Y"
* Detects overlapping shifts of the same person and highlights them
* Export as PDF (list per location) and Excel (person × hour matrix, also per location)
* Save and open plans as JSON files – files of the old desktop version (`*.fp`) can be opened too
* Plan is kept in the browser (localStorage), undo/redo, works offline (PWA)
* Read-only view for phones

The UI is in German.

Development
-----------

Requires Node.js 24 and pnpm.

* `pnpm install`
* `pnpm dev` – start the dev server
* `pnpm test` – unit tests (Vitest)
* `pnpm lint` / `pnpm format` – Biome
* `pnpm build` – static build in `dist/`, deployable to any static host

Pushes to `master` are deployed to GitHub Pages by `.github/workflows/deploy.yml`
(enable Pages with "GitHub Actions" as source in the repository settings).

### Project structure

* `src/domain` – framework-independent logic: data model, overlaps, file format incl. import of old files
* `src/export` – PDF (pdfmake) and Excel (ExcelJS) exports, loaded on demand
* `src/store.ts` – application state (Zustand) with persistence and undo
* `src/ui` – React components

Hours are stored as whole hours counted from 00:00 of the first day (`26` = 02:00 next morning),
so plans can span midnight or several days.

Technologies
------------

* TypeScript, React, Vite
* Tailwind CSS, lucide icons, IBM Plex fonts
* Zustand, dnd-kit
* pdfmake, ExcelJS
* Vitest, Biome

History
-------

FireParty started in 2016 as a JavaFX desktop application. That version is tagged as
[`v1.0.0-javafx`](../../tree/v1.0.0-javafx).

Licencing
---------

FireParty is licenced under the [MIT License (MIT)](LICENSE).

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
