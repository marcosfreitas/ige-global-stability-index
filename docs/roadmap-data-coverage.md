# Roadmap — Estabilização de Cobertura de Dados Históricos

Objetivo: garantir que todos os fatores do IGE existam para os períodos anteriores relevantes,
eliminando lacunas que forçam redistribuição de pesos e reduzem a confiabilidade histórica do índice.

Estado atual: ver `docs/validation/fsi-correlation.md` e o gap analysis da sessão de desenvolvimento.

---

## Mapa de lacunas por fator

| Fator | Cobertura atual | Lacuna principal | Null rate |
|-------|----------------|-----------------|-----------|
| GDP growth | 1962–2025 | Micro-estados, anos 60 | ~16% |
| Inflação | 1962–2025 | China pré-2000, micro-estados | ~32% |
| Desemprego | ~1991–2024 | **100% null pré-1991** | ~50% |
| Dívida/PIB | ~1990–2025 | **100% null pré-1990**, 27 países sem dado algum | ~45% |
| Mortes conflito | 1989–2024 | **100% null pré-1989** (por design UCDP) | ~47% |
| Governança (CPI) | 2012–2024 | **100% null pré-2012** | ~40% (do total) |

---

## Lacuna 1 — Desemprego pré-1991 (ALTA PRIORIDADE)

**Problema:** ILO modelled estimates só existem a partir de ~1991. Toda a década de 1980 e anteriores
têm 100% de null para desemprego em todos os países.

**Fonte alternativa: ILO ILOSTAT Bulk Download**
- URL: https://ilostat.ilo.org/data/bulk/
- Dataset: `UNE_TUNE_SEX_AGE_NB_A` (Unemployment by sex and age, annual)
- Cobertura histórica: algumas séries chegam a 1970 para países desenvolvidos (EUA, Alemanha, Reino Unido, França, Japão)
- Formato: CSV, sem API key

**Implementação:**
```python
# ingest/fetch_sources.py — nova função
def fetch_ilostat_unemployment():
    url = "https://ilostat.ilo.org/bulk-download/UNE_TUNE_SEX_AGE_NB_A_EN.csv.gz"
    # Filtrar: SEX=TOT, AGE=AGE_YTHADULT_YGE15, MEASURE=UNE_TUNE
    # Resultado: country (ISO-2, converter para ISO-3), year, value (%)
```

**Ganho esperado:** recuperar ~1.700 linhas pré-1991 para 40–60 países desenvolvidos.
Não resolve países em desenvolvimento (dados simplesmente não existem antes de 1991).

---

## Lacuna 2 — Dívida pública pré-1990 (MÉDIA PRIORIDADE)

**Problema:** World Bank + IMF WEO têm cobertura praticamente zero antes de 1990.
27 países não têm nenhuma linha de dívida em nenhuma fonte.

**Fonte alternativa 1: Reinhart-Rogoff Historical Public Debt Database**
- Harvard/IMF dataset com dívida histórica para ~70 países desde 1800
- Disponível em: https://www.imf.org/external/pubs/ft/wp/2010/data/wp10245.zip
- Cobertura: 1800–2009, foco em países com histórico de crise de dívida

**Fonte alternativa 2: Bank for International Settlements (BIS)**
- Dataset de dívida do setor público: https://www.bis.org/statistics/totcredit.htm
- Cobertura: 1940–presente para países do G20 e além

**Implementação:**
```python
def fetch_reinhart_rogoff_debt():
    # IMF working paper data — Excel com múltiplas abas por país
    # Padronizar para (iso3, year, debt_pct_gdp)
    # Usar como fallback de terceira ordem: WB → IMF WEO → Reinhart-Rogoff
```

**Ganho esperado:** preencher dívida para 1960–1989 nos principais países desenvolvidos e
em alguns países em desenvolvimento com histórico de crise (Argentina, Brasil, México, Turquia).

---

## Lacuna 3 — Mortes em conflito pré-1989 (BAIXA PRIORIDADE — estrutural)

**Problema:** UCDP/PRIO Battle-Related Deaths Dataset começa em 1989 por design metodológico.
Conflitos anteriores (Guerra da Coreia, Vietnã, conflitos africanos dos anos 60–80) existem
mas estão em datasets diferentes.

**Fonte alternativa: COW (Correlates of War) — MID e War datasets**
- Militarized Interstate Disputes e Inter-State War datasets
- Cobertura: 1816–presente
- URL: https://correlatesofwar.org/data-sets/
- Formato: CSV com variável de baixas (battle deaths) por conflito-ano

**Fonte alternativa 2: PRIO Battle Deaths Dataset v3.1**
- Versão estendida que cobre 1946–2008
- URL: https://www.prio.org/data/1/

