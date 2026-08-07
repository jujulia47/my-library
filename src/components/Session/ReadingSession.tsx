"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { recordReadingSession } from "@/actions/recordReadingSession";
import { createAmbientPlayer, type SceneKey } from "./ambient";
import styles from "./session.module.css";

const SECS_PER_PAGE_EST = 80; // estimativa só pra sugerir página/preencher anel

const SCENES: {
  key: SceneKey;
  label: string;
  icon: string;
  sound: string;
  mode: "motes" | "rain" | "embers" | "dust";
}[] = [
  { key: "cafe", label: "Café", icon: "☕", sound: "murmúrio de cafeteria", mode: "motes" },
  { key: "rain", label: "Chuva", icon: "🌧", sound: "chuva na janela", mode: "rain" },
  { key: "fire", label: "Lareira", icon: "🔥", sound: "crepitar do fogo", mode: "embers" },
  { key: "library", label: "Biblioteca", icon: "🌙", sound: "silêncio", mode: "dust" },
];

const TIME_OPTS = [15, 25, 45, 60];
const PAGE_OPTS = [20, 30, 50];

type Props = {
  readingId: string;
  title: string;
  author?: string | null;
  currentPage: number;
  totalPages: number;
  onClose: () => void;
};

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}
function fmtPace(secPerPage: number): string {
  const m = Math.floor(secPerPage / 60);
  const s = Math.round(secPerPage % 60);
  return m > 0 ? `${m}min${s < 10 ? "0" : ""}${s}/pág` : `${s}s/pág`;
}

