# IGE — Auditoria de Suficiência das Fontes

Medição da cobertura real entregue pelas fontes atuais, sobre `data/ige-dataset-real.json`
(vintage `2026-07-27`, 11.670 registros país-ano, 214 países).

**Veredito: as fontes atuais não são suficientes para sustentar a metodologia declarada.**
A estrutura de três pilares 40/30/30 existe de fato em 11,3% dos registros. O restante é
publicado na mesma escala, com os mesmos rótulos de banda.

---

## 1. A metodologia declarada não é a que roda

Peso nominal vs. peso efetivo médio (após a redistribuição proporcional por pilar ausente),
e peso que de fato carrega informação:

| Pilar | Nominal | Efetivo | Informativo |
|---|---|---|---|
| Economic | 40% | **71,8%** | 71,8% |
| Security | 30% | 22,2% | **12,6%** |
| Governance | 30% | **6,0%** | 6,0% |
| **Total** | 100% | 100% | **90,4%** |

O IGE é, na prática, um índice econômico com um tempero de conflito. O pilar Governance —
declarado como 30% — contribui com 6%.

A coluna "informativo" desconta os **76 países cuja série de conflito é constante** (todo zero),
onde `sigma == 0 → z = 0.0` e o pilar Security vira a constante 50 em todo ano. Somados aos 36
países sem pilar Security algum, **52% dos países têm 30% do peso preenchido com nada**.

## 2. Cobertura por fator

| Fator | Preenchido | 1960s | 1980s | 1990s | 2000s | 2010s | 2020s |
|---|---|---|---|---|---|---|---|
| GDP growth | 95% | 96% | 98% | 95% | 96% | 98% | 83% |
| Inflação | 77% | 69% | 72% | 74% | 83% | 88% | 72% |
| Desemprego | 56% | **0%** | **0%** | 82% | 89% | 87% | 76% |
| Dívida/PIB | 54% | **0%** | 9% | 55% | 87% | 89% | 91% |
| Mortes conflito | 57% | **0%** | 9% | 86% | 85% | 83% | 85% |
| Governança (CPI) | **20%** | **0%** | **0%** | **0%** | **0%** | 65% | 61% |

Células vazias por era:

| Fator | Vazias pré-1990 | Vazias 1990+ |
|---|---|---|
| Desemprego | 3.969 (**100%**) | 1.213 (16%) |
| Dívida | 3.820 (**96%**) | 1.561 (20%) |
| Conflito | 3.821 (**96%**) | 1.165 (15%) |
| Governança | 3.969 (**100%**) | 5.415 (**70%**) |

**Antes de 1990 o IGE é um índice de PIB + inflação**, com dois dos três pilares ausentes e
o pilar econômico rodando com metade dos seus fatores. Isso cobre 3.969 registros — 34% do dataset.

## 3. Os três pilares só coexistem entre 2012 e 2024

| Ano | Países | 6/6 fatores | 3 pilares presentes |
|---|---|---|---|
| 1990 | 176 | 0 (0%) | 0 (**0%**) |
| 2000 | 207 | 0 (0%) | 0 (**0%**) |
| 2010 | 212 | 0 (0%) | 0 (**0%**) |
| 2015 | 214 | 152 (71%) | 162 (76%) |
| 2020 | 214 | 153 (71%) | 171 (80%) |
| 2024 | 210 | 149 (71%) | 171 (81%) |
| 2025 | 205 | 0 (0%) | 0 (**0%**) |
| 2026 | 183 | 0 (0%) | 0 (**0%**) |

Fora da janela 2012–2024, **nenhum** registro tem os três pilares. O 2025/2026 zerado é o efeito
do CPI ainda não publicado, já documentado no achado #2 da revisão de lógica.

## 4. O subconjunto defensável

Registros com os três pilares presentes **e** série de conflito informativa:

> **1.321 de 11.670 registros — 11,3% — cobrindo 2012–2024 e 102 países.**

Esse é o índice que a metodologia descreve. Os outros 88,7% são publicados com a mesma escala
0–100, os mesmos rótulos `Crise`/`Estável`/`Robusta` e a mesma cor, sem distinção visual além
do campo `data_quality`, que a UI usa apenas como aviso amarelo.

