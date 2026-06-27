export function fmt(v, decimals = 1) {
  if (v == null) return '—'
  return typeof v === 'number' ? v.toFixed(decimals) : String(v)
}

export function fmtSigned(v, decimals = 1) {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`
}

export function fmtPct(v, decimals = 1) {
  if (v == null) return '—'
  return `${Math.abs(v).toFixed(decimals)}%`
}

export function fmtInt(v) {
  if (v == null) return '—'
  return Math.round(v).toLocaleString('pt-BR')
}
