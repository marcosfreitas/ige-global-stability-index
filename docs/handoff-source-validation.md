# Handoff — Validação de Fontes Candidatas (agente com acesso à rede)

Este documento é um prompt pronto para ser entregue a um agente rodando em máquina com acesso
externo irrestrito. O ambiente onde a auditoria foi feita bloqueia todo tráfego de saída, então
a etapa de medição das fontes candidatas não pôde ser executada lá.

Contexto de referência: `docs/validation/source-coverage-audit.md` e
`docs/validation/index-logic-review.md`.

---

## Prompt

```
Você está no repositório ige-global-stability-index. Leia primeiro estes três arquivos, que
contêm o diagnóstico já feito e as decisões que NÃO devem ser refeitas:

  - docs/validation/source-coverage-audit.md   (cobertura real das fontes atuais)
  - docs/validation/index-logic-review.md      (11 falhas na lógica do índice)
  - ingest/fetch_sources.py                    (padrão de fetch existente)

CONTEXTO
O IGE declara três pilares com pesos 40/30/30 (Economic/Security/Governance). Medido sobre o
dataset publicado, o peso efetivo real é Economic 71,8% / Security 22,2% / Governance 6,0%,
e apenas 11,3% dos registros (2012-2024, 102 países) têm os três pilares presentes. A causa é
cobertura de fonte, não erro de código.

SUA TAREFA
Medir a cobertura real de cada fonte candidata abaixo e reportar números. NÃO altere a
metodologia do índice, NÃO mexa em compute_ige.py, e NÃO decida pesos nesta etapa. O objetivo
é produzir a evidência que permite decidir depois.

FONTES A VALIDAR, em ordem de prioridade

1. V-Dem (Varieties of Democracy) — maior alavanca isolada
   Objetivo: substituir/estender o pilar Governance, hoje limitado a TI CPI 2012-2024.
   Verificar: URL de download estável do dataset country-year (CSV), licença, cobertura
   ano x país, e quais índices agregados existem (v2x_polyarchy, v2x_libdem, v2x_corr,
   v2x_rule, v2xnp_client). Confirmar se a série vai mesmo de ~1789 até o ano corrente e
   quantos países tem por década.

2. UNODC homicídios intencionais por 100k
   Caminho A: indicador World Bank WDI VC.IHR.PSRC.P5 (fonte UNODC) — encaixa direto na
   função fetch_wb_indicator() que já existe no repo.
   Caminho B: portal dataunodc.un.org direto (mais completo, mais trabalho).
   Verificar ambos e comparar cobertura. Objetivo: dar conteúdo ao pilar Security nos 76
   países cuja série de conflito é constante zero (BRA, HND, JAM, ARG, CRI e outros).

3. UCDP one-sided violence + non-state conflict
   O pipeline hoje usa só o state-based (sb_total_deaths_best), por isso Ruanda 1994 aparece
   com 1.882 mortes e México 2019 com 0. Verificar se os datasets one-sided e non-state usam
   os mesmos GW country IDs (a função gwno_to_iso3() já existe em fetch_sources.py) e qual a
   cobertura ano x país de cada um.

4. PRIO Battle Deaths Dataset (1946-2008)
   Preenche o conflito pré-1989, hoje 96% vazio. Verificar cobertura e se a definição de
   battle deaths é compatível com a série UCDP atual (se não for, tem que virar fator
   separado, não emenda).

5. IMF Historical Public Debt Database
   Preenche dívida pré-1990, hoje 96% vazia. ATENÇÃO: o pipeline já mistura duas definições
   incompatíveis de dívida (World Bank GC.DOD.TOTL.GD.ZS = governo central; IMF WEO
   GGXWDG_NGDP = governo geral) via combine_first, o que produziu 249 saltos ano-a-ano
   maiores que 25pp do PIB. Verificar qual definição o HPDD usa e reportar — não emendar
   uma terceira definição na mesma coluna.

6. ILOSTAT bulk (desemprego pré-1991)
   Hoje 100% vazio antes de 1991. Espera-se ganho parcial, só para países desenvolvidos.
   Verificar até que ano cada país realmente tem série, e quantos países ganham dado.

7. World Bank WGI (1996+, 6 dimensões)
   Complemento ao V-Dem para governança. Control of Corruption é o análogo direto do CPI.

PROCEDIMENTO PARA CADA FONTE
  a) Baixar para ingest/raw/candidates/<nome>/ (não sobrescrever ingest/raw/)
  b) Normalizar para (iso3, year, value) usando os mesmos padrões de fetch_sources.py
  c) Computar e reportar:
       - intervalo de anos real (primeiro e último ano com dado não-nulo)
       - número de países distintos com pelo menos 1 observação
       - número de países com >= 13 observações (limiar em que o clamp de +-3 sigma passa
         a ser alcançável — ver achado #8 da revisão de lógica)
       - % de células preenchidas por década
       - sobreposição com a cobertura atual: quantos dos 11.670 registros país-ano do
         dataset existente essa fonte preencheria e que hoje estão vazios
  d) Anotar licença e termos de redistribuição (relevante para o roadmap de citabilidade
     em docs/roadmap-citation.md — Zenodo DOI e submissão à OWID exigem isso)
  e) Registrar a URL exata, o formato e se há API key ou rate limit

ENTREGÁVEL
Um arquivo docs/validation/candidate-sources-coverage.md com uma tabela por fonte contendo
as métricas de (c), mais uma seção final "recomendação de adoção" dizendo, para cada fonte:
adotar / adotar com ressalva / descartar, e por quê. Se uma fonte não estiver acessível ou
tiver mudado de URL, diga isso explicitamente em vez de estimar cobertura.

REGRAS
  - Não altere compute_ige.py, os pesos, nem data/. Esta etapa é só medição.
  - Não invente números de cobertura. Se não conseguiu baixar, reporte o erro.
  - Não some fontes com definições diferentes na mesma coluna. Se duas fontes medem coisas
    diferentes, elas são dois fatores.
  - Commit numa branch própria, não na main.
```

---

## Depois da medição

Com os números em mãos, a sequência recomendada (não executar antes de ter a evidência):

1. **V-Dem no pilar Governance** — se a cobertura confirmar ~200 países desde o século XIX,
   isso sozinho leva Governance de 6% efetivos para perto dos 30% nominais em toda a série.
2. **Dividir o pilar Security em dois fatores** — conflito armado (UCDP + PRIO) e violência
   letal comum (UNODC) — com pesos próprios, dando ao pilar a estrutura hierárquica que o
   Economic já tem.
3. **Reavaliar o corte temporal do índice** à luz da nova cobertura, e marcar explicitamente
   os registros que continuarem sem os três pilares.
4. **Só então** revisitar os achados #1 (momentum duplica nível) e #4 (linha de base expandida)
   da revisão de lógica — são independentes de fonte e continuam valendo mesmo com dados perfeitos.
