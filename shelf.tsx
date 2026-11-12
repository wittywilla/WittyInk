// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 WittyWilla and contributors

// The bookshelf: a books library as the web and desktop apps draw it, in place of the
// server-driven page's plain grid (sdui.json: the view wittyink.bookshelf). Every book,
// by series or by author, sorted and narrowed to one format, with the cover, how far
// you are and whether it's manga. Televisions and phones get the page's own grid.
//
// It knows the app only through the page host (docs/MODULES.md, "Pages"): the server's
// API with the viewer's own access, so a profile's library limits apply as everywhere.
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { IconBack, IconBook, IconSearch } from './icons'
import './shelf.css'
import { FORMATS, NONE, percentRead, shelfBooks, shelfGroups, SORTS, type ShelfBook, type ShelfSort, type ShelfState } from './shelfsort'

export * from './shelfsort'

/** What the app gives a module's page or view. */
export interface PageHost {
  request: <T = unknown>(method: string, path: string, body?: unknown) => Promise<T>
  user: { admin: boolean }
  store?: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown) => Promise<void> }
  token: () => string
  base: () => string
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// A picture from this server, with the sign-in where the app would add it (mediaUrl in the app).
function picture(host: PageHost, b: ShelfBook, width: number) {
  const base = host.base() || ''
  let url = `${base}/api/items/${b.id}/poster?v=${b.updatedAt || 0}&w=${width}`
  const tok = host.token()
  if (tok && (base || location.protocol !== 'https:')) url += `&token=${encodeURIComponent(tok)}`
  return url
}

// Opening a book's page goes through the app's own router, as a link inside it would.
function open(path: string) {
  history.pushState(null, '', path)
  dispatchEvent(new PopStateEvent('popstate'))
}

const SAVED = 'wittyink.shelf.'
function savedState(library: string): ShelfState {
  const fallback: ShelfState = { tab: 'books', sort: 'title', desc: false, format: 'all', q: '', group: null }
  try {
    const v = JSON.parse(sessionStorage.getItem(SAVED + library) || 'null')
    if (!v || typeof v !== 'object') return fallback
    return {
      tab: ['books', 'series', 'authors'].includes(v.tab) ? v.tab : 'books',
      sort: SORTS.some((s) => s.id === v.sort) ? v.sort : 'title',
      desc: v.desc === true,
      format: FORMATS.some((f) => f.id === v.format) ? v.format : 'all',
      q: '', group: typeof v.group === 'string' ? v.group : null,
    }
  } catch { return fallback }
}

