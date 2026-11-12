// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 WittyWilla and contributors

// What the bookshelf view shows, as plain functions with no React, so they are tested on
// their own (tests/shelf.test.mjs).

/** A book as GET /api/items lists it: only what the shelf uses. */
export interface ShelfBook {
  id: number; title: string; sortTitle?: string; year?: number | null
  artist?: string; album?: string; track?: number | null
  reader?: string; container?: string; reading?: string
  poster?: string; updatedAt?: number; addedAt?: number; runtimeSec?: number
  progress?: { positionSec: number; durationSec?: number; watched?: boolean } | null
}

export type ShelfTab = 'books' | 'series' | 'authors'
export type ShelfSort = 'title' | 'added' | 'year' | 'author'
export type ShelfFormat = 'all' | 'epub' | 'pdf' | 'cbz'
export interface ShelfState { tab: ShelfTab; sort: ShelfSort; desc: boolean; format: ShelfFormat; q: string; group: string | null }

export const FORMATS: { id: ShelfFormat; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'epub', label: 'Books' }, { id: 'pdf', label: 'PDFs' }, { id: 'cbz', label: 'Comics' }]
export const SORTS: { id: ShelfSort; label: string }[] = [{ id: 'title', label: 'Title' }, { id: 'author', label: 'Author' }, { id: 'added', label: 'Recently added' }, { id: 'year', label: 'Year' }]
/** The group of books with no series, or no author. */
export const NONE = '\u0000'
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** How far through a book is, 0 to 100. */
export function percentRead(b: ShelfBook): number {
  const p = b.progress
  if (!p) return 0
  if (p.watched) return 100
  const total = p.durationSec || b.runtimeSec || 0
  return total > 0 ? Math.max(0, Math.min(100, (p.positionSec / total) * 100)) : 0
}

const key = (b: ShelfBook) => (b.sortTitle || b.title || '').trim()

/** The books a choice shows, in its order. Pure, so it is tested on its own. */
export function shelfBooks(all: ShelfBook[], s: Pick<ShelfState, 'sort' | 'desc' | 'format' | 'q' | 'tab' | 'group'>): ShelfBook[] {
  const q = s.q.trim().toLocaleLowerCase()
  let out = all.filter((b) => (s.format === 'all' || (b.reader || b.container) === s.format)
    && (!q || [b.title, b.artist, b.album].some((v) => v && v.toLocaleLowerCase().includes(q))))
  if (s.group !== null) {
    // Inside a series, in its own order; inside an author, by series then title.
    if (s.tab === 'series') return out.filter((b) => (b.album || NONE) === s.group).sort((a, b) => (a.track ?? 1e9) - (b.track ?? 1e9) || collator.compare(key(a), key(b)))
    out = out.filter((b) => (b.artist || NONE) === s.group)
    return out.sort((a, b) => collator.compare(a.album || '￿', b.album || '￿') || (a.track ?? 1e9) - (b.track ?? 1e9) || collator.compare(key(a), key(b)))
  }
  const by: Record<ShelfSort, (a: ShelfBook, b: ShelfBook) => number> = {
    title: (a, b) => collator.compare(key(a), key(b)),
    // Books with no author go after the others, whichever way round.
    author: (a, b) => (!a.artist ? 1 : 0) - (!b.artist ? 1 : 0) || collator.compare(a.artist || '', b.artist || '') || collator.compare(key(a), key(b)),
    added: (a, b) => (b.addedAt || 0) - (a.addedAt || 0) || collator.compare(key(a), key(b)),
    year: (a, b) => (b.year || 0) - (a.year || 0) || collator.compare(key(a), key(b)),
  }
  out = out.sort(by[s.sort])
  return s.desc ? out.reverse() : out
}

export interface ShelfGroup { name: string; books: ShelfBook[] }

/** Series or authors, each with its books; books with neither come last under NONE. */
export function shelfGroups(books: ShelfBook[], tab: 'series' | 'authors'): ShelfGroup[] {
  const m = new Map<string, ShelfBook[]>()
  for (const b of books) {
    const name = (tab === 'series' ? b.album : b.artist) || NONE
    m.set(name, [...(m.get(name) || []), b])
  }
  return [...m.entries()].map(([name, list]) => ({ name, books: list.sort((a, b) => (a.track ?? 1e9) - (b.track ?? 1e9) || collator.compare(key(a), key(b))) }))
    .sort((a, b) => (a.name === NONE ? 1 : 0) - (b.name === NONE ? 1 : 0) || collator.compare(a.name, b.name))
}
