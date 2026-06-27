import { Panel } from './ui/Panel.jsx'
import { BandTag } from './ui/BandTag.jsx'
import { BandMeter } from './ui/BandMeter.jsx'
import { MetricBlock } from './ui/MetricBlock.jsx'
import { bandColor, bandForScore } from '../lib/bands.js'
import { regionLabel, countryName } from '../lib/constants.js'
import { fmt } from '../lib/format.js'

export function HeroSection({ iso, entry, region, mobile = false, style }) {
  if (!entry) return null
  const score = entry.ige ?? 0
  const color = bandColor(score)
  const band = bandForScore(score)
  const name = countryName(iso)

  return (
    <Panel padding={mobile ? '20px' : '30px 32px'} style={style}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: mobile ? 28 : 42,
              margin: 0, letterSpacing: 1, lineHeight: 1,
              color: 'var(--text-strong)',
            }}>
              {iso}
            </h1>
            {!mobile && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-label)' }}>
                {regionLabel(region)} · {entry.year}
              </div>
            )}
          </div>
          <div style={{ fontSize: mobile ? 12 : 15, color: 'var(--text-body)', marginTop: mobile ? 5 : 6 }}>
            {name}
          </div>
          {mobile && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-label)', marginTop: 3, letterSpacing: '0.5px' }}>
              {regionLabel(region)} · {entry.year}
            </div>
          )}
        </div>
        <BandTag band={band} />
      </div>

      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: mobile ? 22 : 40, flexWrap: 'wrap', marginTop: mobile ? 14 : 24 }}>
        {/* Hero number — value above label to match design */}
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: mobile ? 62 : 92,
            lineHeight: 0.85,
            letterSpacing: '-1px',
            color,
          }}>
            {fmt(score)}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '1.5px', textTransform: 'uppercase',
            color: 'var(--text-label)', marginTop: 10,
          }}>
            Índice Global
          </div>
        </div>

        <div style={{ display: 'flex', gap: mobile ? 20 : 36, paddingBottom: mobile ? 6 : 8 }}>
          <MetricBlock label="Nível"    value={fmt(entry.nivel)}    size={mobile ? 'm' : 'l'} color="var(--ige-text-code)" />
          <MetricBlock label="Momentum" value={fmt(entry.momentum)} size={mobile ? 'm' : 'l'} color="var(--ige-amber)" />
        </div>
      </div>

      {/* Band meter */}
      <BandMeter score={score} style={{ marginTop: mobile ? 20 : 30, maxWidth: mobile ? '100%' : 680 }} />
    </Panel>
  )
}
