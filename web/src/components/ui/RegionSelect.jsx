import * as Select from '@radix-ui/react-select'
import { useLang } from '../../lib/LangContext.js'

export function RegionSelect({ regions, value, onValueChange }) {
  const { regionLabel } = useLang()

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, minWidth: 200,
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
          color: 'var(--text-strong)',
          background: 'var(--surface-control)',
          border: '1px solid var(--border-control)',
          borderRadius: 'var(--radius-control)',
          padding: '11px 14px',
          cursor: 'pointer', outline: 'none',
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ige-accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-control)' }}
      >
        <Select.Value />
        <Select.Icon>
          <span style={{ color: 'var(--text-label)', fontSize: 11 }}>▼</span>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-tile)',
            padding: '6px 0',
            zIndex: 100,
            minWidth: 'var(--radix-select-trigger-width)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          }}
        >
          <Select.Viewport>
            {regions.map(r => (
              <Select.Item
                key={r}
                value={r}
                style={{
                  padding: '10px 16px',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--text-strong)',
                  cursor: 'pointer', outline: 'none',
                  display: 'flex', alignItems: 'center',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(95,208,200,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <Select.ItemText>{regionLabel(r)}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