## 5. Séries utilizáveis por país

Contando países com ≥13 observações (limiar em que o clamp de ±3σ passa a ser alcançável —
ver achado #8 da revisão de lógica):

| Fator | Algum dado | Série utilizável (≥13 obs) |
|---|---|---|
| GDP growth | 212/214 | 210/214 |
| Dívida | 192/214 | 191/214 |
| Desemprego | 186/214 | 186/214 |
| Inflação | 192/214 | 185/214 |
| Conflito | 178/214 | 178/214 |
| Governança | 180/214 | **164/214** |

A cobertura por país é razoável onde a série existe. O problema não é o número de países —
é a profundidade histórica e a ausência de pilares inteiros.

---

## 6. Os buracos são fecháveis

Nenhuma das lacunas acima é estrutural no sentido de "o dado não existe". Existem fontes
públicas, gratuitas e programaticamente acessíveis para todas elas. Em ordem de alavancagem:

> **Não verificado neste ambiente.** A política de rede bloqueia todo acesso externo
> (`api.worldbank.org`, `ourworldindata.org`, `ucdp.uu.se`, `ilostat.ilo.org`,
> `dataunodc.un.org`, `ghdx.healthdata.org` — todos retornam 403 no CONNECT). Cobertura,
> URLs e nomes de coluna abaixo vêm de conhecimento prévio e **precisam ser medidos** antes
> de qualquer decisão de peso. Ver `docs/handoff-source-validation.md`.

| # | Lacuna | Fonte candidata | Ganho esperado |
|---|---|---|---|
| 1 | Governança 1962–2011 (6% → 30%) | **V-Dem** (Varieties of Democracy) | Cobertura de ~1789 até hoje, ~200 países. Fecha a maior lacuna do índice sozinho. |
| 2 | Governança, robustez | **World Bank WGI** (1996+, 6 dimensões) | Complementa V-Dem; Control of Corruption é o análogo direto do CPI |
| 3 | Violência não-estatal (52% dos países) | **UNODC homicídios** / WB `VC.IHR.PSRC.P5` | Dá conteúdo ao pilar Security em BRA, MEX, ZAF, Caribe, Centro-América |
| 4 | Violência unilateral | **UCDP one-sided + non-state** | Corrige Ruanda 1994 (hoje 1.882 mortes); mesmos GW country IDs já mapeados |
| 5 | Conflito pré-1989 (96% vazio) | **PRIO Battle Deaths Dataset** (1946–2008) | Cobre Coreia, Vietnã, conflitos africanos dos anos 60–80 |
| 6 | Dívida pré-1990 (96% vazio) | **IMF Historical Public Debt Database** | Série longa, ~180 países; melhor que Reinhart-Rogoff pela cobertura |
| 7 | Desemprego pré-1991 (100% vazio) | **ILOSTAT bulk** | Parcial — só ~40–60 países desenvolvidos. Lacuna genuinamente estrutural para o resto |

A lacuna #7 é a única sem solução completa: desemprego comparável simplesmente não foi medido
na maior parte do mundo antes de 1991. A resposta correta ali é reduzir o escopo temporal do
pilar econômico ou remover o fator, não preencher com estimativa.

## 7. Recomendação

1. **Medir antes de mexer.** Baixar cada fonte candidata, computar cobertura país×ano, e só
   então decidir estrutura e pesos. O procedimento está em `docs/handoff-source-validation.md`.
2. **V-Dem é a maior alavanca isolada** — leva Governance de 6% efetivos para perto dos 30%
   nominais em toda a série histórica, e é padrão-ouro acadêmico (relevante para o roadmap
   de citabilidade).
3. **Separar o pilar Security em dois fatores** — conflito armado e violência letal comum —
   em vez de somar numa série só. Somar repetiria o erro definicional da dívida (achado #7 da
   revisão de lógica).
4. **Não publicar o que não sustenta a metodologia.** Enquanto a cobertura não subir, marcar
   explicitamente os 88,7% de registros que não têm os três pilares, em vez de servi-los na
   mesma escala.
