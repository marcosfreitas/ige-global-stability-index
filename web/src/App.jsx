import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

// ─── Design tokens — pastel edition ──────────────────────────────────────────
// Zone accents are desaturated ~40% vs. the original neon spec for
// long-session readability. Contrast ratios against the canvas:
//   text (#D8EDE7 on #0A0E17) ≈ 11.8:1  — WCAG AAA
//   teal (#6ECABA on #0A0E17) ≈  7.4:1  — WCAG AAA
//   crisis (#F2956E on #0A0E17) ≈ 6.1:1 — WCAG AA
const C = {
  canvas:   '#0A0E17',   // midnight canvas — unchanged
  surface:  '#101826',   // card/panel background
  surface2: '#152030',   // hover state
  border:   '#1E3040',   // structural dividers
  text:     '#D8EDE7',   // primary text — warmer pale white
  textDim:  '#9FBDB6',   // secondary labels, readable at small sizes
  teal:     '#6ECABA',   // pastel teal (was #00D4AA)
  crisis:   '#F2956E',   // soft coral (was #FF6B35)
  warning:  '#E8CC7A',   // warm pastel amber (was #FFD166)
  stable:   '#78CC98',   // soft mint (was #4CAF82)
  slate:    '#8AAAB8',   // cool slate for secondary labels
  slateD:   '#1E3040',   // dark panel / inert surfaces
}

const MONO = "'IBM Plex Mono', monospace"
const SANS = "'Inter', sans-serif"

