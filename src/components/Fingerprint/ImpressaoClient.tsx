"use client";

import { useRef } from "react";
import { Reveal } from "@/components/motion";
import type { FingerprintData } from "@/services/fingerprintData";
import {
  ReadingFingerprint,
  FINGERPRINT_PALETTE,
} from "./ReadingFingerprint";
import styles from "./impressao.module.css";

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

export function ImpressaoClient({ data }: { data: FingerprintData }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalGenre = data.genres.reduce((s, g) => s + g.count, 0) || 1;

  function exportCard() {
    const cv = canvasRef.current;
    if (!cv) return;
    try {
      const a = document.createElement("a");
      a.href = cv.toDataURL("image/png");
      a.download = "impressao-digital.png";
      a.click();
    } catch {
      /* alguns navegadores bloqueiam o toDataURL em contexto restrito */
    }
  }

  if (data.books === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card} style={{ gridTemplateColumns: "1fr" }}>
          <p className={styles.empty}>
            Sua impressão digital aparece quando você terminar o primeiro
            livro — cada gênero vira uma cor, o volume vira camadas e os
            países orbitam ao redor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <Reveal className={styles.card} y={22}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Impressão digital</p>
          <h1 className={styles.title}>A assinatura da sua leitura</h1>
          <p className={styles.lead}>
            Uma arte única, gerada dos seus dados: cada gênero é uma faixa de
            cor, o volume vira camadas, os países orbitam e sua nota média dá o
            brilho. Muda conforme você lê — e é sempre sua.
          </p>
          <div className={styles.art}>
            <ReadingFingerprint
              genres={data.genres}
              books={data.books}
              pages={data.pages}
              countries={data.countries}
              rating={data.rating}
              canvasRef={canvasRef}
            />
            <div className={styles.yr}>{data.holder ?? "Impressão digital"}</div>
          </div>
        </div>

        <div className={styles.info}>
          <div>
            <p className={styles.plabel}>Gêneros</p>
            {data.genres.length === 0 ? (
              <p className={styles.emptyGenres}>
                Nenhuma categoria nos livros lidos ainda — categorize seus
                livros pra colorir a impressão.
              </p>
            ) : (
              <div className={styles.legend}>
                {data.genres.map((g, i) => {
                  const pc = Math.round((g.count / totalGenre) * 100);
                  const col =
                    FINGERPRINT_PALETTE[i % FINGERPRINT_PALETTE.length];
                  return (
                    <div className={styles.lg} key={g.name}>
                      <span
                        className={styles.sw}
                        style={{ background: col }}
                        aria-hidden
                      />
                      <span className={styles.nm}>{g.name}</span>
                      <span className={styles.pc}>{pc}%</span>
                      <span className={styles.bar}>
                        <i style={{ width: `${pc}%`, background: col }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statN}>{fmt(data.books)}</div>
              <div className={styles.statC}>livros</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statN}>{fmt(data.pages)}</div>
              <div className={styles.statC}>páginas</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statN}>{fmt(data.countries)}</div>
              <div className={styles.statC}>países</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statN}>
                {data.rating != null
                  ? data.rating.toFixed(1).replace(".", ",")
                  : "—"}
              </div>
              <div className={styles.statC}>nota média</div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.export}
              onClick={exportCard}
            >
              Baixar como cartão
            </button>
            <p className={styles.note}>
              Sua arte, da vida toda de leitura.
              <br />
              Baixa em PNG pra compartilhar.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
