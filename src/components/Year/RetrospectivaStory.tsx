"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ReadingFingerprint } from "@/components/Fingerprint/ReadingFingerprint";
import type { RetrospectiveData } from "@/services/retrospectiveData";
import styles from "./retrospectiva.module.css";

const SPINE_H = [90, 120, 70, 140, 100, 110, 80, 130, 95, 150, 85, 115, 105, 125, 75, 135];
const BAR_PAL = ["#5a86bf", "#8a5a2c", "#a06fa0", "#4f8f88", "#b1585a", "#c06a3e"];
const SPINE_PAL = ["#8a5a2c", "#5a86bf", "#a06fa0", "#4f8f88", "#b1585a", "#c06a3e", "#6f9a58"];

function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${((n >> 16) & 255) * 0.6 | 0},${((n >> 8) & 255) * 0.6 | 0},${(n & 255) * 0.6 | 0})`;
}

export function RetrospectivaStory({
  data,
  onClose,
}: {
  data: RetrospectiveData;
  onClose: () => void;
}) {
  const storyRef = useRef<HTMLDivElement | null>(null);
  const chapterRefs = useRef<HTMLElement[]>([]);
  const fpRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const story = storyRef.current;
    if (!story) return;
    const activeClass = styles.active;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function countUp(el: HTMLElement) {
      const target = Number(el.dataset.count);
      const dur = 1400;
      let t0 = 0;
      if (reduced) {
        el.textContent = target.toLocaleString("pt-BR");
        return;
      }
      function tick(t: number) {
        if (!t0) t0 = t;
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e).toLocaleString("pt-BR");
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.55) {
            const el = e.target as HTMLElement;
            if (!el.classList.contains(activeClass)) {
              el.classList.add(activeClass);
              el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
            }
            setActive(Number(el.dataset.ch));
          }
        }
      },
      { root: story, threshold: [0.55] },
    );
    const chapterEls = Array.from(
      story.querySelectorAll<HTMLElement>("[data-ch]"),
    );
    chapterEls.forEach((c) => io.observe(c));

    // parallax: fundo mais lento que a frente
    const plx = Array.from(story.querySelectorAll<HTMLElement>("[data-speed]"));
    let ticking = false;
    function onScroll() {
      if (reduced) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        for (const el of plx) {
          const ch = el.closest<HTMLElement>("[data-ch]");
          if (!ch) continue;
          const rel = story!.scrollTop - ch.offsetTop;
          const speed = parseFloat(el.dataset.speed!);
          el.style.transform = `translate3d(0, ${(rel * speed).toFixed(1)}px, 0)`;
        }
        ticking = false;
      });
    }
    story.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      io.disconnect();
      story.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  function downloadCard() {
    const cv = fpRef.current;
    if (!cv) return;
    try {
      const a = document.createElement("a");
      a.href = cv.toDataURL("image/png");
      a.download = `retrospectiva-${data.year}.png`;
      a.click();
    } catch {
      /* alguns navegadores bloqueiam toDataURL em contexto restrito */
    }
  }

  const who = data.holder ? `de ${data.holder}` : "de leitura";
  const maxPct = Math.max(...data.genres.map((g) => g.percent), 1);

  // Monta capítulos condicionais (nunca mostra um capítulo vazio).
  const chapters: { key: string; bg: string; far: string; node: ReactNode }[] = [];

  chapters.push({
    key: "intro",
    bg: styles.bIntro,
    far: "✦",
    node: (
      <div className={styles.content}>
        <p className={styles.kicker}>Retrospectiva · modo história</p>
        <h1 className={styles.titleSerif}>
          O ano {who}
          <br />
          em livros
        </h1>
        <p className={styles.sub}>
          {data.year} · role para reviver o seu ano de leitura
        </p>
      </div>
    ),
  });

  chapters.push({
    key: "livros",
    bg: styles.bLivros,
    far: String(data.books),
    node: (
      <div className={styles.content}>
        <p className={styles.kicker}>Você terminou</p>
        <p className={styles.huge}>
          <span data-count={data.books}>0</span>
        </p>
        <p className={styles.cap}>
          {data.books === 1 ? "livro do começo ao fim" : "livros do começo ao fim"}
        </p>
        <div className={styles.spines} data-speed="-0.12">
          {Array.from({
            length: Math.min(Math.max(data.books, 3), 16),
          }).map((_, i) => (
            <i
              key={i}
              style={{
                height: `${SPINE_H[i % SPINE_H.length]}px`,
                background: `linear-gradient(${SPINE_PAL[i % SPINE_PAL.length]}, ${shade(SPINE_PAL[i % SPINE_PAL.length])})`,
              }}
            />
          ))}
        </div>
      </div>
    ),
  });

  chapters.push({
    key: "paginas",
    bg: styles.bPaginas,
    far: "§",
    node: (
      <div className={styles.content}>
        <p className={styles.kicker}>Foram</p>
        <p className={styles.huge}>
          <span data-count={data.pages}>0</span>
        </p>
        <p className={styles.cap}>páginas viradas</p>
        <p className={styles.sub}>
          ≈ {(data.pages * 0.00012).toFixed(1).replace(".", ",")} metro de
          lombadas empilhadas · uma pequena torre só sua
        </p>
      </div>
    ),
  });

  if (data.hours > 0) {
    chapters.push({
      key: "tempo",
      bg: styles.bTempo,
      far: "⏳",
      node: (
        <div className={styles.content}>
          <p className={styles.kicker}>Cerca de</p>
          <p className={styles.huge}>
            <span data-count={data.hours}>0</span>
            <span className={styles.hSuffix}>h</span>
          </p>
          <p className={styles.cap}>mergulhada em histórias</p>
          <p className={styles.sub}>
            ≈ {Math.round(data.hours / 24)} dias inteiros de leitura · com o café
            esfriando do lado
          </p>
        </div>
      ),
    });
  }

  if (data.countries > 0) {
    chapters.push({
      key: "mundo",
      bg: styles.bMundo,
      far: "◍",
      node: (
        <div className={styles.content}>
          <p className={styles.kicker}>Você viajou por</p>
          <p className={styles.huge}>
            <span data-count={data.countries}>0</span>
          </p>
          <p className={styles.cap}>
            {data.countries === 1 ? "país" : "países"}, em {data.continents}{" "}
            {data.continents === 1 ? "continente" : "continentes"}
          </p>
          <p className={styles.sub}>
            {data.authors} autores diferentes te contaram uma história esse ano
          </p>
          <div className={styles.countryDots}>
            {data.countryList
              .filter((iso) => iso)
              .slice(0, 24)
              .map((iso, i) => (
                <span
                  key={iso + i}
                  className={`fi fi-${iso} ${styles.flagChip}`}
                  aria-hidden
                />
              ))}
          </div>
        </div>
      ),
    });
  }

  if (data.genres.length > 0 && data.topGenre) {
    chapters.push({
      key: "genero",
      bg: styles.bGenero,
      far: "❦",
      node: (
        <div className={styles.content}>
          <p className={styles.kicker}>Seu tom foi</p>
          <h2 className={styles.titleSerif}>{data.topGenre}</h2>
          <div className={styles.bars}>
            {data.genres.map((g, i) => (
              <div className={styles.barrow} key={g.name}>
                <div className={styles.lab}>
                  <b>{g.name}</b>
                  <span>{g.percent}%</span>
                </div>
                <div className={styles.track}>
                  <i
                    style={
                      {
                        ["--w" as string]: `${Math.round((g.percent / maxPct) * 100)}%`,
                        background: `linear-gradient(90deg, ${BAR_PAL[i % BAR_PAL.length]}, ${BAR_PAL[i % BAR_PAL.length]}cc)`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (data.bestMonth) {
    chapters.push({
      key: "mes",
      bg: styles.bMes,
      far: "✸",
      node: (
        <div className={styles.content}>
          <p className={styles.kicker}>Seu auge foi em</p>
          <h2 className={styles.titleSerif}>{data.bestMonth.name}</h2>
          <p className={styles.cap}>
            <span data-count={data.bestMonth.count}>0</span>{" "}
            {data.bestMonth.count === 1 ? "livro num mês" : "livros num mês só"}
          </p>
          <p className={styles.sub}>o mês em que você mais devorou páginas</p>
        </div>
      ),
    });
  }

  if (data.topBook) {
    const r = data.topBook.rating ? Math.round(data.topBook.rating) : 0;
    chapters.push({
      key: "livro",
      bg: styles.bLivro,
      far: "★",
      node: (
        <div className={styles.content}>
          <p className={styles.kicker}>O livro do seu ano</p>
          <div className={styles.bookcard}>
            <div className={styles.thebook}>
              <div className={styles.bt}>{data.topBook.title}</div>
              {data.topBook.author && (
                <div className={styles.ba}>{data.topBook.author}</div>
              )}
            </div>
            <div>
              {r > 0 && (
                <div className={styles.starsBig}>
                  {"★".repeat(r)}
                  {"☆".repeat(5 - r)}
                </div>
              )}
              {data.fiveStarCount > 0 && (
                <p className={styles.sub} style={{ marginTop: 6 }}>
                  {data.fiveStarCount === 1
                    ? "o seu único 5 estrelas do ano"
                    : `um dos ${data.fiveStarCount} livros que ganharam 5 estrelas`}
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    });
  }

  chapters.push({
    key: "final",
    bg: styles.bFinal,
    far: "✦",
    node: (
      <div className={styles.content}>
        <p className={styles.kicker}>Seu {data.year} em um cartão</p>
        <div className={styles.art}>
          <ReadingFingerprint
            genres={data.fingerprintGenres}
            books={data.books}
            pages={data.pages}
            countries={data.countries}
            rating={data.rating}
            canvasRef={fpRef}
          />
        </div>
        <div className={styles.finalcard}>
          <h2 className={styles.titleSerif} style={{ fontSize: "1.6rem" }}>
            O ano {who}
          </h2>
          <div className={styles.fcGrid}>
            <div>
              <div className={styles.fcN}>{data.books.toLocaleString("pt-BR")}</div>
              <div className={styles.fcC}>livros</div>
            </div>
            <div>
              <div className={styles.fcN}>{data.pages.toLocaleString("pt-BR")}</div>
              <div className={styles.fcC}>páginas</div>
            </div>
            <div>
              <div className={styles.fcN}>{data.countries}</div>
              <div className={styles.fcC}>países</div>
            </div>
            <div>
              <div className={styles.fcN}>{data.topGenre ?? "—"}</div>
              <div className={styles.fcC}>gênero do ano</div>
            </div>
          </div>
          <div className={styles.fcActions}>
            <button className={styles.dl} onClick={downloadCard}>
              Baixar cartão
            </button>
            <button className={styles.an} onClick={onClose}>
              Ver análise completa
            </button>
          </div>
        </div>
      </div>
    ),
  });

  return (
    <div className={styles.storyRoot}>
      <button className={styles.exit} onClick={onClose}>
        ✕ modo análise
      </button>

      <div className={styles.story} ref={storyRef}>
        {chapters.map((c, i) => (
          <section
            key={c.key}
            data-ch={i}
            ref={(el) => {
              if (el) chapterRefs.current[i] = el;
            }}
            className={`${styles.chapter} ${c.bg} ${i === 0 ? styles.active : ""}`}
          >
            <div className={styles.layer} data-speed="0.3" />
            <div className={styles.far} data-speed="0.5">
              {c.far}
            </div>
            {c.node}
            {i === 0 && (
              <div className={styles.scrollHint}>
                role
                <i />
              </div>
            )}
          </section>
        ))}
      </div>

      <div className={styles.nav}>
        {chapters.map((c, i) => (
          <button
            key={c.key}
            aria-current={active === i}
            aria-label={`Capítulo ${i + 1}`}
            onClick={() =>
              chapterRefs.current[i]?.scrollIntoView({
                behavior: reduced ? "auto" : "smooth",
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
