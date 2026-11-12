# Changelog

What changed in WittyInk, newest first. What changed before it had a repository of its own is in the
[WittyMediaServer changelog](https://github.com/wittywilla/WittyMediaServer/blob/master/CHANGELOG.md).

## Unreleased

- **Settings in every app's Settings, under Modules** (`sdui.json`, each profile's own): handwriting (pen pressure, only a pen draws, a pen writes straight away, highlighter over text) and what each highlight colour means. `ReaderHost.settings` (optional) gives a reader the profile's settings of any module and saves changes made in the reader; `settingEnum`, `settingInt`, `settingBool` and `laterSaver` help read and save them.
- **A book's own page** (`wittyink-book`, for every book, PDF and comic): its cover and details, Read, Continue reading or Read again, Download and Share, and more like it.
- The bookshelf filters by **Reading** and **Finished**, as well as by kind.
- **Readers can report what goes wrong:** `ReaderHost` has an optional `report(level, message, detail)`, so a reader's failures reach the app's log (WittyMediaServer's server log). Fixed messages only, never anything from the book or a token; hosts without it still work.
- **Module API 4**, for WittyMediaServer 0.8.0-alpha and later: the module carries its own server-driven UI in `sdui.json`, which `wittymodule pack` puts in every archive.
- **Its own server-driven pages** (`sdui.json`): the page of every books library and the Books page, made of the server's catalogue so every app draws them. On the web and desktop apps a books library shows the new **bookshelf** (`wittyink.bookshelf`, `shelf.tsx`): Books, Series and Authors, sorted by title, author, date added or year, narrowed to books, PDFs or comics, with a quick find and how far you are; televisions and phones get every cover in a grid. Series are grouped from the books themselves.
- **WittyInk 0.3.0:** Fits WittyMediaServer 0.8.x.

- Module API 3 and WittyMediaServer 0.6.0-alpha: this is how a server gets it now, with no copy compiled in.
- The host can tell a PDF reader where pdf.js's decoders are.
- WittyInk is now a project of its own, developed and released from this repository.