// Shared label style — tiny allcaps used throughout
const LABEL_STYLE = {
  fontSize: 10,
  fontFamily: MONO,
  color: C.textDim,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DATA_URL = 'https://raw.githubusercontent.com/marcosfreitas/ige-global-stability-index/main/data/ige-dataset-real.json'

const REGION_LABELS = {
  latin_america_caribbean:    'Latin America & Caribbean',
  europe_central_asia:        'Europe & Central Asia',
  north_america:              'North America',
  sub_saharan_africa:         'Sub-Saharan Africa',
  middle_east_north_africa:   'Middle East & N. Africa',
  south_asia:                 'South Asia',
  east_asia_pacific:          'East Asia & Pacific',
  global:                     'World Aggregate',
  // backward-compat abbrevs from reference data
  latam:   'Latin America',
  europa:  'Europe',
  norte:   'North America',
  africa:  'Sub-Saharan Africa',
  mena:    'Middle East & N. Africa',
  asia:    'Asia',
}

// Sort order for region dropdown — named regions first, world aggregate last
const REGION_ORDER = [
  'east_asia_pacific',
  'europe_central_asia',
  'latin_america_caribbean',
  'middle_east_north_africa',
  'north_america',
  'south_asia',
  'sub_saharan_africa',
  'global',
]

// Well-known crisis annotations shown in chart tooltip
const CRISIS_EVENTS = {
  1973: 'Oil Crisis',
  1982: 'Debt Crisis',
  1998: 'Asian/Russian',
  2001: '9/11',
  2008: 'GFC',
  2009: 'GFC',
  2020: 'COVID-19',
}

function regionLabel(r) {
  return REGION_LABELS[r] || (r ? r.replace(/_/g, ' ') : '—')
}

// ─── Zone helpers ─────────────────────────────────────────────────────────────
function getZone(ige) {
  if (ige == null) return { label: '—',       color: C.slate,   key: 'none'    }
  if (ige < 40)   return { label: 'CRISE',    color: C.crisis,  key: 'crise'   }
  if (ige < 55)   return { label: 'ATENÇÃO',  color: C.warning, key: 'atencao' }
  if (ige < 70)   return { label: 'ESTÁVEL',  color: C.stable,  key: 'estavel' }
  return              { label: 'ROBUSTA',  color: C.stable,  key: 'robusta' }
}

// Ghost watermark opacity: full at <40, linear fade 40→55, gone at ≥55
function ghostOpacity(ige) {
  if (ige == null)     return 0
  if (ige < 40)        return 0.04
  if (ige < 55)        return 0.04 * (55 - ige) / 15
  return 0
}

function fmt(v, decimals = 1) {
  if (v == null) return '—'
  return typeof v === 'number' ? v.toFixed(decimals) : String(v)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Zone bar — inline progress bar
function ZoneBar({ ige }) {
  const pct  = ige != null ? Math.min(100, Math.max(0, ige)) : 0
  const z    = getZone(ige)
  return (
    <div style={{ position: 'relative', height: 3, background: C.slateD, borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, height: '100%',
        width: `${pct}%`,
        background: z.color,
        transition: 'width 0.4s ease, background 0.4s ease',
      }} />
      {/* Zone threshold marks */}
      {[40, 55, 70].map(t => (
        <div key={t} style={{
          position: 'absolute', left: `${t}%`, top: 0,
          height: '100%', width: 1, background: C.slateD,
        }} />
      ))}
    </div>
  )
}

// Custom recharts tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const event = CRISIS_EVENTS[label]
  return (
    <div style={{
      background: C.surface2,
      border: `1px solid ${C.border}`,
      padding: '10px 14px',
      fontFamily: MONO,
      fontSize: 11,
      color: C.text,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: C.textDim, marginBottom: 6, fontSize: 10, letterSpacing: '0.1em' }}>
        {label}{event ? <span style={{ color: C.warning }}> · {event}</span> : null}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {String(p.name).toUpperCase()}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

// Factor card
function FactorCard({ label, value, unit, isWarn, zoneColor }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${isWarn ? zoneColor + '66' : C.border}`,
      padding: '14px 16px',
      borderRadius: 4,
    }}>
      <div style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 10 }}>{label}</div>
      <div style={{
        fontFamily: MONO,
        fontSize: 24,
        fontWeight: 600,
        color: isWarn ? zoneColor : C.text,
        lineHeight: 1,
        letterSpacing: '-0.01em',
      }}>
        {value != null ? `${fmt(value, unit === '' ? 0 : 2)}${unit}` : '—'}
      </div>
    </div>
  )
}

// Loading screen with terminal animation
function LoadingScreen() {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 4), 350)
    return () => clearInterval(id)
  }, [])
  const dots = '.'.repeat(frame)
  const bars = ['▏','▎','▍','▌'][frame]

  return (
    <div style={{
      minHeight: '100vh', background: C.canvas, color: C.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: MONO,
    }}>
      <div style={{ color: C.teal, fontSize: 36, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>IGE</div>
      <div style={{ color: C.textDim, fontSize: 10, letterSpacing: '0.2em', marginBottom: 48 }}>ÍNDICE GLOBAL DE ESTABILIDADE</div>
      <div style={{ color: C.textDim, fontSize: 13 }}>
        <span style={{ color: C.teal }}>{bars}</span>
        {' '}CARREGANDO DATASET{dots}
      </div>
      <div style={{ color: C.slate, fontSize: 10, marginTop: 10, letterSpacing: '0.1em' }}>259 PAÍSES · 1962–2025</div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.canvas,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MONO, color: C.crisis, fontSize: 12,
    }}>
      ERRO AO CARREGAR DADOS: {message}
    </div>
  )
}

// Top navigation bar
function TopBar({ regions, selectedRegion, onRegionChange, selectedIso, currentIge, zone }) {
  const selectStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    fontFamily: MONO,
    fontSize: 11,
    padding: '7px 28px 7px 10px',
    borderRadius: 3,
    cursor: 'pointer',
    outline: 'none',
    minWidth: 180,
    letterSpacing: '0.04em',
  }
  return (
    <div style={{
      height: 60,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 20,
      background: C.canvas,
      flexShrink: 0,
    }}>
      {/* Wordmark */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.teal, letterSpacing: '0.1em', lineHeight: 1 }}>IGE</div>
        <div style={{ fontSize: 9, color: C.textDim, letterSpacing: '0.16em', marginTop: 2 }}>ÍNDICE GLOBAL DE ESTABILIDADE</div>
      </div>

      <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

      {/* Region selector */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <select
          value={selectedRegion || ''}
          onChange={e => onRegionChange(e.target.value)}
          style={selectStyle}
        >
          {regions.map(r => (
            <option key={r} value={r}>{regionLabel(r)}</option>
          ))}
        </select>
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          color: C.slate, fontSize: 9, pointerEvents: 'none',
        }}>▾</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Score badge */}
      {currentIge != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: '0.16em', marginBottom: 2 }}>IGE ATUAL</div>
            <div style={{ fontSize: 10, color: zone.color, letterSpacing: '0.14em', fontFamily: MONO }}>{zone.label}</div>
          </div>
          <div style={{
            fontFamily: MONO,
            fontSize: 26,
            fontWeight: 700,
            color: zone.color,
            background: zone.color + '14',
            border: `1px solid ${zone.color}55`,
            padding: '4px 14px',
            borderRadius: 3,
            letterSpacing: '0.02em',
            lineHeight: 1.2,
          }}>
            {currentIge.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading]           = useState(true)
  const [fetchError, setFetchError]     = useState(null)
  const [countryMap, setCountryMap]     = useState({})   // iso -> { region, entries[] }
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [selectedIso, setSelectedIso]   = useState(null)

  // Fetch and process dataset
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

        // Default: first region alphabetically, highest-IGE country within it
        const regions = [...new Set(entries.map(e => e.region))].sort()
        if (regions.length) {
          const firstRegion = regions[0]
          setSelectedRegion(firstRegion)
          const top = Object.entries(map)
            .filter(([, c]) => c.region === firstRegion)
            .map(([iso, c]) => {
              const withIge = c.entries.filter(e => e.ige != null)
              const last    = withIge.length ? withIge[withIge.length - 1] : null
              return { iso, ige: last?.ige ?? -1 }
            })
            .sort((a, b) => b.ige - a.ige)[0]
          if (top) setSelectedIso(top.iso)
        }
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err.message)
        setLoading(false)
      })
  }, [])

  // Region list — sorted per REGION_ORDER, unknowns appended alphabetically
  const regions = useMemo(() => {
    const available = [...new Set(Object.values(countryMap).map(c => c.region))].filter(Boolean)
    const ordered = REGION_ORDER.filter(r => available.includes(r))
    const rest = available.filter(r => !REGION_ORDER.includes(r)).sort()
    return [...ordered, ...rest]
  }, [countryMap])

  // Countries in the selected region, sorted by latest IGE descending
  const regionCountries = useMemo(() => {
    if (!selectedRegion) return []
    return Object.entries(countryMap)
      .filter(([, c]) => c.region === selectedRegion)
      .map(([iso, c]) => {
        const withIge = c.entries.filter(e => e.ige != null)
        const last    = withIge.length ? withIge[withIge.length - 1] : null
        return { iso, ige: last?.ige ?? null, year: last?.year ?? null }
      })
      .sort((a, b) => {
        if (a.ige == null && b.ige == null) return 0
        if (a.ige == null) return 1
        if (b.ige == null) return -1
        return b.ige - a.ige
      })
  }, [countryMap, selectedRegion])

  // Time series for selected country
  const timeSeries = useMemo(() => {
    if (!selectedIso || !countryMap[selectedIso]) return []
    return countryMap[selectedIso].entries
      .filter(e => e.ige != null || e.nivel != null)
      .map(e => ({ year: e.year, ige: e.ige, nivel: e.nivel, momentum: e.momentum }))
  }, [countryMap, selectedIso])

  // Latest entry for selected country
  const latestEntry = useMemo(() => {
    if (!selectedIso || !countryMap[selectedIso]) return null
    const withIge = countryMap[selectedIso].entries.filter(e => e.ige != null)
    return withIge.length ? withIge[withIge.length - 1] : null
  }, [countryMap, selectedIso])

  const currentIge  = latestEntry?.ige ?? null
  const zone        = getZone(currentIge)
  const ghostOp     = ghostOpacity(currentIge)

  // When region changes, pick top country in new region
  const handleRegionChange = (r) => {
    setSelectedRegion(r)
    const top = Object.entries(countryMap)
      .filter(([, c]) => c.region === r)
      .map(([iso, c]) => {
        const withIge = c.entries.filter(e => e.ige != null)
        const last    = withIge.length ? withIge[withIge.length - 1] : null
        return { iso, ige: last?.ige ?? -1 }
      })
      .sort((a, b) => b.ige - a.ige)[0]
    if (top) setSelectedIso(top.iso)
  }

  if (loading)     return <LoadingScreen />
  if (fetchError)  return <ErrorScreen message={fetchError} />

  return (
    <div style={{
      height: '100vh',
      background: C.canvas,
      color: C.text,
      fontFamily: SANS,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Signature element: ghost IGE watermark ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}>
        <span style={{
          fontFamily: MONO,
          fontSize: '30vw',
          fontWeight: 700,
          color: C.text,
          opacity: ghostOp,
          transition: 'opacity 1.2s ease',
          userSelect: 'none',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em',
        }}>
          {currentIge != null ? Math.round(currentIge) : ''}
        </span>
      </div>

      {/* ── Content layer ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar
          regions={regions}
          selectedRegion={selectedRegion}
          onRegionChange={handleRegionChange}
          selectedIso={selectedIso}
          currentIge={currentIge}
          zone={zone}
        />

        {/* ── Main two-column layout ── */}
        <div
          className="layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '256px 1fr',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* LEFT — Country grid */}
          <div
            className="left-panel"
            style={{
              borderRight: `1px solid ${C.border}`,
              overflowY: 'auto',
              paddingTop: 4,
              paddingBottom: 16,
            }}
          >
            <div style={{
              padding: '10px 16px 6px',
              fontSize: 9,
              color: C.textDim,
              letterSpacing: '0.18em',
              fontFamily: MONO,
              borderBottom: `1px solid ${C.border}`,
              marginBottom: 4,
            }}>
              {regionLabel(selectedRegion).toUpperCase()} · {regionCountries.length}
            </div>

            {regionCountries.map(({ iso, ige }) => {
              const z          = getZone(ige)
              const isSelected = iso === selectedIso
              return (
                <button
                  key={iso}
                  className="country-row"
                  onClick={() => setSelectedIso(iso)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '7px 14px',
                    background: isSelected ? C.surface : 'transparent',
                    border: 'none',
                    borderLeft: isSelected ? `2px solid ${C.teal}` : '2px solid transparent',
                    cursor: 'pointer',
                    gap: 10,
                    transition: 'background 0.12s',
                    outline: isSelected ? `0` : 'none',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.surface2 }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* ISO code */}
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: 600,
                    color: isSelected ? C.teal : C.text,
                    width: 30,
                    flexShrink: 0,
                    letterSpacing: '0.06em',
                  }}>
                    {iso}
                  </span>

                  {/* Zone bar */}
                  <div className="zone-bar-wrap" style={{ flex: 1, minWidth: 0 }}>
                    <ZoneBar ige={ige} />
                  </div>

                  {/* IGE score */}
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: z.color,
                    width: 34,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    {ige != null ? ige.toFixed(1) : '—'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* RIGHT — Detail panel */}
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {latestEntry ? (
              <>
                {/* Country header strip */}
                <div style={{ padding: '20px 28px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
                    <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '0.06em' }}>
                      {selectedIso}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.textDim, letterSpacing: '0.06em' }}>
                      {regionLabel(countryMap[selectedIso]?.region)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.slate }}>·</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.textDim }}>
                      {latestEntry.year}
                    </span>
                  </div>

                  {/* Score + submetrics row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{
                        fontFamily: MONO, fontSize: 48, fontWeight: 700,
                        color: zone.color, lineHeight: 1,
                        transition: 'color 0.5s ease',
                      }}>
                        {fmt(currentIge)}
                      </span>
                      <div>
                        <div style={{ fontSize: 8, color: C.slate, letterSpacing: '0.18em', marginBottom: 3 }}>ÍNDICE GLOBAL</div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: zone.color, letterSpacing: '0.1em' }}>
                          {zone.label}
                        </div>
                      </div>
                    </div>

                    <div style={{ width: 1, height: 36, background: C.border }} />

                    {[
                      { label: 'NÍVEL',    value: latestEntry.nivel,    color: C.textDim },
                      { label: 'MOMENTUM', value: latestEntry.momentum, color: C.warning  },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color }}>{fmt(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time series chart */}
                <div style={{ padding: '20px 28px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ ...LABEL_STYLE, fontSize: 9 }}>
                      SÉRIE HISTÓRICA
                      {timeSeries.length > 0 &&
                        ` · ${timeSeries[0].year}–${timeSeries[timeSeries.length - 1].year}`
                      }
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 16 }}>
                      {[
                        { key: 'ige',      label: 'IGE',      color: C.teal,    w: 2 },
                        { key: 'nivel',    label: 'NÍVEL',    color: C.textDim, w: 1 },
                        { key: 'momentum', label: 'MOMENTUM', color: C.warning, w: 1 },
                      ].map(({ key, label, color, w }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: MONO, color }}>
                          <div style={{ width: 14, height: w, background: color, opacity: 0.9 }} />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {timeSeries.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                          <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="year"
                            tick={{ fill: C.textDim, fontSize: 10, fontFamily: MONO }}
                            tickLine={false}
                            axisLine={{ stroke: C.border }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: C.textDim, fontSize: 10, fontFamily: MONO }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            ticks={[0, 25, 40, 55, 70, 100]}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          {/* Zone threshold lines */}
                          <ReferenceLine y={40} stroke={C.crisis}  strokeDasharray="4 4" strokeOpacity={0.35} />
                          <ReferenceLine y={55} stroke={C.warning} strokeDasharray="4 4" strokeOpacity={0.35} />
                          <ReferenceLine y={70} stroke={C.stable}  strokeDasharray="4 4" strokeOpacity={0.25} />
                          {/* Data lines — render IGE on top */}
                          <Line type="monotone" dataKey="nivel"    stroke={C.slate}   strokeWidth={1}   dot={false} name="Nível"    connectNulls strokeOpacity={0.7} />
                          <Line type="monotone" dataKey="momentum" stroke={C.warning} strokeWidth={1}   dot={false} name="Momentum" connectNulls strokeOpacity={0.5} />
                          <Line type="monotone" dataKey="ige"      stroke={C.teal}    strokeWidth={2.5} dot={false} name="IGE"      connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate, fontFamily: MONO, fontSize: 11 }}>
                      SEM DADOS HISTÓRICOS
                    </div>
                  )}
                </div>

                {/* Factor breakdown */}
                <div style={{ padding: '20px 28px 28px', flexShrink: 0 }}>
                  <div style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 14 }}>
                    FATORES ECONÓMICOS · {latestEntry.year}
                    {latestEntry.factors_used?.length > 0 &&
                      <span style={{ color: C.slate, marginLeft: 12 }}>
                        [{latestEntry.factors_used.join(' · ')}]
                      </span>
                    }
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    <FactorCard
                      label="INFLAÇÃO"
                      value={latestEntry.inflation}
                      unit="%"
                      isWarn={latestEntry.inflation != null && latestEntry.inflation > 10}
                      zoneColor={zone.color}
                    />
                    <FactorCard
                      label="CRESCIMENTO PIB"
                      value={latestEntry.gdp_growth}
                      unit="%"
                      isWarn={latestEntry.gdp_growth != null && latestEntry.gdp_growth < -2}
                      zoneColor={zone.color}
                    />
                    <FactorCard
                      label="DESEMPREGO"
                      value={latestEntry.unemployment}
                      unit="%"
                      isWarn={latestEntry.unemployment != null && latestEntry.unemployment > 15}
                      zoneColor={zone.color}
                    />
                    <FactorCard
                      label="DÍVIDA / PIB"
                      value={latestEntry.debt}
                      unit="%"
                      isWarn={latestEntry.debt != null && latestEntry.debt > 100}
                      zoneColor={zone.color}
                    />
                    <FactorCard
                      label="MORTES · CONFLITO"
                      value={latestEntry.conflict_deaths}
                      unit=""
                      isWarn={latestEntry.conflict_deaths != null && latestEntry.conflict_deaths > 0}
                      zoneColor={zone.color}
                    />
                  </div>

                  {/* Zone reference legend */}
                  <div style={{ marginTop: 24, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'CRISE',   range: '0–40',   color: C.crisis  },
                      { label: 'ATENÇÃO', range: '40–55',  color: C.warning },
                      { label: 'ESTÁVEL', range: '55–70',  color: C.stable  },
                      { label: 'ROBUSTA', range: '70–100', color: C.stable  },
                    ].map(({ label, range, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity: 0.8 }} />
                        <span style={{ fontSize: 10, fontFamily: MONO, color: C.textDim, letterSpacing: '0.1em' }}>{label}</span>
                        <span style={{ fontSize: 10, fontFamily: MONO, color: C.slate }}>{range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.slate, fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em',
              }}>
                SELECIONE UM PAÍS
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
