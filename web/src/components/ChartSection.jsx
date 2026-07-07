import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Panel, PanelHeader } from './ui/Panel.jsx'
import { CRISIS_EVENTS } from '../lib/constants.js'
import { useLang } from '../lib/LangContext.js'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const event = CRISIS_EVENTS[label]
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-tile)',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      color: 'var(--text-strong)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
    }}>
      <div style={{ color: 'var(--text-label)', marginBottom: 6, fontSize: 10, letterSpacing: '0.1em' }}>
        {label}
        {event && <span style={{ color: 'var(--ige-amber)' }}> · {event}</span>}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {String(p.name).toUpperCase()}: {p.value?.toFixed(1) ?? '—'}
        </div>
      ))}
    </div>
  )
}

function InfoTooltip({ description }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 13, height: 13, borderRadius: '50%',
        border: '1px solid var(--ige-border-2)',
        fontFamily: 'var(--font-mono)', fontSize: 8, lineHeight: 1,
        color: 'var(--text-label)',
        cursor: 'default',
        userSelect: 'none',
      }}>
        ?
      </span>
      {open && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 220,
          whiteSpace: 'normal',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-tile)',
          padding: '8px 10px',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-body)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 50,
          lineHeight: 1.5,
          pointerEvents: 'none',
        }}>
          {description}
        </span>
      )}
    </span>
  )
}

export function ChartSection({ timeSeries, mobile = false, style }) {
  const { t } = useLang()
  const [visible, setVisible] = useState({ ige: true, nivel: true, momentum: true })

  const SERIES = [
    { key: 'ige',      label: t('series_ige'),      desc: t('series_ige_desc'),      color: 'var(--ige-series-ige)',      width: 2.5, opacity: 1   },
    { key: 'nivel',    label: t('series_nivel'),    desc: t('series_nivel_desc'),    color: 'var(--ige-series-nivel)',    width: 1.5, opacity: 0.7 },
    { key: 'momentum', label: t('series_momentum'), desc: t('series_momentum_desc'), color: 'var(--ige-series-momentum)', width: 1.5, opacity: 0.5 },
  ]

  const toggle = key => setVisible(v => ({ ...v, [key]: !v[key] }))

  const yearRange = timeSeries.length
    ? `${timeSeries[0].year}–${timeSeries[timeSeries.length - 1].year}`
    : ''

  return (
    <Panel padding={mobile ? '18px' : '24px 28px'} style={style}>
      <PanelHeader
        title={t('chart_title')}
        meta={yearRange}
        right={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SERIES.map(s => (
              <div key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => toggle(s.key)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    border: '1px solid var(--ige-border-2)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '6px 12px',
                    opacity: visible[s.key] ? 1 : 0.4,
                    transition: 'opacity .15s',
                  }}
                >
                  <span style={{ width: 14, height: 3, borderRadius: 2, background: s.color }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: mobile ? 10 : 11, letterSpacing: '0.5px', color: 'var(--ige-text-code)' }}>
                    {s.label}
                  </span>
                </button>
                <InfoTooltip description={s.desc} />
              </div>
            ))}
          </div>
        }
      />

      {timeSeries.length > 0 ? (
        <div style={{ height: mobile ? 200 : 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--ige-border-1)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: 'var(--ige-text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--ige-border-1)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--ige-text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 40, 55, 70, 100]}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={40} stroke="var(--ige-band-crise)"   strokeDasharray="4 4" strokeOpacity={0.35} />
              <ReferenceLine y={55} stroke="var(--ige-band-atencao)" strokeDasharray="4 4" strokeOpacity={0.35} />
              <ReferenceLine y={70} stroke="var(--ige-band-estavel)" strokeDasharray="4 4" strokeOpacity={0.25} />
              <Line type="monotone" dataKey="nivel"    name={t('series_nivel')}    stroke="var(--ige-series-nivel)"    strokeWidth={1.5} dot={false} connectNulls strokeOpacity={visible.nivel    ? 0.7 : 0} />
              <Line type="monotone" dataKey="momentum" name={t('series_momentum')} stroke="var(--ige-series-momentum)" strokeWidth={1.5} dot={false} connectNulls strokeOpacity={visible.momentum ? 0.5 : 0} />
              <Line type="monotone" dataKey="ige"      name={t('series_ige')}      stroke="var(--ige-series-ige)"      strokeWidth={2.5} dot={false} connectNulls strokeOpacity={visible.ige     ? 1   : 0} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{
          height: mobile ? 200 : 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-label)', letterSpacing: 1,
        }}>
          {t('chart_no_data')}
        </div>
      )}
    </Panel>
  )
}
