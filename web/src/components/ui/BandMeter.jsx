export function BandMeter({ score = 50, showScale = true, style }) {
  const pct = Math.max(0, Math.min(100, score ?? 0))
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ height: 9, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: '40%', background: 'var(--ige-band-crise)' }} />
        <div style={{ width: '15%', background: 'var(--ige-band-atencao)' }} />
        <div style={{ width: '15%', background: 'var(--ige-band-estavel)' }} />
        <div style={{ width: '30%', background: 'var(--ige-band-robusta)' }} />
      </div>
      <div style={{ position: 'absolute', top: -5, left: `${pct}%`, transform: 'translateX(-50%)' }}>
        <div style={{
          width: 3, height: 19,
          background: 'var(--text-strong)',
          borderRadius: 2,
          boxShadow: '0 0 0 2px var(--surface-card)',
        }} />
      </div>
      {showScale && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-label)',
        }}>
          <span>0</span>
          <span>crise</span>
          <span>atenção</span>
          <span>estável</span>
          <span>robusta</span>
          <span>100</span>
        </div>
      )}
    </div>
  )
}
