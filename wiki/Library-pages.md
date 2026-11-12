# Library pages and the bookshelf

WittyInk carries the pages a WittyMediaServer shows for books, in its own `sdui.json`
(the server's [module SDUI](https://github.com/wittywilla/WittyMediaServer/blob/master/docs/SDUI-MODULES.md)).
Every reader needs WittyInk, so these pages come with whichever readers a server has.

| Page | What it shows |
|---|---|
| A books library (`wittyink-library`) | **Continue reading**, then the **bookshelf**. |
| Books (`wittyink-books`) | **Continue reading**, then what's new in each books and audiobooks library. |

An administrator can change either in **Settings → Pages**, or replace it with a page of their
own; the page editor's gallery also has **Continue reading** and **New books in each library**.

## The bookshelf

On the web and desktop apps, a books library shows the bookshelf, drawn by WittyInk itself:

- **Books, Series and Authors.** A series or an author opens to its books, a series in its own
  order. Books with no series or author are grouped last.
- **Sort** by title, author, date added or year, either way round. Titles sort with numbers as
  numbers, so issue 2 comes before issue 10, and "The" is left out where the book says so.
- **Books, PDFs and Comics** narrow the shelf to one kind, when a library holds more than one.
- **Find** looks in titles, authors and series as you type.
- Each cover shows how far you are, a tick when you've finished, and **Manga** for a book read
  right to left.

The choice is kept for the browser tab, per library. The shelf asks the server for the books
with your own access, so a profile's limits apply to it as to everything else.

Televisions and phones show every cover in a grid instead, newest first.

## For developers

The view is `wittyink.bookshelf` (`Bookshelf` in `shelf.tsx`), exported from the bundle as
`views`. Its order and grouping are plain functions in `shelfsort.ts`, tested in
`tests/shelf.test.mjs` (`npm test`).
