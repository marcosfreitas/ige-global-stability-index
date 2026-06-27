import { useState, useEffect, useMemo } from 'react'
import { DATA_URL, AGGREGATE_ISOS, REGION_ORDER, countryName } from '../lib/constants.js'

export function useIgeData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [countryMap, setCountryMap] = useState({})

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        const entries = Array.isArray(json.data) ? json.data : []
        const map = {}
        entries.forEach(e => {
          if (!map[e.iso]) map[e.iso] = { region: e.region, entries: [] }
          map[e.iso].entries.push(e)
        })
        Object.values(map).forEach(c => c.entries.sort((a, b) => a.year - b.year))
        setCountryMap(map)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const regions = useMemo(() => {
    const available = [...new Set(Object.values(countryMap).map(c => c.region))].filter(Boolean)
    const ordered = REGION_ORDER.filter(r => available.includes(r))
    const rest = available.filter(r => !REGION_ORDER.includes(r)).sort()
    return [...ordered, ...rest]
  }, [countryMap])

  return { loading, error, countryMap, regions }
}

/** Return the most data-rich recent entry for a country's entries array. */
export function bestEntry(entries) {
  if (!entries?.length) return null
  const withIge = entries.filter(e => e.ige != null)
  if (!withIge.length) return null
  const meaningful = withIge.filter(e => (e.factors_used?.length ?? 0) >= 3)
  return meaningful.length ? meaningful[meaningful.length - 1] : withIge[withIge.length - 1]
}

/** Filtered + sorted country list for a given region / search query. */
export function regionCountriesFor(countryMap, region, search) {
  const q = search.trim().toLowerCase()
  const pool = q
    ? Object.entries(countryMap).filter(([iso]) => !AGGREGATE_ISOS.has(iso))
    : Object.entries(countryMap).filter(([iso, c]) => c.region === region && !AGGREGATE_ISOS.has(iso))

  return pool
    .filter(([iso]) => {
      if (!q) return true
      const name = (countryName(iso) || '').toLowerCase()
      return iso.toLowerCase().includes(q) || name.includes(q)
    })
    .map(([iso, c]) => {
      const entry = bestEntry(c.entries)
      return { iso, ige: entry?.ige ?? null, year: entry?.year ?? null }
    })
    .sort((a, b) => {
      if (a.ige == null && b.ige == null) return 0
      if (a.ige == null) return 1
      if (b.ige == null) return -1
      return b.ige - a.ige
    })
}

/** Aggregate summary stats for a region. */
export function regionSummaryFor(countryMap, region) {
  const isos = region === 'global'
    ? Object.keys(countryMap).filter(iso => !AGGREGATE_ISOS.has(iso))
    : Object.entries(countryMap)
        .filter(([iso, c]) => c.region === region && !AGGREGATE_ISOS.has(iso))
        .map(([iso]) => iso)

  const entries = isos.map(iso => bestEntry(countryMap[iso]?.entries)).filter(Boolean)
  if (!entries.length) return null

  const vals = field => entries.map(e => e[field]).filter(v => v != null)
  const median = arr => {
    if (!arr.length) return null
    const s = [...arr].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
  }

  const totalDeaths  = entries.reduce((sum, e) => sum + (e.conflict_deaths ?? 0), 0)
  const inConflict   = entries.filter(e => (e.conflict_deaths ?? 0) > 0).length
  const inCrise      = entries.filter(e => e.ige != null && e.ige < 40).length
  const medInflation = median(vals('inflation'))
  const medGdp       = median(vals('gdp_growth'))
  const medUnem      = median(vals('unemployment'))
  const medIge       = median(vals('ige'))

  return { totalDeaths, inConflict, inCrise, medInflation, medGdp, medUnem, medIge, n: entries.length }
}
