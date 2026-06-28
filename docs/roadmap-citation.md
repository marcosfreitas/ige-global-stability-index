# Roadmap — IGE como Índice Citável

Objetivo: tornar o IGE citável em papers acadêmicos, reportagens e relatórios institucionais,
à semelhança do Fragile States Index (Fund for Peace), Global Peace Index (IEP) e HDI (PNUD).

O IGE já tem a base técnica. O que falta é o invólucro institucional.

---

## Diferencial competitivo

Nenhum índice de estabilidade global usa expanding z-score within-country:

> *"The only open-source stability index that measures each country against its own history —
> making it valid for comparing Brazil 1990 to Brazil 2024, not Brazil to Denmark."*

FSI, GPI e HDI são todos cross-sectional (país vs. outros países no mesmo ano).
O IGE responde a uma pergunta diferente: **como este país está em relação à sua própria trajetória histórica?**
Esse é o nicho e deve ser o claim central em todo material de divulgação.

---

## Fase 1 — Infraestrutura de citação (sem custo, ~1 semana)

### 1.1 CITATION.cff
Criar `/CITATION.cff` no root do repo. GitHub exibe botão "Cite this repository" automaticamente.

```yaml
cff-version: 1.2.0
message: "If you use this dataset, please cite it as below."
authors:
  - family-names: Freitas
    given-names: Marcos
    orcid: "https://orcid.org/XXXX-XXXX-XXXX-XXXX"
title: "IGE — Índice Global de Estabilidade"
version: 1.0.0
date-released: 2026-06-28
url: "https://github.com/marcosfreitas/ige-global-stability-index"
```

### 1.2 Zenodo DOI
- Conectar o repo ao [Zenodo](https://zenodo.org) via GitHub integration
- Cada GitHub Release gera automaticamente um DOI permanente
- Formato de citação: `Freitas, M. (2026). IGE — Índice Global de Estabilidade (v1.0.0). Zenodo. https://doi.org/10.5281/zenodo.XXXXXXX`

### 1.3 GitHub Release v1.0.0
- Tag `v1.0.0` com changelog descrevendo: fontes, metodologia, cobertura (215 países, 1962–2025)
- Incluir `data/ige-dataset-real.json` como asset do release
- Semver daqui em diante: minor bump = nova fonte de dados, patch = correção de bug

### 1.4 ORCID
- Criar ORCID gratuito em orcid.org (identificador permanente de pesquisador)
- Linkar ao CITATION.cff e ao preprint

---

## Fase 2 — Preprint acadêmico (~2–4 semanas de redação)

### Plataforma recomendada
**SSRN Economics** (gratuito, indexado pelo Google Scholar) ou **OSF Preprints**.

### Estrutura do paper (8–12 páginas)
1. **Abstract** — o que é o IGE, por que expanding z-score, cobertura
2. **Motivação** — limitações dos índices existentes (cross-sectional, não histórico)
3. **Metodologia** — expanding z-score, 3 pilares, pesos, fontes
4. **Casos ilustrativos** — Brasil 1990 (hiperinflação), Ruanda 1994, Ucrânia 2022, Alemanha 1989
5. **Validação** — FSI comparison (por que r≈0 é esperado), Monte Carlo sensitivity
6. **Limitações** — cobertura pré-1991, governança pré-2012, escala relativa
7. **Conclusão** — uso apropriado vs. uso inapropriado do índice
8. **Referências** — UCDP, World Bank, TI, IMF

### Claim de diferenciação no abstract
> "Unlike existing fragility indices that rank countries relative to each other at a point in time,
> the IGE applies expanding z-score normalization within each country's own historical series,
> enabling meaningful longitudinal comparison within countries while remaining agnostic about
> cross-country absolute rankings."

---

## Fase 3 — Distribuição e visibilidade

### Our World in Data
- OWID aceita datasets externos via formulário de contribuição
- Requisitos: CSV limpo, metodologia documentada, fontes públicas verificáveis
- IGE atende todos. Submissão em: https://ourworldindata.org/about/owid-data

### Wikipedia
- Criar artigo "Global Stability Index" (em inglês) linkando o Zenodo DOI e o preprint
- Seção em "List of country indices" existente na Wikipedia inglesa

### Press kit para jornalistas
Criar `/docs/press-kit.md` com:
- 10 casos históricos mais dramáticos (com URLs diretas ao dashboard, ex: `?country=BRA&region=latin_america_caribbean`)
- Gráficos estáticos exportáveis dos casos
- Explicação de 3 parágrafos sem jargão técnico
- Contato para entrevistas

### Divulgação mensal
- Thread no X/LinkedIn: "Country of the Month" com trajetória histórica
- URL compartilhável já funciona (ex: `?country=UKR&region=europe_central_asia&lang=en`)
- Hashtags: #dataviz #geopolitics #macroeconomics #opendata

---

## Métricas de sucesso

| Marco | Indicador |
|-------|-----------|
| Citabilidade | DOI Zenodo ativo + CITATION.cff no repo |
| Descoberta | Aparece no Google Scholar ao buscar "country stability index" |
| Alcance | OWID submission aceita ou em revisão |
| Credibilidade | Preprint publicado com DOI |
| Impacto | Primeira citação externa em paper ou reportagem |

---

## Cronograma sugerido

| Semana | Ação |
|--------|------|
| 1 | CITATION.cff + ORCID + Zenodo integration + GitHub Release v1.0.0 |
| 2–3 | Redigir preprint (metodologia + casos + validação) |
| 4 | Submeter SSRN + formulário OWID |
| 5+ | Press kit + divulgação mensal |
