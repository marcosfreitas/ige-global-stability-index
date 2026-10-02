import Link from 'next/link';
import { ComposerFlow } from '@/features/composer/components/composer-flow';

export default function HomePage() {
  return (
    // min-h-dvh, not min-h-screen: 100vh is wrong under mobile browser chrome.
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-8">
      <header className="mb-7">
        <h1 className="text-3xl font-extrabold tracking-tight">
          VOTEI<span className="text-emerald-400">.</span>
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          Sua foto com o número do seu voto e uma moldura. Pronta em segundos.
        </p>
      </header>

      <ComposerFlow />

      <footer className="mt-auto py-8 text-center text-xs leading-relaxed text-zinc-600">
        <p>
          Manifestação pessoal feita por você. Não é documento, comprovante de votação nem
          material de campanha, e não tem vínculo com partido, candidato ou com a Justiça
          Eleitoral.
        </p>
        <p className="mt-3">
          <Link href="/privacidade" className="underline hover:text-zinc-400">
            Privacidade
          </Link>
        </p>
      </footer>
    </main>
  );
}
