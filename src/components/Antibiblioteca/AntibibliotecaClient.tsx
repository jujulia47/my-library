"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatReadingTime } from "@/utils/readingPlan";
import { imagesUrl } from "@/services/images";
import { startReadingBook } from "@/actions/startReadingBook";
import { addHomeNextRead } from "@/actions/addHomeNextRead";
import type { AntiBook, AntibibliotecaData } from "@/services/antibibliotecaData";
import { RoletaWheel } from "./RoletaWheel";
import styles from "./antibiblioteca.module.css";

function parkedLabel(y: number): string {
  return y <= 0 ? "este ano" : y === 1 ? "há 1 ano" : `há ${y} anos`;
}

type SizeFilter = "" | "short" | "mid" | "long";
type TimeFilter = "" | "recent" | "old";

function BookCover({
  b,
  showBadge = false,
}: {
  b: AntiBook;
  showBadge?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = b.cover && !imgError;
  return (
    <div
      className={styles.book}
      style={{ ["--c" as string]: b.color }}
      title={`${b.title}${b.author ? " · " + b.author : ""} · parado ${parkedLabel(b.years)}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagesUrl(b.cover)}
          alt={b.title}
          className={styles.coverImg}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={styles.cover}>
          <div className={styles.t}>{b.title}</div>
          <div className={styles.a}>{b.author ?? "—"}</div>
        </div>
      )}
      <div className={styles.dust} />
      {showBadge && <span className={styles.parkedBadge}>{parkedLabel(b.years)}</span>}
    </div>
  );
}

export function AntibibliotecaClient({ data }: { data: AntibibliotecaData }) {
  const router = useRouter();
  const [genre, setGenre] = useState("");
  const [size, setSize] = useState<SizeFilter>("");
  const [time, setTime] = useState<TimeFilter>("");
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const [open, setOpen] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [picked, setPicked] = useState<AntiBook | null>(null);
  const [resultShow, setResultShow] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, startAction] = useTransition();

  const filtered = useMemo(() => {
    return data.books.filter((b) => {
      if (removed.has(b.id)) return false;
      if (genre && b.genre !== genre) return false;
      const p = b.pages ?? 0;
      if (size === "short" && p > 250) return false;
      if (size === "mid" && (p < 250 || p > 450)) return false;
      if (size === "long" && p < 450) return false;
      if (time === "recent" && b.years > 1) return false;
      if (time === "old" && b.years < 3) return false;
      return true;
    });
  }, [data.books, removed, genre, size, time]);

  const totalPages = filtered.reduce((s, b) => s + (b.pages ?? 0), 0);
  const timeLabel = formatReadingTime(totalPages * data.secondsPerPage);
  const isFiltered = !!(genre || size || time);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function openRoleta() {
    if (filtered.length === 0) {
      showToast("Nenhum livro com esses filtros — solta um deles.");
      return;
    }
    setPicked(null);
    setResultShow(false);
    setOpen(true);
    setSpinKey((k) => k + 1);
  }
  function spinAgain() {
    setResultShow(false);
    setPicked(null);
    window.setTimeout(() => setSpinKey((k) => k + 1), 220);
  }
  function closeRoleta() {
    setOpen(false);
    setResultShow(false);
  }
  function onLand(b: AntiBook) {
    setPicked(b);
    requestAnimationFrame(() => setResultShow(true));
  }

  function handleRead(b: AntiBook) {
    startAction(async () => {
      const res = await startReadingBook(b.id, b.slug);
      if (res.ok) {
        setRemoved((s) => new Set(s).add(b.id));
        showToast(`Começou a ler ${b.title} · também foi pra fila de hoje`);
        closeRoleta();
        router.refresh();
      } else {
        showToast(res.message ?? "Não deu pra começar a leitura.");
      }
    });
  }
  function handlePlan(b: AntiBook) {
    startAction(async () => {
      const res = await addHomeNextRead(b.id);
      if (res.ok) {
        setRemoved((s) => new Set(s).add(b.id));
        showToast(`${b.title} entrou na fila do mês`);
        closeRoleta();
        router.refresh();
      } else {
        showToast(res.message ?? "Não deu pra adicionar ao plano.");
      }
    });
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>Antibiblioteca</p>
      <h1 className={styles.title}>Sua antibiblioteca</h1>
      <p className={styles.lead}>
        Os livros que você <em>tem e ainda não leu</em> — não uma lista de
        culpa, mas seu estoque de possibilidades (a <em>antibiblioteca</em> de
        Umberto Eco). Quando bater a indecisão, deixa a sorte escolher.
      </p>

      <div className={styles.counter}>
        <span className={styles.big}>{filtered.length}</span>
        <span className={styles.m}>livros esperando</span>
        <span className={styles.m}>
          · <b>{totalPages.toLocaleString("pt-BR")}</b> páginas
        </span>
        {totalPages > 0 && (
          <span className={styles.m}>
            · ~<b>{timeLabel}</b> de leitura no seu ritmo
          </span>
        )}
      </div>

      <div className={styles.roletaBar}>
        <button className={styles.surprise} onClick={openRoleta}>
          <span className={styles.die}>🎲</span> Me surpreenda
        </button>
        <div className={styles.filters}>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Todos os gêneros</option>
            {data.genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as SizeFilter)}
          >
            <option value="">Qualquer tamanho</option>
            <option value="short">Curto · até 250p</option>
            <option value="mid">Médio · 250–450p</option>
            <option value="long">Longo · 450p+</option>
          </select>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value as TimeFilter)}
          >
            <option value="">Qualquer tempo parado</option>
            <option value="recent">Recentes · até 1 ano</option>
            <option value="old">Esquecidos · 3 anos+</option>
          </select>
        </div>
      </div>

      <p className={styles.secLabel}>
        {isFiltered ? "Filtrado" : "Toda a antibiblioteca"} · {filtered.length}{" "}
        livros
      </p>

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {data.books.length === 0
            ? "Nenhum livro esperando — sua estante está em dia! (ou faltam livros cadastrados como “na estante”.)"
            : "Nenhum livro com esses filtros — solta um deles."}
        </p>
      ) : (
        <div className={styles.wall}>
          {filtered.map((b, i) => (
            <div
              key={b.id}
              style={{ animationDelay: `${Math.min(i * 22, 700)}ms` }}
              className={styles.wallItem}
            >
              <BookCover b={b} />
            </div>
          ))}
        </div>
      )}

      {/* overlay da roleta */}
      <div
        className={`${styles.overlay} ${open ? styles.show : ""}`}
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeRoleta();
        }}
      >
        {open && (
          <div style={{ display: picked ? "none" : "block" }}>
            <RoletaWheel pool={filtered} spinKey={spinKey} onLand={onLand} />
          </div>
        )}

        {picked && (
          <div className={`${styles.result} ${resultShow ? styles.show : ""}`}>
            <div className={styles.rcCover}>
              <BookCover b={picked} />
            </div>
            <div className={styles.rcInfo}>
              {picked.genre && (
                <span className={styles.rcGenre}>{picked.genre}</span>
              )}
              <h3 className={styles.rcTitle}>{picked.title}</h3>
              <p className={styles.rcMeta}>
                {picked.author ? `${picked.author} · ` : ""}
                {picked.pages ? `${picked.pages} páginas` : "sem nº de páginas"}
              </p>
              <p className={styles.rcParked}>parado {parkedLabel(picked.years)}</p>
              <div className={styles.rcActions}>
                <button
                  className={styles.aRead}
                  onClick={() => handleRead(picked)}
                >
                  Bora ler
                </button>
                <button
                  className={styles.aPlan}
                  onClick={() => handlePlan(picked)}
                >
                  Pro plano do mês
                </button>
                <button className={styles.aAgain} onClick={spinAgain}>
                  De novo
                </button>
                <button className={styles.aClose} onClick={closeRoleta}>
                  agora não
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`${styles.toast} ${styles.toastShow}`}>{toast}</div>}
    </div>
  );
}
