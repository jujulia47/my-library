"use client";

import { useState, type CSSProperties } from "react";
import { Reveal, Stagger, Parallax, CountUp } from "@/components/motion";
import { WorldMapChart } from "@/components/Overview/WorldMapChart";
import type { PassportData, PassportDestino } from "@/services/passportData";
import styles from "./passport.module.css";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const INK = ["#82393a", "#6d3914", "#2c5078", "#386661", "#7a4a6e", "#9b4722", "#8c6e1c"];

function firstStampLabel(iso: string | null): string {
  if (!iso) return "—";
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`;
}

export function PassaporteClient({ data }: { data: PassportData }) {
  return (
    <div className={styles.wrap}>
      {/* filtro de tinta irregular reutilizado pelos carimbos */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="passportInk">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
        </filter>
      </svg>

      {/* capa */}
      <div className={styles.cover}>
        <Parallax speed={0.12} className={styles.texture}>
          <span />
        </Parallax>
        <div className={styles.frame} />
        <Reveal className={styles.coverInner} y={18}>
          <p className={styles.eyebrow}>República das Leituras</p>
          <div className={styles.crest} aria-hidden>
            <svg viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.4" opacity=".6" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2.4" />
              <g stroke="currentColor" strokeWidth="1.2" opacity=".8">
                <path d="M50 6v9M50 85v9M6 50h9M85 50h9M19 19l6 6M75 75l6 6M81 19l-6 6M25 75l-6 6" />
              </g>
              <path
                d="M50 40c-6-5-16-6-22-4v26c6-2 16-1 22 4 6-5 16-6 22-4V36c-6-2-16-1-22 4z"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M50 40v26" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h1 className={styles.title}>Passaporte Literário</h1>
          <div className={styles.holder}>
            {data.holder && <span className={styles.holderName}>{data.holder}</span>}
            <span className={styles.holderSub}>
              {data.countriesCount}{" "}
              {data.countriesCount === 1 ? "país visitado" : "países visitados"} ·{" "}
              {data.continentsCount}{" "}
              {data.continentsCount === 1 ? "continente" : "continentes"}
            </span>
            <span className={styles.emission}>
              Emitido em {data.year} · válido por toda a vida
            </span>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNum}><CountUp value={data.countriesCount} /></div>
              <div className={styles.statCap}>Países</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}><CountUp value={data.continentsCount} /></div>
              <div className={styles.statCap}>Continentes</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}><CountUp value={data.booksCount} /></div>
              <div className={styles.statCap}>Livros</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}><CountUp value={data.pagesCount} /></div>
              <div className={styles.statCap}>Páginas</div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* mapa-múndi das leituras */}
      {data.mapData.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Mapa das leituras</p>
          <Reveal className={styles.mapCard} y={20}>
            <WorldMapChart
              data={data.mapData}
              withoutCountry={data.missingCountry}
            />
          </Reveal>
        </section>
      )}

      {/* carimbos */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>Carimbos</p>
        {data.stamps.length === 0 ? (
          <p className={styles.empty}>
            Nenhum carimbo ainda — termine um livro com o país do autor
            cadastrado e ele aparece aqui.
          </p>
        ) : (
          <Stagger className={styles.stampsGrid} step={45} y={16}>
            {data.stamps.map((s, i) => (
              <figure
                key={s.country}
                className={styles.stampCell}
                title={`${s.label} · ${s.count} ${s.count === 1 ? "livro" : "livros"}`}
              >
                <div
                  className={styles.stamp}
                  style={
                    {
                      "--rot": `${((i * 37) % 13) - 6}deg`,
                      color: INK[i % INK.length],
                    } as CSSProperties
                  }
                >
                  <div className={styles.stampInner}>
                    <span className={`fi fi-${s.iso} ${styles.stampFlag}`} role="img" aria-label={s.label} />
                    <span className={styles.stampCountry}>{s.label}</span>
                    <span className={styles.stampMeta}>✦ {s.count} · {firstStampLabel(s.firstDate)}</span>
                  </div>
                </div>
                {s.books[0] && (
                  <figcaption className={styles.stampCap}>
                    abriu com <b>{s.books[0]}</b>
                  </figcaption>
                )}
              </figure>
            ))}
          </Stagger>
        )}
      </section>

      {/* destinos */}
      {data.destinos.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Destinos — na sua estante, esperando o 1º carimbo</p>
          <Stagger className={styles.destGrid} step={40} y={14}>
            {data.destinos.map((d) => (
              <Destino key={d.country} d={d} />
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
}

function Destino({ d }: { d: PassportDestino }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={styles.destino + (open ? " " + styles.open : "")}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
    >
      <span className={`fi fi-${d.iso} ${styles.destFlag}`} role="img" aria-label={d.label} />
      <span className={styles.destName}>{d.label}</span>
      <span className={styles.destN}>
        {d.count} {d.count === 1 ? "livro esperando" : "livros esperando"}
      </span>
      <ul className={styles.destBooks}>
        {d.books.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