/** The view wittyink.bookshelf. `library` is the NativeView's library property. */
export function Bookshelf({ host, library }: { host: PageHost; library?: string | number }) {
  const lib = String(library ?? '')
  const [books, setBooks] = useState<ShelfBook[] | null>(null)
  const [failed, setFailed] = useState('')
  const [s, setS] = useState<ShelfState>(() => savedState(lib))
  const set = (v: Partial<ShelfState>) => setS((cur) => {
    const n = { ...cur, ...v }
    try { sessionStorage.setItem(SAVED + lib, JSON.stringify({ ...n, q: '' })) } catch { /* kept for now only */ }
    return n
  })
  const [tries, setTries] = useState(0)

  useEffect(() => {
    if (!/^\d+$/.test(lib)) { setFailed('This view needs a books library.'); return }
    let live = true
    setBooks(null); setFailed('')
    host.request<{ items: ShelfBook[] }>('GET', `/items?library=${lib}&kind=book&sort=title`)
      .then((r) => { if (live) setBooks(Array.isArray(r?.items) ? r.items : []) })
      .catch((e: Error) => { if (live) setFailed(e?.message || 'The books couldn’t be loaded.') })
    return () => { live = false }
  }, [host, lib, tries])

  const formats = useMemo(() => FORMATS.filter((f) => f.id === 'all' || books?.some((b) => (b.reader || b.container) === f.id)), [books])
  const shown = useMemo(() => (books ? shelfBooks(books, s) : []), [books, s])
  const groups = useMemo(() => (books && s.tab !== 'books' && s.group === null ? shelfGroups(shelfBooks(books, { ...s, tab: 'books', group: null, sort: 'title', desc: false }), s.tab) : []), [books, s])

  if (failed) return (
    <div className="ink-shelf-state" role="alert">
      <p>{failed}</p>
      <button className="btn sm" onClick={() => setTries((n) => n + 1)}>Try again</button>
    </div>
  )
  if (!books) return <div className="ink-shelf-state" role="status" aria-label="Loading"><div className="spinner" /></div>
  if (!books.length) return (
    <div className="ink-shelf-state">
      <IconBook />
      <b>No books yet</b>
      <p>Put EPUB, PDF or CBZ files in this library’s folders and scan it.</p>
    </div>
  )

  const groupName = s.group === null ? '' : s.group === NONE ? (s.tab === 'series' ? 'Not in a series' : 'No author') : s.group
  return (
    <section className="ink-shelf" aria-label="Books">
      <div className="ink-shelf-bar">
        {s.group !== null ? (
          <button className="ink-shelf-back" onClick={() => set({ group: null })}><IconBack /> {s.tab === 'series' ? 'Every series' : 'Every author'}</button>
        ) : (
          <div className="ink-shelf-tabs" role="tablist" aria-label="Show">
            {([['books', 'Books'], ['series', 'Series'], ['authors', 'Authors']] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={s.tab === id} className={s.tab === id ? 'on' : ''} onClick={() => set({ tab: id, group: null })}>{label}</button>
            ))}
          </div>
        )}
        {formats.length > 2 && (
          <div className="ink-shelf-chips" role="group" aria-label="Kind">
            {formats.map((f) => <button key={f.id} aria-pressed={s.format === f.id} className={s.format === f.id ? 'on' : ''} onClick={() => set({ format: f.id })}>{f.label}</button>)}
          </div>
        )}
        <label className="ink-shelf-search">
          <IconSearch />
          <input type="search" value={s.q} onChange={(e) => set({ q: e.target.value })} placeholder="Find a title, author or series" aria-label="Find in this library" />
        </label>
        {s.tab === 'books' && s.group === null && (
          <div className="ink-shelf-sort">
            <select value={s.sort} onChange={(e) => set({ sort: e.target.value as ShelfSort })} aria-label="Sort by">
              {SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button className="ink-shelf-dir" onClick={() => set({ desc: !s.desc })} aria-label={s.desc ? 'Reversed: put it back' : 'Reverse the order'} aria-pressed={s.desc}>{s.desc ? '↑' : '↓'}</button>
          </div>
        )}
      </div>

      {s.group !== null && <h2 className="ink-shelf-title">{groupName}<span>{plural(shown.length, 'book', 'books')}</span></h2>}
      {s.tab === 'books' || s.group !== null ? (
        shown.length === 0
          ? <p className="ink-shelf-none">Nothing here matches.</p>
          : <>
            {s.group === null && <p className="ink-shelf-count">{plural(shown.length, 'book', 'books')}</p>}
            <ul className="ink-shelf-grid">{shown.map((b) => <Cover key={b.id} host={host} b={b} />)}</ul>
          </>
      ) : groups.length === 0 ? <p className="ink-shelf-none">Nothing here matches.</p> : (
        <ul className="ink-shelf-grid">
          {groups.map((g) => (
            <li key={g.name}>
              <button className="ink-shelf-card" onClick={() => set({ group: g.name })}>
                <span className="ink-shelf-cover stack">
                  {g.books.slice(0, 3).reverse().map((b, i) => <Pic key={b.id} host={host} b={b} style={{ ['--i' as string]: String(Math.min(2, g.books.length - 1) - i) }} />)}
                </span>
                <b>{g.name === NONE ? (s.tab === 'series' ? 'Not in a series' : 'No author') : g.name}</b>
                <span className="ink-shelf-sub">{plural(g.books.length, 'book', 'books')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Pic({ host, b, style }: { host: PageHost; b: ShelfBook; style?: CSSProperties }) {
  const [broken, setBroken] = useState(!b.poster)
  return broken
    ? <span className="ink-shelf-blank" style={style}><IconBook /><i>{b.title}</i></span>
    : <img src={picture(host, b, 320)} alt="" loading="lazy" style={style} onError={() => setBroken(true)} />
}

function Cover({ host, b }: { host: PageHost; b: ShelfBook }) {
  const pct = percentRead(b)
  const kind = b.reading === 'rtl' ? 'Manga' : (b.reader || b.container) === 'cbz' ? 'Comic' : (b.reader || b.container) === 'pdf' ? 'PDF' : 'Book'
  const sub = [b.artist, b.album ? `${b.album}${b.track ? ` #${b.track}` : ''}` : ''].filter(Boolean).join(' · ')
  return (
    <li>
      <a className="ink-shelf-card" href={`/item/${b.id}`} onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); open(`/item/${b.id}`) } }}
        aria-label={`${b.title}${b.artist ? `, ${b.artist}` : ''}, ${kind}${pct >= 100 ? ', finished' : pct > 0 ? `, ${Math.round(pct)}% read` : ''}`}>
        <span className="ink-shelf-cover">
          <Pic host={host} b={b} />
          {b.reading === 'rtl' && <span className="ink-shelf-badge">Manga</span>}
          {pct >= 100 ? <span className="ink-shelf-done" aria-hidden="true">✓</span> : pct > 0 && <span className="ink-shelf-prog" style={{ width: pct + '%' }} />}
        </span>
        <b>{b.title}</b>
        {sub && <span className="ink-shelf-sub">{sub}</span>}
      </a>
    </li>
  )
}

/** The views WittyInk's bundle draws, by view ID (docs/SDUI-MODULES.md, "Views"). */
export const views = { 'wittyink.bookshelf': Bookshelf }
