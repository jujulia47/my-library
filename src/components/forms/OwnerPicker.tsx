"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui";
import { createPerson } from "@/actions/createPerson";

type Person = { id: string; name: string };

type Props = {
  people: Person[];
  /** Dono atual; null/undefined = "Meu". */
  initialOwnerId?: string | null;
};

/**
 * Seletor de dono do livro. Posta `owner_person_id` com o form ("" = Meu).
 * Permite cadastrar uma pessoa da casa na hora, sem sair do formulário.
 */
export default function OwnerPicker({ people: initialPeople, initialOwnerId }: Props) {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [ownerId, setOwnerId] = useState(initialOwnerId ?? "");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const addPerson = () => {
    setError(null);
    startTransition(async () => {
      const res = await createPerson(name);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (!res.data) return;
      const created = res.data;
      setPeople((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      );
      setOwnerId(created.id);
      setName("");
      setAdding(false);
    });
  };

  return (
    <div className="space-y-2">
      <Select
        label="Dono"
        name="owner_person_id"
        value={ownerId}
        onChange={(e) => setOwnerId(e.target.value)}
        placeholder="Meu"
        options={people.map((p) => ({ value: p.id, label: p.name }))}
        helperText="De quem é o livro na casa. A leitura continua sendo sua."
      />

      {adding ? (
        <div className="flex items-center gap-2">
          {/* Sem `name`: não vai junto com o form do livro. */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Enter aqui criaria a pessoa, não salvaria o livro.
              if (e.key === "Enter") {
                e.preventDefault();
                if (name.trim()) addPerson();
              }
            }}
            placeholder="Nome da pessoa"
            autoFocus
            className="flex-1 rounded-md border border-border bg-ivory-light px-3 py-2 text-sm text-ink-deep focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
          />
          <button
            type="button"
            onClick={addPerson}
            disabled={pending || !name.trim()}
            className="text-sm px-3 py-2 rounded-md bg-[#6D3914] text-ivory-light disabled:opacity-50"
          >
            {pending ? "Adicionando…" : "Adicionar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setName("");
              setError(null);
            }}
            className="text-sm text-ink-soft underline hover:text-ink-deep"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-sm text-ink-soft underline hover:text-ink-deep"
        >
          + Nova pessoa da casa
        </button>
      )}

      {error && <p className="text-xs text-burgundy">{error}</p>}
    </div>
  );
}
