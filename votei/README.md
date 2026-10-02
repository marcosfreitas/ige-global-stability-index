# VOTEI

Põe uma moldura na foto da pessoa com o número em que ela votou. Uma geração, um Pix, sem cadastro.

Construído sobre o [nextjs-saas-starter](https://github.com/marcosfreitas/nextjs-saas-starter) (Next 16 / React 19, DDD + Clean Architecture). O billing do starter era Polar; aqui foi trocado por Pix via EFI Bank.

---

## Como funciona

1. A pessoa escolhe uma foto. O navegador reduz, converte para JPEG e **remove os metadados** antes de enviar.
2. Escolhe o cargo e digita o número. O cargo define quantos dígitos o número tem.
3. Escolhe a moldura e vê a prévia com marca d'água, renderizada no servidor.
4. Paga um Pix de valor único. A tela vira sozinha quando o pagamento cai.
5. Baixa ou compartilha a imagem 1080×1080 sem marca.

Sem login. A pessoa ganha uma sessão anônima do Supabase na primeira ação, e o cookie desse navegador é a única chave dos pedidos dela.

## Preço

`PRICE_BRL_CENTS`, padrão **290** (R$ 2,90). Trocar o preço é mudar a variável e redeployar — não tem preço em código nem no cliente.

O valor sugerido na ideia original era R$ 2,00. Os R$ 2,90 ficam abaixo da barreira dos R$ 3, continuam sendo "dois e pouco", e rendem 45% a mais por venda. O custo marginal de uma geração é essencialmente a tarifa do Pix: a imagem é composta localmente, sem API de imagem.

## Rodando

```bash
pnpm install
cp .env.local.example .env.local   # preencha o Supabase; deixe EFI_FAKE_PIX=true
pnpm dev                           # http://localhost:3100
```

Com `EFI_FAKE_PIX=true` as cobranças se confirmam sozinhas depois de alguns segundos, então dá para percorrer o fluxo inteiro antes de existir certificado da EFI. A flag é ignorada quando `NODE_ENV=production`.

### Supabase

1. Rode `supabase/migrations/20261002000000_orders.sql` (tabela `orders`, RLS e o bucket privado `votei-photos`).
2. **Habilite o login anônimo**: Authentication → Providers → Anonymous. Sem isso o app não cria sessão e nada funciona.

### EFI Bank

A API Pix da EFI exige **mTLS em toda chamada**, inclusive na de token. Exporte o `.p12` e coloque em base64:

```bash
base64 -w0 certificado.p12   # → EFI_CERT_PFX_BASE64
```

Depois registre o webhook:

```bash
node scripts/register-efi-webhook.mjs https://seudominio.com.br
```

Dois detalhes que costumam derrubar essa integração:

- **A EFI acrescenta `/pix` à URL registrada.** Por isso o handler fica em `/api/v1/webhooks/efi/pix` e você registra só até `/api/v1/webhooks/efi`.
- **A EFI valida mTLS na chamada de volta**, e o Vercel não apresenta certificado de cliente. O script registra com `x-skip-mtls-checking: true`. Isso só é seguro porque o handler trata o payload como palpite não autenticado: ele lê o `txid` e **pergunta à EFI** se aquela cobrança foi paga antes de liberar qualquer coisa. Webhook forjado não gera imagem grátis.

### Deploy

`vercel.json` já traz o cron de limpeza (de hora em hora) e o `maxDuration` das rotas que renderizam. Defina `CRON_SECRET` no projeto — o Vercel manda esse valor como Bearer automaticamente.

## Decisões que valem saber

**O número nunca passa por IA.** Para escrever "VOTEI 13" um modelo de imagem é a ferramenta errada: erra dígito e mexe no rosto. O texto vira path vetorial com [satori](https://github.com/vercel/satori) e é sobreposto com [sharp](https://sharp.pixelplumbing.com/) — sempre exato, custo zero, ~200 ms.

**O Nano Banana entra antes disso, e só na foto.** O seletor "Estilo da foto" manda o retrato para o modelo (aquarela, pop art, grafite, vitral) e a moldura com o número é aplicada por cima do resultado. Assim o visual estilizado existe sem que o dígito dependa do modelo.

Dois provedores, escolhidos por variável de ambiente: `REPLICATE_API_TOKEN` (roda `google/nano-banana`) ou `GEMINI_API_KEY` (direto no Google). Replicate ganha quando os dois existirem. Sem nenhum, a lista de estilos sai vazia da API e a interface esconde o controle — o produto continua inteiro.

Três cuidados nessa integração:

- **Cache por (foto, estilo).** A prévia re-renderiza a cada toque em moldura; sem cache seria uma chamada de modelo por toque, lenta e paga. O resultado estilizado é gravado uma vez e reaproveitado.
- **Degradação total.** Chave ausente, timeout, recusa do modelo, resposta sem imagem: tudo devolve a foto original com `applied: false`. Um modelo com mau humor nunca derruba uma venda.
- **O prompt proíbe texto, logo, bandeira e símbolo político.** O modelo restiliza o retrato e nada mais.

Vale notar que a chamada ao Replicate usa `Prefer: wait`, ou seja, é síncrona e pode levar dezenas de segundos — daí o `maxDuration` nas rotas que renderizam.

**As fontes vão embutidas em base64** (`fonts.generated.ts`, gerado por `scripts/embed-fonts.mjs`). Depender do file tracing do Next para achar um `.woff` é a causa clássica do "funciona local e dá 500 no deploy".

**`satori` e `sharp` estão em `serverExternalPackages`.** O satori resolve o `hb.wasm` do harfbuzzjs relativo ao próprio pacote; empacotado, a renderização morre com ENOENT — e só na hora de renderizar.

**A prévia é renderizada no servidor**, não no canvas do navegador. Marca d'água aplicada no cliente é sugestão, e a prévia é a única coisa entre o caminho de graça e o pago.

**O pagamento é verificado na EFI em toda entrega**, nunca só na linha do banco.

## Privacidade

Em quem alguém votou é opinião política — dado pessoal sensível pela LGPD. O desenho reflete isso:

- A foto e o número vivem 2 horas. O job de purga apaga os dois e deixa só o registro de pagamento.
- O GPS do arquivo é removido no aparelho da pessoa, antes do upload.
- O bucket é privado, sem policy de storage: só o service role lê.
- RLS em `orders` como rede de segurança, além do filtro explícito por dono em toda consulta.
- A chave da foto é prefixada com o id da sessão, então uma chave vazada não serve para outro navegador.
- Nada de e-mail, telefone ou nome real.

## O que não está aqui, de propósito

**Lista de candidatos.** A pessoa digita o número e, se quiser, um nome. Não existe catálogo embutido de candidatos, nem logo de partido, nem foto de candidato: logo e imagem têm dono, e um catálogo transformaria um utilitário de foto em plataforma de propaganda. Para ter nomes de verdade, o caminho é consumir a API DivulgaCand do TSE em vez de versionar uma lista.

**Qualquer aparência de documento.** As molduras são decorativas e assumidas como manifestação pessoal. Nada no app imita comprovante de votação, e-Título ou peça da Justiça Eleitoral.

> Isto não é parecer jurídico. A legislação eleitoral brasileira restringe propaganda paga na internet, e vale passar o modelo de cobrança por um advogado eleitoral antes de divulgar.

## Comandos

```bash
pnpm dev                    # porta 3100
pnpm build
pnpm typecheck
pnpm lint
pnpm test --runInBand
node scripts/embed-fonts.mjs                              # regerar fontes embutidas
node scripts/register-efi-webhook.mjs https://dominio.com # registrar webhook
```
