// Inline translations — no external i18n library.
// All visible UI copy for EN, ES, PT-BR.

export const TRANSLATIONS = {
  pt: {
    // App / loading
    title:    'Índice Global de Estabilidade',
    subtitle: 'ÍNDICE GLOBAL DE ESTABILIDADE',
    tagline:  '214 PAÍSES · 1962–PRESENTE',
    loading:  'CARREGANDO DATASET…',
    error:    'ERRO AO CARREGAR DADOS',

    // Zone / band labels
    zone_crise:   'Crise',
    zone_atencao: 'Atenção',
    zone_estavel: 'Estável',
    zone_robusta: 'Robusta',

    // TopBar
    region_ige:   'IGE REGIONAL',
    data_updated: 'ATUALIZADO',

    // Chart
    chart_title:          'Série Histórica',
    chart_no_data:        'SEM DADOS HISTÓRICOS',
    series_ige:           'IGE',
    series_nivel:         'Nível',
    series_momentum:      'Momentum',
    series_ige_desc:      'Índice composto: 60% Nível + 40% Momentum. Escala 0–100.',
    series_nivel_desc:    'Pontuação estrutural ponderada por pilar (econômico, segurança, governança). Reflete o estado atual.',
    series_momentum_desc: 'Velocidade de mudança do Nível nos últimos 2 anos. Indica se o país está melhorando ou piorando.',

    // Country list / search
    countries_label:    'RANKING · IGE',
    search_placeholder: 'buscar país...',
    no_results:         'NENHUM RESULTADO',
    results_one:        'RESULTADO',
    results_many:       'RESULTADOS',

    // Hero section
    index:    'Índice Global',
    nivel:    'Nível',
    momentum: 'Momentum',

    // Factors section
    factors_label:    'Fatores',
    inflation:        'Inflação',
    gdp:              'Crescimento PIB',
    unemployment:     'Desemprego',
    debt:             'Dívida / PIB',
    conflict:         'Mortes · Conflito',
    governance:       'Governança (CPI)',
    incomplete_data:  'DADOS INCOMPLETOS',
    missing_factors:  'Fatores ausentes',
    rebalanced:       'O IGE foi rebalanceado entre os pilares disponíveis.',

    // Region summary
    deaths:              'Mortes',
    in_conflict:         'Conflito',
    median_inflation:    'Inflação',
    median_gdp:          'PIB',
    median_unemployment: 'Desemprego',
    median_ige:          'IGE médio',
    countries_sorted:    'países · ordenado por IGE',
    in_crisis:           'EM CRISE',

    // Mobile tabs
    tab_detail:  'DETALHE',
    tab_ranking: 'RANKING',

    // Footer
    footer_disclaimer: 'O IGE mede estabilidade em relação ao histórico próprio de cada país — não é um ranking entre países. Pontuações refletem mudanças relativas dentro da história de cada nação.',
    footer_update:     'Dados atualizados toda segunda-feira às 06:00 UTC.',
    footer_source:     'Código-fonte',

    // Region names
    region_east_asia_pacific:        'Leste Asiático & Pacífico',
    region_europe_central_asia:      'Europa & Ásia Central',
    region_latin_america_caribbean:  'América Latina & Caribe',
    region_middle_east_north_africa: 'Oriente Médio & N. África',
    region_north_america:            'América do Norte',
    region_south_asia:               'Ásia do Sul',
    region_sub_saharan_africa:       'África Subsaariana',
    region_global:                   'Agregado Mundial',
    region_latam:                    'América Latina',
    region_europa:                   'Europa',
    region_norte:                    'América do Norte',
    region_africa:                   'África Subsaariana',
    region_mena:                     'Oriente Médio & N. África',
    region_asia:                     'Ásia',
  },

  en: {
    title:    'Global Stability Index',
    subtitle: 'GLOBAL STABILITY INDEX',
    tagline:  '214 COUNTRIES · 1962–PRESENT',
    loading:  'LOADING DATASET…',
    error:    'ERROR LOADING DATA',

    zone_crise:   'Crisis',
    zone_atencao: 'Watch',
    zone_estavel: 'Stable',
    zone_robusta: 'Robust',

    region_ige:   'REGIONAL IGE',
    data_updated: 'UPDATED',

    // Chart
    chart_title:          'Historical Series',
    chart_no_data:        'NO HISTORICAL DATA',
    series_ige:           'IGE',
    series_nivel:         'Level',
    series_momentum:      'Momentum',
    series_ige_desc:      'Composite score: 60% Level + 40% Momentum. Scale 0–100.',
    series_nivel_desc:    'Pillar-weighted structural score (economic, security, governance). Reflects current state.',
    series_momentum_desc: 'Rate of change in Level over the past 2 years. Shows whether the country is improving or deteriorating.',

    countries_label:    'RANKING · IGE',
    search_placeholder: 'Search country…',
    no_results:         'NO RESULTS',
    results_one:        'RESULT',
    results_many:       'RESULTS',

    index:    'Global Index',
    nivel:    'Level',
    momentum: 'Momentum',

    factors_label:    'Factors',
    inflation:        'Inflation',
    gdp:              'GDP Growth',
    unemployment:     'Unemployment',
    debt:             'Debt / GDP',
    conflict:         'Conflict Deaths',
    governance:       'Governance (CPI)',
    incomplete_data:  'INCOMPLETE DATA',
    missing_factors:  'Missing factors',
    rebalanced:       'IGE was rebalanced across available pillars.',

    deaths:              'Deaths',
    in_conflict:         'In conflict',
    median_inflation:    'Inflation',
    median_gdp:          'GDP',
    median_unemployment: 'Unemployment',
    median_ige:          'Avg IGE',
    countries_sorted:    'countries · sorted by IGE',
    in_crisis:           'IN CRISIS',

    tab_detail:  'DETAIL',
    tab_ranking: 'RANKING',

    // Footer
    footer_disclaimer: 'IGE measures stability relative to each country\'s own historical baseline — not as a cross-country ranking. Scores reflect relative changes within each country\'s history.',
    footer_update:     'Data refreshed every Monday at 06:00 UTC.',
    footer_source:     'Source code',

    region_east_asia_pacific:        'East Asia & Pacific',
    region_europe_central_asia:      'Europe & Central Asia',
    region_latin_america_caribbean:  'Latin America & Caribbean',
    region_middle_east_north_africa: 'Middle East & N. Africa',
    region_north_america:            'North America',
    region_south_asia:               'South Asia',
    region_sub_saharan_africa:       'Sub-Saharan Africa',
    region_global:                   'World Aggregate',
    region_latam:                    'Latin America',
    region_europa:                   'Europe',
    region_norte:                    'North America',
    region_africa:                   'Sub-Saharan Africa',
    region_mena:                     'Middle East & N. Africa',
    region_asia:                     'Asia',
  },

  es: {
    title:    'Índice Global de Estabilidad',
    subtitle: 'ÍNDICE GLOBAL DE ESTABILIDAD',
    tagline:  '214 PAÍSES · 1962–PRESENTE',
    loading:  'CARGANDO DATOS…',
    error:    'ERROR AL CARGAR DATOS',

    zone_crise:   'Crisis',
    zone_atencao: 'Alerta',
    zone_estavel: 'Estable',
    zone_robusta: 'Robusta',

    region_ige:   'IGE REGIONAL',
    data_updated: 'ACTUALIZADO',

    // Chart
    chart_title:          'Serie Histórica',
    chart_no_data:        'SIN DATOS HISTÓRICOS',
    series_ige:           'IGE',
    series_nivel:         'Nivel',
    series_momentum:      'Impulso',
    series_ige_desc:      'Puntuación compuesta: 60% Nivel + 40% Impulso. Escala 0–100.',
    series_nivel_desc:    'Puntuación estructural ponderada por pilar (económico, seguridad, gobernanza). Refleja el estado actual.',
    series_momentum_desc: 'Velocidad de cambio del Nivel en los últimos 2 años. Indica si el país mejora o empeora.',

    countries_label:    'RANKING · IGE',
    search_placeholder: 'buscar país...',
    no_results:         'SIN RESULTADOS',
    results_one:        'RESULTADO',
    results_many:       'RESULTADOS',

    index:    'Índice Global',
    nivel:    'Nivel',
    momentum: 'Impulso',

    factors_label:    'Factores',
    inflation:        'Inflación',
    gdp:              'Crecimiento PIB',
    unemployment:     'Desempleo',
    debt:             'Deuda / PIB',
    conflict:         'Muertes · Conflicto',
    governance:       'Gobernanza (CPI)',
    incomplete_data:  'DATOS INCOMPLETOS',
    missing_factors:  'Factores ausentes',
    rebalanced:       'El IGE fue rebalanceado entre los pilares disponibles.',

    deaths:              'Muertes',
    in_conflict:         'En conflicto',
    median_inflation:    'Inflación',
    median_gdp:          'PIB',
    median_unemployment: 'Desempleo',
    median_ige:          'IGE medio',
    countries_sorted:    'países · por IGE',
    in_crisis:           'EN CRISIS',

    tab_detail:  'DETALLE',
    tab_ranking: 'RANKING',

    // Footer
    footer_disclaimer: 'El IGE mide la estabilidad en relación al historial propio de cada país — no es un ranking entre países. Las puntuaciones reflejan cambios relativos dentro de la historia de cada nación.',
    footer_update:     'Datos actualizados cada lunes a las 06:00 UTC.',
    footer_source:     'Código fuente',

    region_east_asia_pacific:        'Asia Oriental y Pacífico',
    region_europe_central_asia:      'Europa y Asia Central',
    region_latin_america_caribbean:  'América Latina y el Caribe',
    region_middle_east_north_africa: 'Oriente Medio y N. África',
    region_north_america:            'América del Norte',
    region_south_asia:               'Asia del Sur',
    region_sub_saharan_africa:       'África Subsahariana',
    region_global:                   'Agregado Mundial',
    region_latam:                    'América Latina',
    region_europa:                   'Europa',
    region_norte:                    'América del Norte',
    region_africa:                   'África Subsahariana',
    region_mena:                     'Oriente Medio y N. África',
    region_asia:                     'Asia',
  },
}

/** Look up a translation key for the given language, falling back to pt then key itself. */
export function t(lang, key) {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.pt[key] ?? key
}

/** Translated region label. */
export function regionLabelI18n(lang, region) {
  if (!region) return '—'
  const key = `region_${region}`
  const hit = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.pt[key]
  if (hit) return hit
  return region.replace(/_/g, ' ')
}

/** Translated band label for a given band key (crise|atencao|estavel|robusta). */
export function bandLabelI18n(lang, bandKey) {
  return t(lang, `zone_${bandKey}`)
}
