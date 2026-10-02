'use client';

import type { Cargo, CargoId } from '@/core/compose/entities/composition';
import { MAX_NOME_LENGTH } from '@/core/compose/entities/composition';
import { cn } from '@/shared/utils';
import { Button, StepTitle } from './ui';

export function CandidatoStep({
  cargos,
  cargo,
  numero,
  nome,
  onCargo,
  onNumero,
  onNome,
  onNext,
  onBack,
}: {
  cargos: Cargo[];
  cargo: CargoId;
  numero: string;
  nome: string;
  onCargo: (cargo: CargoId) => void;
  onNumero: (numero: string) => void;
  onNome: (nome: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const selected = cargos.find((item) => item.id === cargo);
  const digits = selected?.digits ?? 2;
  const complete = numero.length === digits;

  return (
    <div>
      <StepTitle hint="O número é o que aparece grande na imagem.">Em quem você votou</StepTitle>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-400">Cargo</legend>
        <div className="flex flex-wrap gap-2">
          {cargos.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onCargo(item.id)}
              aria-pressed={item.id === cargo}
              className={cn(
                'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors',
                item.id === cargo
                  ? 'border-emerald-500 bg-emerald-500 text-emerald-950'
                  : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="numero" className="mb-2 block text-sm font-medium text-zinc-400">
          Número ({digits} dígitos)
        </label>
        <input
          id="numero"
          value={numero}
          onChange={(event) => onNumero(event.target.value.replace(/\D/g, '').slice(0, digits))}
          // Numeric keypad on mobile; `pattern` is what makes iOS show it.
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder={'0'.repeat(digits)}
          aria-describedby="numero-hint"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-center font-mono text-4xl font-bold tracking-[0.3em] text-zinc-50 placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
        />
        <p id="numero-hint" className="mt-2 text-xs text-zinc-500">
          {complete ? 'Pronto.' : `Faltam ${digits - numero.length} dígito(s).`}
        </p>
      </div>

      <div className="mt-5">
        <label htmlFor="nome" className="mb-2 block text-sm font-medium text-zinc-400">
          Nome na imagem <span className="text-zinc-600">(opcional)</span>
        </label>
        <input
          id="nome"
          value={nome}
          onChange={(event) => onNome(event.target.value.slice(0, MAX_NOME_LENGTH))}
          maxLength={MAX_NOME_LENGTH}
          autoComplete="off"
          placeholder="Como você quiser escrever"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <Button className="mt-6" disabled={!complete} onClick={onNext}>
        Escolher moldura
      </Button>
      <Button variant="ghost" className="mt-2" onClick={onBack}>
        Voltar
      </Button>
    </div>
  );
}
