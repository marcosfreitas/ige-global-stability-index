const SIZES = { hero: '92px', 'hero-sm': '62px', xl: '42px', l: '34px', m: '30px', s: '19px' }

export function MetricBlock({ label, value, size = 'l', color, caption, style }) {
  const fs = SIZES[size] || SIZES.l
  const isHero = size === 'hero' || size === 'hero-sm'
  return (
    <div style={style}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: size === 's' ? 10 : 11,
        letterSpacing: isHero ? '1.5px' : '1px',
        textTransform: 'uppercase',
        color: 'var(--text-label)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: isHero ? 700 : 600,
        fontSize: fs,
        lineHeight: isHero ? 0.85 : 1.1,
        letterSpacing: isHero ? '-1px' : 0,
        marginTop: isHero ? 0 : 4,
        color: color || 'var(--text-strong)',
      }}>
        {value}
      </div>
      {caption && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          color: 'var(--text-label)', marginTop: 10,
        }}>
          {caption}
        </div>
      )}
    </div>
  )
}
