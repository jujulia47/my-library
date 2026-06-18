"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import Modal from "./Modal";
import { Input, Button } from "@/components/ui";
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
          ? "Página final"
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
        <form
          onSubmit={onSubmitFinish}
          className="-mx-6 -mb-6 px-6 pt-2 pb-6 rounded-b-lg space-y-6"
          // Sutil gradiente de papel + leve tint dourado pra evocar a página
          // final de um caderno. As "ruled lines" ficam dentro do textarea.
          style={{
            backgroundImage:
              "linear-gradient(180deg, var(--color-ivory-light) 0%, var(--color-paper) 100%)",
          }}
        >
          <input type="hidden" name="id" value={target.reading_id} />
          <input type="hidden" name="book_slug" value={target.book_slug} />

          {/* Hero do "encerrar" — vinheta de página final, com cabeçalho
              centralizado e o nome do livro em destaque. */}
          <div className="text-center pt-3 pb-1">
            <p className="font-body text-[10px] uppercase tracking-[0.25em] text-ink-fade">
              Última página
            </p>
            <h2 className="font-display text-2xl text-ink-deep mt-1 leading-tight">
              {target.book_title}
            </h2>
            <p className="font-body text-xs italic text-ink-fade mt-2">
              Hoje você fecha esse livro.
            </p>
          </div>

          {/* Estrelas centralizadas e maiores — primeiro gesto de avaliação. */}
          <div className="flex justify-center scale-125 py-2">
            <StarRating
              label=""
              value={rating}
              onChange={setRating}
              name="rating"
            />
          </div>

          {/* "Como foi a leitura?" — campo manuscrito com linhas pautadas
              tipo caderno. O label vira pergunta em font-display italic; o
              textarea é transparente e ganha "ruled lines" via background. */}
          <div>
            <label
              htmlFor="finish-review"
              className="block font-display italic text-lg text-ink-deep mb-2"
            >
              Como foi a leitura?
            </label>
            <textarea
              id="finish-review"
              name="review"
              rows={6}
              placeholder="Comece a escrever…"
              className="w-full bg-transparent font-body italic text-base text-ink-deep placeholder:text-ink-fade/60 focus:outline-none resize-none border-0"
              // Linhas pautadas: gradient com uma linha fina a cada 28px
              // (alinhada com o leading do texto pra a escrita "cair" em
              // cima da pauta).
              style={{
                lineHeight: "28px",
                backgroundImage:
                  "linear-gradient(to bottom, transparent 27px, var(--color-border) 27px, var(--color-border) 28px, transparent 28px)",
                backgroundSize: "100% 28px",
              }}
            />
          </div>

          {/* Data de conclusão — discreto, no rodapé do "caderno". */}
          <div className="flex items-center justify-between gap-3 pt-1 text-xs italic text-ink-fade">
            <label
              htmlFor="finish-date"
              className="flex items-center gap-1.5"
            >
              <CalendarDaysIcon className="w-3.5 h-3.5" aria-hidden />
              <span>fechado em</span>
            </label>
            <input
              id="finish-date"
              name="finish_date"
              type="date"
              defaultValue={logDate}
              max={todayMax}
              className="bg-transparent border-b border-border/70 focus:outline-none focus:border-gold text-ink-deep not-italic text-xs px-1 py-0.5"
            />
          </div>

          {error && (
            <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-between items-center gap-2 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFinishLater}
              disabled={isPending}
            >
              Anotar depois
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isPending}
            >
              Encerrar leitura
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
