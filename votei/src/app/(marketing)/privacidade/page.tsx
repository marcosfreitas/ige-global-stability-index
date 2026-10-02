import Link from 'next/link';

export const metadata = { title: 'Privacidade — VOTEI' };

export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Privacidade</h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-zinc-300">
        <section>
          <h2 className="font-semibold text-zinc-100">O que a gente guarda</h2>
          <p className="mt-1.5 text-zinc-400">
            Sua foto e o número que você digitou, pelo tempo necessário para montar e entregar a
            imagem: 2 horas. Depois disso os dois são apagados automaticamente e sobra só o
            registro do pagamento (valor, data e identificador da cobrança), que a gente precisa
            manter por obrigação fiscal.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-zinc-100">Dado sensível</h2>
          <p className="mt-1.5 text-zinc-400">
            Em quem você votou é opinião política, classificada como dado pessoal sensível pela
            LGPD. É por isso que o prazo é curto, o acesso é restrito à sua própria sessão e nada
            disso é usado para anúncio, perfil ou qualquer outra finalidade.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-zinc-100">Sem cadastro</h2>
          <p className="mt-1.5 text-zinc-400">
            Não pedimos e-mail, telefone nem nome de verdade. Seu acesso é uma sessão anônima
            guardada neste navegador: só ele abre os seus pedidos. Se você limpar os dados do
            navegador, perde o acesso — e isso é proposital.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-zinc-100">Localização da foto</h2>
          <p className="mt-1.5 text-zinc-400">
            Fotos de celular carregam coordenadas de GPS no arquivo. A gente remove esses dados no
            seu próprio aparelho, antes do envio.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-zinc-100">Pagamento</h2>
          <p className="mt-1.5 text-zinc-400">
            O Pix é processado pela EFI Bank. A gente não vê nem armazena os dados da sua conta.
          </p>
        </section>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-emerald-400 underline">
        Voltar
      </Link>
    </main>
  );
}