**Consideração metodológica:** estender o fator de conflito pré-1989 introduz heterogeneidade
de fonte — os dados COW e UCDP usam definições diferentes de "battle death". Qualquer extensão
deve ser documentada com nota de quebra de série (`source_break: UCDP→COW` no JSON).

**Recomendação:** implementar apenas se houver demanda específica por análise dos anos 60–80.
O custo metodológico (heterogeneidade de fonte) pode superar o benefício.

---

## Lacuna 4 — Governança pré-2012 (ALTA PRIORIDADE)

**Problema:** TI CPI via OWID cobre apenas 2012–2024. Antes de 2012 o CPI usava escala 0–10
(não 0–100), e a cobertura era menor (~100 países). Para 1996–2011 existe o World Bank WGI.

**Fonte: World Bank WGI (Worldwide Governance Indicators)**
- 6 dimensões de governança: Voice & Accountability, Political Stability, Government Effectiveness,
  Rule of Law, Regulatory Quality, Control of Corruption
- Cobertura: 1996–2023, ~215 países
- API: `https://api.worldbank.org/v2/country/all/indicator/WGI.RQ.EST` (etc.)
- Problema identificado anteriormente: API retornou valores em escala ~1400 — provavelmente
  busca pelo indicador composto em vez do indicador individual normalizado

**Implementação correta:**
```python
# Indicador correto: CC.EST (Control of Corruption Estimate) — escala −2.5 a +2.5
# Converter para 0–100: score = (CC.EST + 2.5) / 5.0 * 100
WGI_INDICATOR = "CC.EST"  # não "WGI.CC.EST" que é o percentil rank
```

**Bridge 1996–2011:** usar WGI Control of Corruption convertido para 0–100.
**2012–2024:** usar TI CPI (como hoje).
**Calibrar** que as duas séries sejam comparáveis com um período de sobreposição (2012–2023
têm ambas) — calcular offset médio e ajustar WGI para minimizar quebra de série.

**Ganho esperado:** preencher governança para 1996–2011 (~215 países), reduzindo o null rate
de governança de ~40% para ~25%.

---

## Lacuna 5 — Inflação e PIB para países pequenos e China

**China (CHN):** inflação 39.7% null no World Bank. Causa: WB reporta CPI da China de forma
irregular. Fonte alternativa: IMF IFS (International Financial Statistics) — `https://data.imf.org/`.
China tem série de inflação contínua de 1980 no IMF IFS.

**Micro-estados (BMU, GRL, ASM, etc.):** estruturalmente sem dados — não são membros do FMI
nem reportam ao World Bank. Não há fonte alternativa viable. Documentar como limitação permanente.

**Países isolados (PRK, CUB):** North Korea e Cuba têm dados extremamente escassos por razões
políticas. O CIA World Factbook publica estimativas anuais mas não em formato programático.

---

## Plano de implementação sugerido

### Sprint 1 — Alto impacto, baixo risco (1–2 semanas)
1. **WB WGI 1996–2011** com conversão de escala correta (`CC.EST` → 0–100)
   - Merge com TI CPI usando período de sobreposição 2012–2023 para calibração
   - Resultado: governança disponível de 1996 a 2024 para ~215 países

### Sprint 2 — Médio impacto (1 semana)
2. **ILO ILOSTAT bulk** para desemprego pré-1991
   - Recupera 40–60 países desenvolvidos para anos 70–80
   - Não resolve mundo em desenvolvimento (aceitar como limitação)

### Sprint 3 — Menor impacto (2 semanas)
3. **Reinhart-Rogoff debt** para pré-1990
   - ~70 países, foco em países com histórico de crise
   - Usar como fallback de terceira ordem

4. **IMF IFS inflação para CHN** e outros países com gaps pontuais

### Não implementar agora
- Conflito pré-1989 via COW: heterogeneidade metodológica, baixo retorno
- Micro-estados: ausência de dados é estrutural, não resolvível

---

## Critério de aceitação para cada nova fonte

Antes de integrar qualquer fonte nova:
1. Verificar que o período de sobreposição com a fonte atual tem correlação > 0.85
2. Documentar quebra de série no `meta.sources` do JSON com datas exatas
3. Rodar `ingest/test_compute.py` — todos os casos de sanity check devem passar
4. Rodar Monte Carlo sensitivity — nenhum país estável deve tornar-se volátil (rank std ≤ 1.3 → ≤ 1.3)

---

## Estado dos dados após implementação completa (estimativa)

| Fator | Null rate atual | Null rate esperado após sprints |
|-------|----------------|-------------------------------|
| GDP growth | 16% | 14% (ganho marginal) |
| Inflação | 32% | 28% (CHN + alguns países) |
| Desemprego | 50% | 38% (ILO pré-1991 para OCDE) |
| Dívida/PIB | 45% | 33% (Reinhart-Rogoff) |
| Mortes conflito | 47% | 47% (sem mudança — estrutural) |
| Governança | 40% | 25% (WGI 1996–2011) |
