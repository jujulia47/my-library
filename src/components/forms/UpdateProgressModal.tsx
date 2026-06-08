"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Textarea, Button } from "@/components/ui";
import StarRating from "@/components/FormFields/StarRating";
import { updateReadingProgress } from "@/actions/updateReadingProgress";
import { finishReading } from "@/actions/finishReading";

export type UpdateProgressTarget = {
  reading_id: string;
  book_slug: string;
  book_title: string;
  current_page: number;
  pages_count: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  target: UpdateProgressTarget | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function UpdateProgressModal({ open, onClose, target }: Props) {
  const router = useRouter();
  const [page, setPage] = useState<string>(
    target ? String(target.current_page) : "",
  );
  const [logDate, setLogDate] = useState<string>(todayISO());
  // Fluxo de 2 passos: primeiro salva progresso; se atingiu 100%, transiciona
  // pra "finish" pra capturar avaliação/resenha sem o usuário precisar abrir
  // outro modal.
  const [phase, setPhase] = useState<"progress" | "finish">("progress");
  const [rating, setRating] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setPage(target ? String(target.current_page) : "");
    setLogDate(todayISO());
    setPhase("progress");
    setRating(0);
    setError(null);
    setFieldError(null);
  }, [open, target?.reading_id, target?.current_page, target]);

  if (!target) return null;

  const total = target.pages_count;
  const numericPage = Number(page);
  const validPercent =
    total > 0 && Number.isFinite(numericPage)
      ? Math.min(100, Math.max(0, Math.round((numericPage / total) * 100)))
      : 0;
  const reached100 = total > 0 && numericPage >= total;
  const todayMax = todayISO();

  const onSubmitProgress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setFieldError(null);
    startTransition(async () => {
      const result = await updateReadingProgress(fd);
      if (!result.ok) {
        if (result.field === "current_page") {
          setFieldError(result.message);
        } else {
          setError(result.message);
        }
        return;
      }
      // Atingiu o fim → segue pra conclusão. Caso contrário, fecha.
      if (reached100) {
        setPhase("finish");
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  const onSubmitFinish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await finishReading(fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const handleFinishLater = () => {
    // Página já foi salva no passo 1 — fecha mantendo a leitura "reading".
    router.refresh();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        phase === "finish"
          ? `Leitura concluída · ${target.book_title}`
          : `Atualizar progresso · ${target.book_title}`
      }
      size="sm"
    >
      {phase === "progress" ? (
        <form onSubmit={onSubmitProgress} className="space-y-4">
          <input type="hidden" name="id" value={target.reading_id} />
          <input type="hidden" name="book_slug" value={target.book_slug} />

          <Input
            label="Página atual"
            name="current_page"
            type="number"
            min={0}
            max={total > 0 ? total : undefined}
            value={page}
            onChange={(e) => setPage(e.target.value)}
            helperText={
              total > 0
                ? `de ${total} páginas · ${validPercent}%`
                : "número da página atual"
            }
            errorText={fieldError ?? undefined}
            autoFocus
          />

          <Input
            label="Data de leitura"
            name="log_date"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            max={todayMax}
            helperText="Quando você leu essas páginas — use ontem se esqueceu de registrar no dia."
          />

          {reached100 && (
            <p className="text-sm italic text-moss bg-moss/10 border border-moss/30 rounded-md px-3 py-2">
              Você chegou na última página. Ao salvar, vou abrir a tela de
              conclusão pra adicionar estrelas e resenha.
            </p>
          )}

          {error && (
            <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isPending}
            >
              {reached100 ? "Salvar e concluir" : "Salvar"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmitFinish} className="space-y-4">
          <input type="hidden" name="id" value={target.reading_id} />
          <input type="hidden" name="book_slug" value={target.book_slug} />

          <p className="text-sm italic text-ink-fade">
            Última página registrada! Marque a leitura como concluída e, se
            quiser, deixe estrelas e resenha.
          </p>

          <Input
            label="Data de conclusão"
            name="finish_date"
            type="date"
            defaultValue={logDate}
            max={todayMax}
          />

          <div>
            <StarRating
              label="Avaliação"
              value={rating}
              onChange={setRating}
              name="rating"
            />
          </div>

          <Textarea
            label="Resenha"
            name="review"
            placeholder="O que ficou pra você?"
          />

          {error && (
            <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-between items-center gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFinishLater}
              disabled={isPending}
            >
              Concluir depois
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isPending}
            >
              Concluir leitura
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
