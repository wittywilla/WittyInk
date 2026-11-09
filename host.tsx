// SPDX-License-Identifier: AGPL-3.0-or-later
//
// WittyInk - What every reader shares: annotations, notes, definitions, citations and handwriting.
// Copyright (C) 2026 WittyWilla and contributors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import { createContext, useContext } from 'react'

// The readers (WittyEbook, WittyPDF, WittyComics) talk to whatever app runs
// them only through a ReaderHost. WittyMediaServer's host saves to the server
// per account; the WittyReader app's host reads local files and saves on the
// device. Modules never import app code (scripts/check-modules.mjs enforces it).

export type BookMeta = { title: string; author?: string; year?: number | null }

// A bookmark, highlight or ink stroke. "Chapter" is a chapter in an EPUB and
// a page in a PDF.
export type Ann = {
  id: number; kind: 'bookmark' | 'highlight' | 'ink'; chapter: number; pos: number
  quote: string; prefix: string; suffix: string; color: string; note: string; data?: string; created: number
}

export type EpubInfo = { spine: string[]; toc: { title: string; href: string }[]; words: number[] }
export type SearchHit = { chapter: number; snippet: string; quote: string; prefix: string }
export type Definition = { word?: string; phonetic?: string; meanings?: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[] }

export interface ReaderHost {
  key: string // stable id of the book, for per-book settings
  book: BookMeta
  format: 'epub' | 'pdf' | 'cbz'
  reading?: string // comics: ltr, rtl or webtoon
  start: number // saved position: chapter or page, plus how far into it
  saveProgress(position: number, total: number): void
  annotations: {
    list(): Promise<Ann[]>
    add(a: Partial<Ann>): Promise<Ann>
    update(a: Ann, patch: Partial<Ann>): Promise<void>
    remove(a: Ann): Promise<void>
  }
  pdf?: { url?: string; data?: Uint8Array; wasmUrl?: string; iccUrl?: string } // what pdf.js opens, and where its decoders are
  comic?: { pages: number; pageUrl(n: number): string }
  epub?: { info: EpubInfo; chapterUrl(path: string): string; search(q: string): Promise<SearchHit[]> }
  define?(word: string): Promise<Definition[]> // optional: needs a dictionary service
  toast(message: string): void
  close(): void
}

export const HostContext = createContext<ReaderHost | null>(null)
export function useHost(): ReaderHost {
  const h = useContext(HostContext)
  if (!h) throw new Error('a reader needs a HostContext provider')
  return h
}
