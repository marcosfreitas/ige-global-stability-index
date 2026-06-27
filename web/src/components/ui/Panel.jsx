export function Panel({ children, style, padding = '24px 28px', ...rest }) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-panel)',
        padding,
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {children}
    </section>
  )
}

export function PanelHeader({ title, meta, right, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16,
      flexWrap: 'wrap', marginBottom: 18,
      ...style,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--text-strong)' }}>
          {title}
        </div>
        {meta && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-label)', marginTop: 3, letterSpacing: '0.5px' }}>
            {meta}
          </div>
        )}
      </div>
      {right}
    </div>
  )
}
