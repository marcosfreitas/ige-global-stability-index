import * as ScrollArea from '@radix-ui/react-scroll-area'
import { Panel } from './ui/Panel.jsx'
import { SearchInput } from './ui/SearchInput.jsx'
import { CountryRow } from './ui/CountryRow.jsx'

export function CountryList({ countries, selectedIso, onSelect, search, onSearch, style }) {
  return (
    <Panel padding="18px" style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <SearchInput
        value={search}
        onChange={e => onSearch(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4px 10px',
        borderBottom: '1px solid var(--ige-divider)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--text-label)' }}>
          RANKING · IGE
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-label)' }}>
          {countries.length}
        </span>
      </div>

      <ScrollArea.Root style={{ overflow: 'hidden', marginTop: 4 }}>
        <ScrollArea.Viewport style={{ maxHeight: 560 }}>
          <div style={{ paddingBottom: 8 }}>
            {countries.map(({ iso, ige }) => (
              <CountryRow
                key={iso}
                iso={iso}
                ige={ige}
                selected={iso === selectedIso}
                onSelect={() => onSelect(iso)}
              />
            ))}
            {countries.length === 0 && (
              <div style={{
                padding: '24px 10px',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-label)', textAlign: 'center', letterSpacing: 1,
              }}>
                NENHUM RESULTADO
              </div>
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          style={{ display: 'flex', padding: '2px 0', width: 6 }}
        >
          <ScrollArea.Thumb
            style={{ background: 'var(--ige-border-2)', borderRadius: 3, flex: 1 }}
          />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </Panel>
  )
}
