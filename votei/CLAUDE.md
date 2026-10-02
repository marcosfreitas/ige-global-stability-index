# CLAUDE.md — VOTEI

App de moldura de foto com o número do voto, pago por Pix. Sem cadastro: uma geração, um pagamento.

Derivado do boilerplate `nextjs-saas-starter` (Next 16 / React 19, DDD + Clean Architecture). As regras do boilerplate continuam valendo e estão em `.agents/rules/` — carregue o arquivo quando o assunto aparecer.

| Assunto | Arquivo |
|---------|---------|
| Camadas e regra de dependência | [`.agents/rules/architecture.md`](.agents/rules/architecture.md) |
| Stack e versões | [`.agents/rules/tech-stack.md`](.agents/rules/tech-stack.md) |
| Convenções de API, nomes, estilo | [`.agents/rules/project-guidelines.md`](.agents/rules/project-guidelines.md) |
| Hierarquia de erros | [`.agents/rules/error-handling.md`](.agents/rules/error-handling.md) |
| Fluxo de trabalho / commits | [`.agents/rules/sdlc.md`](.agents/rules/sdlc.md) |
| Segurança | [`.agents/rules/security-analysis.md`](.agents/rules/security-analysis.md) |

`.agents/rules/auth-guidelines.md` descreve magic link, que **não** é usado aqui: a autenticação é sessão anônima do Supabase.

## O que mudou em relação ao boilerplate

| Mudança | Onde |
|---------|------|
| Polar removido, Pix da EFI no lugar | `src/infrastructure/payments/` |
| Auth por magic link trocada por sessão anônima | `src/infrastructure/database/anonymous-session.ts` |
| `(authenticated)/`, `auth/sign-in`, domínio `users` removidos | — |
| `sharp` e `satori` adicionados | `src/infrastructure/imaging/` |
| `serverExternalPackages: ['sharp', 'satori']` | `next.config.ts` |
| Porta padrão do dev é 3100 | `package.json` |

## Domínios

```
core/compose/   molduras, cargos, validação do número (puro)
core/orders/    pedido, cobrança Pix, entrega, purga
```

`core/` não importa Next, Supabase, HTTP nem React. As molduras ficam em `core/` como **dados** (id, rótulo, paleta); o SVG que as desenha é presentation e mora em `src/infrastructure/imaging/frames.ts`.

## Invariantes que não podem quebrar

1. **Pagamento é verificado na EFI, nunca só na linha do banco.** `DeliverOrderService` pergunta ao PSP antes de compor. O webhook é palpite não autenticado: lê o `txid` e manda verificar. Há teste cobrindo isso.
2. **A prévia é renderizada no servidor e com marca d'água.** Marca d'água no cliente é sugestão.
3. **O preço vem do servidor** (`getPriceBrlCents()`), nunca do cliente.
4. **A foto e o número são apagados na purga.** Opinião política é dado sensível na LGPD. Não adicione coluna, log ou analytics que persista o número além do TTL.
5. **Sem catálogo de candidatos, logo de partido ou foto de candidato.** O número é digitado. Ver README.
6. **Chave de foto é prefixada com o id do dono** e checada com `isPhotoKeyOwnedBy` em toda rota que a aceita.

## Armadilhas já pagas

- **`satori` precisa estar em `serverExternalPackages`.** Empacotado, ele não acha o `hb.wasm` do harfbuzzjs e a renderização estoura ENOENT — só na hora de renderizar, não no build.
- **As fontes são embutidas em base64** (`fonts.generated.ts`, via `scripts/embed-fonts.mjs`). Não troque por leitura de arquivo: o file tracing do Next não garante o `.woff` no bundle serverless.
- **HEIC não chega ao servidor.** O sharp pré-compilado não decodifica HEIF; o navegador reconverte em `lib/resize-image.ts`. Não adicione `image/heic` em `ACCEPTED_PHOTO_TYPES`.
- **Pasta de rota com `_` na frente é privada** no App Router e não vira rota.
- **A EFI acrescenta `/pix`** à URL de webhook registrada.
- A regra `react-hooks/set-state-in-effect` do React Compiler é erro, não aviso. Estado assíncrono vai em React Query; hidratação do zustand vai por `useComposerHydrated()`.

## Comandos

```bash
pnpm dev                                                      # porta 3100
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm test --runInBand
```

`pnpm typecheck`, `pnpm lint` e `pnpm test` precisam passar antes de commitar. Conventional Commits, uma unidade lógica por commit.
