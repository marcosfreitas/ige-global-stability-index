export function SearchInput({ value, onChange, placeholder = 'buscar país...', style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--ige-text-faint)', fontSize: 13, pointerEvents: 'none',
      }}>
        ⌕
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'var(--surface-control)',
          border: '1px solid var(--border-control)',
          borderRadius: 'var(--radius-tile)',
          padding: '11px 14px 11px 34px',
          color: 'var(--text-strong)',
          fontFamily: 'var(--font-body)', fontSize: 13,
          outline: 'none',
          transition: 'border-color .15s',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--ige-accent)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-control)' }}
      />
    </div>
  )
}
