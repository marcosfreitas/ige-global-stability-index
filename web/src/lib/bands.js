export const BANDS = [
  { key: 'crise',   label: 'Crise',   range: '0–40',   color: 'var(--ige-band-crise)',   lo: 0,  hi: 40  },
  { key: 'atencao', label: 'Atenção', range: '40–55',  color: 'var(--ige-band-atencao)', lo: 40, hi: 55  },
  { key: 'estavel', label: 'Estável', range: '55–70',  color: 'var(--ige-band-estavel)', lo: 55, hi: 70  },
  { key: 'robusta', label: 'Robusta', range: '70–100', color: 'var(--ige-band-robusta)', lo: 70, hi: 101 },
]

export const BAND_COLORS = {
  crise:   'var(--ige-band-crise)',
  atencao: 'var(--ige-band-atencao)',
  estavel: 'var(--ige-band-estavel)',
  robusta: 'var(--ige-band-robusta)',
}

export function bandForScore(score) {
  if (score == null) return 'atencao'
  if (score < 40) return 'crise'
  if (score < 55) return 'atencao'
  if (score < 70) return 'estavel'
  return 'robusta'
}

export function bandColor(score) {
  return BAND_COLORS[bandForScore(score)]
}

export function bandLabel(score) {
  return BANDS.find(b => b.key === bandForScore(score))?.label ?? '—'
}
