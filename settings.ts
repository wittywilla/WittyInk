// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 WittyWilla and contributors

// Reading a module's settings (ReaderHost.settings) with care, since they come from a server,
// and saving changes made in a reader a moment after the last one, not on every step of a slider.

/** One of the choices, or the fallback. */
export function settingEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}
/** A whole number within its range, or the fallback. */
export function settingInt(v: unknown, lo: number, hi: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback
}
export function settingBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

/** A saver that sends the last values once nothing has changed for `wait` ms. */
export function laterSaver(save: ((values: Record<string, unknown>) => void) | undefined, wait = 600) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let latest: Record<string, unknown> = {}
  return (values: Record<string, unknown>) => {
    if (!save) return
    latest = { ...latest, ...values }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { timer = null; const v = latest; latest = {}; save(v) }, wait)
  }
}