export function ReadingSession({
  readingId,
  title,
  author,
  currentPage,
  totalPages,
  onClose,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"setup" | "running" | "end" | "summary">(
    "setup",
  );
  const [metaMode, setMetaMode] = useState<"time" | "pages">("time");
  const [metaValue, setMetaValue] = useState(25);
  const [scene, setScene] = useState<SceneKey>("cafe");
  const [soundOn, setSoundOn] = useState(true);

  const [elapsed, setElapsed] = useState(0); // segundos
  const [running, setRunning] = useState(false);

  const [endPage, setEndPage] = useState(currentPage);
  const [pagesRead, setPagesRead] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ambient = useRef<ReturnType<typeof createAmbientPlayer> | null>(null);
  const ambientStarted = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accRef = useRef(0);
  const startRef = useRef(0);
  const runningRef = useRef(false);
  const lastSecRef = useRef(-1);

  const sceneMode = SCENES.find((s) => s.key === scene)!.mode;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* trava o scroll do body enquanto a sessão está aberta */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* player de áudio: cria uma vez, descarta ao sair */
  useEffect(() => {
    ambient.current = createAmbientPlayer();
    return () => ambient.current?.dispose();
  }, []);

  /* cronômetro (rAF; atualiza o display por segundo) */
  useEffect(() => {
    if (phase !== "running") return;
    let raf = 0;
    const loop = () => {
      if (runningRef.current) {
        const e = accRef.current + (performance.now() - startRef.current) / 1000;
        if (Math.floor(e) !== lastSecRef.current) {
          lastSecRef.current = Math.floor(e);
          setElapsed(e);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  /* partículas da cena (canvas) */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    let parts: Record<string, number>[] = [];

    function resize() {
      W = cv!.clientWidth;
      H = cv!.clientHeight;
      cv!.width = W * dpr;
      cv!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      const n = reduced ? 24 : 70;
      parts = [];
      if (sceneMode === "rain") {
        for (let i = 0; i < (reduced ? 40 : 130); i++)
          parts.push({ x: Math.random() * W, y: Math.random() * H, l: 8 + Math.random() * 14, s: 6 + Math.random() * 8 });
      } else if (sceneMode === "embers") {
        for (let i = 0; i < (reduced ? 18 : 55); i++)
          parts.push({ x: W * 0.5 + (Math.random() - 0.5) * W * 0.4, y: H + Math.random() * H * 0.3, r: 1 + Math.random() * 2, s: 0.4 + Math.random() * 1, life: Math.random() });
      } else {
        for (let i = 0; i < n; i++)
          parts.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2, s: 0.1 + Math.random() * 0.4, dx: (Math.random() - 0.5) * 0.3, a: 0.1 + Math.random() * 0.4 });
      }
    }
    function draw() {
      ctx!.clearRect(0, 0, W, H);
      if (sceneMode === "rain") {
        ctx!.strokeStyle = "rgba(180,205,230,.35)";
        ctx!.lineWidth = 1.2;
        for (const p of parts) {
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(p.x - 1.5, p.y + p.l);
          ctx!.stroke();
          p.y += p.s;
          p.x -= 0.3;
          if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
        }
      } else if (sceneMode === "embers") {
        for (const p of parts) {
          const fl = 0.6 + 0.4 * Math.sin((p.life += 0.05) * 6);
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, 7);
          ctx!.fillStyle = `rgba(255,${150 + Math.floor(70 * fl)},70,${0.5 * fl + 0.2})`;
          ctx!.fill();
          p.y -= p.s;
          p.x += Math.sin(p.y * 0.03) * 0.4;
          if (p.y < H * 0.25) { p.y = H + 10; p.x = W * 0.5 + (Math.random() - 0.5) * W * 0.4; }
        }
      } else {
        for (const p of parts) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, 7);
          ctx!.fillStyle = (sceneMode === "dust" ? "rgba(220,210,180," : "rgba(240,210,150,") + p.a + ")";
          ctx!.fill();
          p.y -= p.s;
          p.x += p.dx;
          if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        }
      }
    }
    resize();
    seed();
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onResize = () => { resize(); seed(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [sceneMode, reduced]);

  /* ---- controles ---- */
  function toggleSound(next: boolean) {
    setSoundOn(next);
    if (phase !== "running" || !ambient.current) return;
    if (next && !ambientStarted.current) {
      ambient.current.start(scene);
      ambientStarted.current = true;
    } else {
      ambient.current.setMuted(!next);
    }
  }

  function begin() {
    accRef.current = 0;
    startRef.current = performance.now();
    runningRef.current = true;
    lastSecRef.current = -1;
    setElapsed(0);
    setRunning(true);
    setError(null);
    if (soundOn && ambient.current) {
      ambient.current.start(scene);
      ambientStarted.current = true;
    }
    setPhase("running");
  }

  function togglePause() {
    if (runningRef.current) {
      accRef.current += (performance.now() - startRef.current) / 1000;
      runningRef.current = false;
      setRunning(false);
      setElapsed(accRef.current);
    } else {
      startRef.current = performance.now();
      runningRef.current = true;
      setRunning(true);
    }
  }

  function finish() {
    // congela o tempo
    if (runningRef.current) {
      accRef.current += (performance.now() - startRef.current) / 1000;
      runningRef.current = false;
      setRunning(false);
      setElapsed(accRef.current);
    }
    ambient.current?.stop();
    const mins = Math.max(1, Math.round(accRef.current / 60));
    if (metaMode === "time") {
      const est = Math.max(1, Math.round(accRef.current / SECS_PER_PAGE_EST));
      setEndPage(Math.min(totalPages || 99999, currentPage + est));
    } else {
      setPagesRead(metaValue);
    }
    void mins;
    setPhase("end");
  }

  const minutes = Math.max(1, Math.round(elapsed / 60));
  const readNow =
    metaMode === "time"
      ? Math.max(0, endPage - currentPage)
      : Math.max(0, pagesRead);

  async function save() {
    setSaving(true);
    setError(null);
    const finalEnd =
      metaMode === "time" ? endPage : currentPage + Math.max(0, pagesRead);
    const res = await recordReadingSession({
      reading_id: readingId,
      end_page: finalEnd,
      seconds: Math.round(accRef.current),
      scene,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    ambient.current?.dispose();
    router.refresh();
    onClose();
  }

  function exit() {
    ambient.current?.stop();
    onClose();
  }

  const metaSeconds =
    metaMode === "time" ? metaValue * 60 : metaValue * SECS_PER_PAGE_EST;
  const ringProgress = Math.min(1, elapsed / metaSeconds);
  const CIRC = 2 * Math.PI * 120;

  const metaOpts = metaMode === "time" ? TIME_OPTS : PAGE_OPTS;
  const sceneSound = SCENES.find((s) => s.key === scene)!.sound;

  return (
    <div className={styles.overlay} data-scene={scene} role="dialog" aria-modal="true">
      <div className={styles.grad + " " + styles.gCafe} />
      <div className={styles.grad + " " + styles.gRain} />
      <div className={styles.grad + " " + styles.gFire} />
      <div className={styles.grad + " " + styles.gLib} />

      <div className={styles.sig + " " + styles.sigCafe}>
        <div className={styles.cup}>
          <div className={styles.steam}><span /><span /><span /></div>
          <div className={styles.cupBody} />
        </div>
      </div>
      <div className={styles.sig + " " + styles.sigFire}>
        <div className={styles.fireGlow} />
      </div>
      <div className={styles.sig + " " + styles.sigLib}>
        <div className={styles.moon} />
      </div>

      <canvas ref={canvasRef} className={styles.fx} />
      <div className={styles.vignette} />

      <div className={styles.content}>
        {phase === "setup" && (
          <section className={styles.setup} aria-label="Preparar sessão">
            <p className={styles.eyebrow}>Sessão de leitura</p>
            <h2 className={styles.title}>Prepare sua sessão</h2>
            <p className={styles.sub}>{title}{author ? ` · ${author}` : ""}</p>

            <div className={styles.field}>
              <p className={styles.flabel}>Meta da sessão</p>
              <div className={styles.seg} role="tablist">
                <button type="button" data-on={metaMode === "time"} onClick={() => setMetaMode("time")}>Tempo</button>
                <button type="button" data-on={metaMode === "pages"} onClick={() => setMetaMode("pages")}>Páginas</button>
              </div>
              <div className={styles.chips}>
                {metaOpts.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={styles.chip}
                    data-on={metaValue === o}
                    onClick={() => setMetaValue(o)}
                  >
                    {metaMode === "time" ? `${o} min` : `${o} pág`}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <p className={styles.flabel}>Cenário</p>
              <div className={styles.chips}>
                {SCENES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={styles.chip}
                    data-on={scene === s.key}
                    onClick={() => setScene(s.key)}
                  >
                    <span aria-hidden>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <p className={styles.flabel}>Som ambiente</p>
              <div className={styles.soundRow}>
                <div
                  className={styles.switch}
                  data-on={soundOn}
                  role="switch"
                  aria-checked={soundOn}
                  tabIndex={0}
                  onClick={() => toggleSound(!soundOn)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleSound(!soundOn);
                    }
                  }}
                />
                <span className={styles.soundCap}>{sceneSound}</span>
              </div>
            </div>

            <button type="button" className={styles.start} onClick={begin}>
              Iniciar sessão {SCENES.find((s) => s.key === scene)!.icon}
            </button>
            <p className={styles.note}>
              Só livro físico ou ebook — o ritmo é medido por página.<br />
              O som é gerado no navegador (ambiente sintetizado).
            </p>
          </section>
        )}

        {phase === "running" && (
          <div className={styles.session} style={{ display: "grid", height: "100%" }}>
            <div className={styles.top}>
              <div className={styles.book}>
                {title}
                <small>{author || "leitura"}</small>
              </div>
              <button type="button" className={styles.iconBtn} onClick={exit} title="Sair">
                ✕
              </button>
            </div>
            <div className={styles.center}>
              <div>
                <div className={styles.ringWrap}>
                  <svg viewBox="0 0 260 260">
                    <circle className={styles.ringBg} cx="130" cy="130" r="120" />
                    <circle
                      className={styles.ringFg}
                      cx="130"
                      cy="130"
                      r="120"
                      style={{
                        strokeDasharray: CIRC,
                        strokeDashoffset: CIRC * (1 - ringProgress),
                      }}
                    />
                  </svg>
                  <div className={styles.time}>{fmtClock(elapsed)}</div>
                </div>
                <p className={styles.metaLbl + (ringProgress >= 1 ? " " + styles.reached : "")}>
                  {ringProgress >= 1
                    ? "meta atingida ✦"
                    : metaMode === "time"
                      ? `meta · ${fmtClock(metaSeconds)}`
                      : `meta · ${metaValue} páginas`}
                </p>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.soundCap} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={styles.eq} data-on={soundOn} aria-hidden>
                  <i /><i /><i /><i />
                </span>
                <button
                  type="button"
                  className={styles.ctl}
                  onClick={() => toggleSound(!soundOn)}
                >
                  {soundOn ? "Som ligado" : "Som desligado"}
                </button>
              </div>
              <button type="button" className={styles.ctl} onClick={togglePause}>
                {running ? "Pausar" : "Retomar"}
              </button>
              <button type="button" className={styles.ctl + " " + styles.ctlPrimary} onClick={finish}>
                Encerrar
              </button>
            </div>
          </div>
        )}

        {phase === "end" && (
          <div className={styles.card}>
            {metaMode === "time" ? (
              <>
                <h2 className={styles.title} style={{ fontSize: "1.35rem" }}>
                  Até onde você chegou?
                </h2>
                <p className={styles.sub} style={{ marginBottom: 2 }}>
                  {title} · começou na pág. {currentPage}
                </p>
                <div className={styles.epInput}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={endPage}
                    min={currentPage}
                    max={totalPages || undefined}
                    onChange={(e) => setEndPage(Number(e.target.value) || currentPage)}
                    aria-label="Página em que você parou"
                  />
                  {totalPages ? <span>de {totalPages}</span> : null}
                </div>
                <p className={styles.hint}>
                  você leu {readNow} {readNow === 1 ? "página" : "páginas"} · {minutes} min
                </p>
              </>
            ) : (
              <>
                <h2 className={styles.title} style={{ fontSize: "1.3rem" }}>
                  Quanto tempo você levou
                </h2>
                <p className={styles.sub} style={{ marginBottom: 6 }}>
                  {title} · meta de {metaValue} páginas
                </p>
                <div className={styles.big}>
                  <b>{minutes}</b>
                  <span>min</span>
                </div>
                <div className={styles.adjust}>
                  <label htmlFor="pagesRead">leu quantas?</label>
                  <input
                    id="pagesRead"
                    type="number"
                    value={pagesRead}
                    min={0}
                    onChange={(e) => setPagesRead(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <p className={styles.hint}>
                  da {currentPage} à {currentPage + readNow} · ritmo{" "}
                  {readNow > 0 ? fmtPace((minutes * 60) / readNow) : "—"}
                </p>
              </>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.save} onClick={() => setPhase("summary")}>
                Concluir sessão
              </button>
              <button
                type="button"
                className={styles.again}
                onClick={() => {
                  startRef.current = performance.now();
                  runningRef.current = true;
                  setRunning(true);
                  if (soundOn && ambient.current) ambient.current.start(scene);
                  setPhase("running");
                }}
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {phase === "summary" && (
          <div className={styles.card}>
            <div className={styles.check}>✓</div>
            <h2 className={styles.title} style={{ fontSize: "1.4rem" }}>
              Sessão concluída
            </h2>
            <p className={styles.sub}>{title}</p>
            <div className={styles.nums}>
              <div className={styles.num}>
                {readNow}
                <small>páginas</small>
              </div>
              <div className={styles.num}>
                {minutes}
                <small>minutos</small>
              </div>
            </div>
            <p className={styles.pace}>
              Seu ritmo nesta sessão:{" "}
              <b>{readNow > 0 ? fmtPace((minutes * 60) / readNow) : "—"}</b>
            </p>
            <div className={styles.planNote}>
              As sessões vão calibrando o <b>seu</b> ritmo real — as estimativas
              de tempo do plano deixam de usar o valor fixo e passam a usar a sua
              média.
            </div>
            {error && <p className={styles.errline}>{error}</p>}
            <div className={styles.actions}>
              <button type="button" className={styles.save} onClick={save} disabled={saving}>
                {saving ? "Salvando…" : "Salvar sessão"}
              </button>
              <button type="button" className={styles.again} onClick={exit}>
                Descartar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
