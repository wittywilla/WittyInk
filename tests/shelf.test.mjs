// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 WittyWilla and contributors
// The bookshelf's order, filters and groups (shelfsort.ts).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NONE, percentRead, shelfBooks, shelfGroups } from '../shelfsort.ts'

const books = [
  { id: 1, title: 'Notes on Quiet Machines', artist: 'B. Generated', reader: 'epub', year: 2020, addedAt: 30 },
  { id: 2, title: 'The Lantern Harbour', sortTitle: 'Lantern Harbour', artist: 'Ada Testwright', album: 'Lantern Cycle', track: 2, reader: 'epub', year: 2024, addedAt: 10 },
  { id: 3, title: 'The Lantern Road', sortTitle: 'Lantern Road', artist: 'Ada Testwright', album: 'Lantern Cycle', track: 1, reader: 'epub', year: 2023, addedAt: 20, progress: { positionSec: 2, durationSec: 5 } },
  { id: 4, title: 'Signal Bars 10', album: 'Signal Bars', track: 10, reader: 'cbz', addedAt: 40, progress: { positionSec: 0, watched: true } },
  { id: 5, title: 'Signal Bars 2', album: 'Signal Bars', track: 2, reader: 'cbz', addedAt: 50 },
  { id: 6, title: 'Field Manual', container: 'pdf', addedAt: 60 },
]
const base = { tab: 'books', sort: 'title', desc: false, format: 'all', q: '', group: null }
const ids = (l) => l.map((b) => b.id)

test('by title uses the sorting title and counts numbers as numbers', () => {
  assert.deepEqual(ids(shelfBooks(books, base)), [6, 2, 3, 1, 5, 4])
  assert.deepEqual(ids(shelfBooks(books, { ...base, desc: true })), [4, 5, 1, 3, 2, 6])
})

test('by author puts books with no author last, then by title', () => {
  assert.deepEqual(ids(shelfBooks(books, { ...base, sort: 'author' })), [2, 3, 1, 6, 5, 4])
})

test('recently added and year come newest first', () => {
  assert.deepEqual(ids(shelfBooks(books, { ...base, sort: 'added' })), [6, 5, 4, 1, 3, 2])
  assert.deepEqual(ids(shelfBooks(books, { ...base, sort: 'year' })).slice(0, 3), [2, 3, 1])
})

test('a format narrows to it, reading the container when the reader is not named', () => {
  assert.deepEqual(ids(shelfBooks(books, { ...base, format: 'cbz' })), [5, 4])
  assert.deepEqual(ids(shelfBooks(books, { ...base, format: 'pdf' })), [6])
})

test('finding looks in the title, author and series, ignoring case', () => {
  assert.deepEqual(ids(shelfBooks(books, { ...base, q: 'lantern' })), [2, 3])
  assert.deepEqual(ids(shelfBooks(books, { ...base, q: 'TESTWRIGHT' })), [2, 3])
  assert.deepEqual(ids(shelfBooks(books, { ...base, q: 'signal' })), [5, 4])
})

test('a series is in its own order, and an author by series then number', () => {
  assert.deepEqual(ids(shelfBooks(books, { ...base, tab: 'series', group: 'Lantern Cycle' })), [3, 2])
  assert.deepEqual(ids(shelfBooks(books, { ...base, tab: 'series', group: NONE })), [6, 1])
  assert.deepEqual(ids(shelfBooks(books, { ...base, tab: 'authors', group: 'Ada Testwright' })), [3, 2])
})

test('groups are by name, with the books in neither last', () => {
  const series = shelfGroups(books, 'series')
  assert.deepEqual(series.map((g) => g.name), ['Lantern Cycle', 'Signal Bars', NONE])
  assert.deepEqual(ids(series[1].books), [5, 4])
  assert.deepEqual(shelfGroups(books, 'authors').map((g) => [g.name, g.books.length]), [['Ada Testwright', 2], ['B. Generated', 1], [NONE, 3]])
})

test('how far through a book is', () => {
  assert.equal(percentRead(books[2]), 40)
  assert.equal(percentRead(books[3]), 100)
  assert.equal(percentRead(books[0]), 0)
  assert.equal(percentRead({ id: 9, title: 'x', runtimeSec: 10, progress: { positionSec: 25 } }), 100)
})
