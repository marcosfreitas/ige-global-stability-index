export function FactorCard({ label, value, highlight = false, style }) {
  const missing = value === '—' || value == null
  return (
    <div style={{
      background: 'var(--surface-tile)',
      border: `1px solid ${highlight ? 'rgba(216,168,75,0.4)' : 'var(--ige-border-inset)'}`,
      borderRadius: 'var(--radius-tile)',
      padding: 18,
      boxSizing: 'border-box',
      ...style,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.5px', textTransform: 'uppercase',
        color: '#7a8694', lineHeight: 1.4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30,
        marginTop: 10,
        color: missing
          ? 'var(--ige-text-faint)'
          : highlight
            ? 'var(--ige-amber)'
            : 'var(--text-strong)',
      }}>
        {value ?? '—'}
      </div>
    </div>
  )
}
