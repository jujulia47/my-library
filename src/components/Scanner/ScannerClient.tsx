"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lookupBookByIsbn } from "@/actions/lookupBookByIsbn";
import { completeBookWithAI } from "@/actions/completeBookWithAI";
import { createBookFromScan, type ScanDraft } from "@/actions/createBookFromScan";
import styles from "./scanner.module.css";

/* BarcodeDetector não está nos tipos padrão do DOM. */
type DetectedBarcode = { rawValue: string };
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
};
declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

const LANG_LABEL: Record<string, string> = {
  pt_BR: "Português", en: "Inglês", es: "Espanhol", fr: "Francês",
  it: "Italiano", de: "Alemão", ja: "Japonês", other: "Outro",
};

type Source = "APIs" | "IA" | "código";
type CameraMode = null | "barcode";
type Phase = "idle" | "loading" | "draft";

type Draft = {
  title?: string;
  authors?: string[];
  language?: string;
  publisher?: string;
  publication_year?: number;
  edition_year?: number;
  original_title?: string;
  pages?: number;
  synopsis?: string;
  categories?: string[];
  seriesName?: string;
  seriesVolume?: number;
  seriesTotal?: number;
  isbn?: string;
  cover_url?: string;
  /** Foto tirada da capa — vira a capa do livro (base64 + preview). */
  coverPhotoBase64?: string;
  coverPhotoMime?: string;
  coverPreview?: string;
  confidence?: string;
  sources: Record<string, Source>;
};

function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9X]/gi, "");
}

/** Reduz uma imagem (video/img) a JPEG base64 leve pra mandar à IA. */
function toDownscaledBase64(
  source: HTMLVideoElement | HTMLImageElement,
  maxW = 900,
): { base64: string; mime: string; dataUrl: string } | null {
  const w =
    source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const h =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source.naturalHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, maxW / w);
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, cw, ch);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  return { base64: dataUrl.split(",")[1], mime: "image/jpeg", dataUrl };
}

export function ScannerClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraMode, setCameraMode] = useState<CameraMode>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [manualIsbn, setManualIsbn] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(null), 2800);
  }

  const stopCamera = useCallback(() => {
    if (scanTimer.current) clearInterval(scanTimer.current);
    scanTimer.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const closeCamera = useCallback(() => {
    setCameraMode(null);
  }, []);

  // ---- busca por ISBN (APIs) ----
  const runIsbn = useCallback(
    async (rawIsbn: string) => {
      const isbn = normalizeIsbn(rawIsbn);
      if (isbn.length !== 10 && isbn.length !== 13) {
        setError("ISBN inválido (10 ou 13 dígitos).");
        return;
      }
      setCameraMode(null);
      stopCamera();
      setError(null);
      setPhase("loading");

      const res = await lookupBookByIsbn(isbn);
      const sources: Record<string, Source> = { isbn: "código" };
      if (res.ok) {
        const d = res.data;
        const mark = (k: string, v: unknown) => {
          if (v !== undefined && v !== null) sources[k] = "APIs";
        };
        mark("title", d.title);
        mark("authors", d.authors);
        mark("language", d.language);
        mark("publisher", d.publisher);
        mark("publication_year", d.publication_year);
        mark("original_title", d.original_title);
        mark("pages", d.pages);
        mark("synopsis", d.synopsis);
        mark("categories", d.categories);
        mark("cover_url", d.cover_url);
        setDraft({
          title: d.title,
          authors: d.authors,
          language: d.language,
          publisher: d.publisher,
          publication_year: d.publication_year,
          original_title: d.original_title,
          pages: d.pages,
          synopsis: d.synopsis,
          categories: d.categories,
          cover_url: d.cover_url,
          isbn: d.isbn13 ?? isbn,
          sources,
        });
      } else {
        setDraft({ isbn, sources });
        setError(res.message);
      }
      setPhase("draft");
    },
    [stopCamera],
  );

  // ---- câmera sob demanda ----
  useEffect(() => {
    if (!cameraMode) return; // câmera desligada até escolher um modo
    let cancelled = false;
    setCamError(null);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("Sem acesso à câmera neste dispositivo.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }

        if (cameraMode === "barcode") {
          if (window.BarcodeDetector) {
            detectorRef.current = new window.BarcodeDetector({
              formats: ["ean_13", "ean_8"],
            });
            scanTimer.current = setInterval(async () => {
              const v = videoRef.current;
              const det = detectorRef.current;
              if (!v || !det || busyRef.current) return;
              try {
                const codes = await det.detect(v);
                const raw = codes[0]?.rawValue;
                if (raw && (raw.length === 13 || raw.length === 10)) {
                  busyRef.current = true;
                  runIsbn(raw).finally(() => {
                    busyRef.current = false;
                  });
                }
              } catch {
                /* frame ainda não pronto */
              }
            }, 450);
          } else {
            setCamError(
              "Este navegador não lê código de barras automaticamente (comum no iPhone). Fotografe a capa ou digite o ISBN.",
            );
          }
        }
      } catch {
        setCamError("Câmera indisponível (permissão negada ou sem HTTPS).");
      }
    }
    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraMode, runIsbn, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ---- IA: busca por nome do livro (sem câmera, ideal no PC) ----
  async function searchByName() {
    const q = nameQuery.trim();
    if (!q) return;
    setCameraMode(null);
    stopCamera();
    setPhase("loading");
    setError(null);
    const res = await completeBookWithAI({ title: q });
    handleAiResult(res);
  }

  // ---- IA: foto da capa (câmera nativa no celular, arquivo no PC) ----
  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCameraMode(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const enc = toDownscaledBase64(img);
      URL.revokeObjectURL(url);
      if (!enc) return;
      setPhase("loading");
      setError(null);
      const res = await completeBookWithAI({
        coverImageBase64: enc.base64,
        coverMimeType: enc.mime,
      });
      handleAiResult(res, enc);
    };
    img.src = url;
  }

  /** Quando a IA acha o ISBN mas não temos capa, puxa a capa real das APIs. */
  async function enrichCoverFromApis(isbn: string) {
    try {
      const res = await lookupBookByIsbn(isbn);
      if (res.ok && res.data.cover_url) {
        const url = res.data.cover_url;
        setDraft((prev) =>
          prev && !prev.cover_url && !prev.coverPhotoBase64
            ? { ...prev, cover_url: url }
            : prev,
        );
      }
    } catch {
      /* sem capa das APIs — fica a capa gerada */
    }
  }

  function handleAiResult(
    res: Awaited<ReturnType<typeof completeBookWithAI>>,
    photo?: { base64: string; mime: string; dataUrl: string },
  ) {
    if (!res.ok) {
      setDraft((prev) => prev ?? { sources: {} });
      setError(res.message);
      setPhase("draft");
      return;
    }
    const d = res.data;
    setDraft((prev) => {
      const sources = { ...(prev?.sources ?? {}) };
      const take = <T,>(k: string, cur: T | undefined, ai: T | undefined) => {
        if (cur !== undefined && cur !== null) return cur;
        if (ai !== undefined && ai !== null) {
          sources[k] = "IA";
          return ai;
        }
        return cur;
      };
      return {
        title: take("title", prev?.title, d.title),
        authors: take("authors", prev?.authors, d.authors),
        language: take("language", prev?.language, d.language),
        publisher: take("publisher", prev?.publisher, d.publisher),
        publication_year: take("publication_year", prev?.publication_year, d.publication_year),
        edition_year: take("edition_year", prev?.edition_year, d.edition_year),
        original_title: take("original_title", prev?.original_title, d.original_title),
        pages: take("pages", prev?.pages, d.pages),
        synopsis: take("synopsis", prev?.synopsis, d.synopsis),
        categories: take("categories", prev?.categories, d.categories),
        seriesName: take("seriesName", prev?.seriesName, d.series_name),
        seriesVolume: take("seriesVolume", prev?.seriesVolume, d.series_volume),
        seriesTotal: take("seriesTotal", prev?.seriesTotal, d.series_total),
        cover_url: prev?.cover_url,
        coverPhotoBase64: photo?.base64 ?? prev?.coverPhotoBase64,
        coverPhotoMime: photo?.mime ?? prev?.coverPhotoMime,
        coverPreview: photo?.dataUrl ?? prev?.coverPreview,
        isbn: prev?.isbn ?? d.isbn13,
        confidence: d.confidence,
        sources,
      };
    });
    setError(null);
    setPhase("draft");
    // Sem foto e com ISBN da IA → tenta capa real das APIs.
    if (!photo && d.isbn13) enrichCoverFromApis(d.isbn13);
  }

  async function completeWithAI() {
    if (!draft) return;
    setAiBusy(true);
    setError(null);
    const res = await completeBookWithAI({
      isbn: draft.isbn,
      title: draft.title,
      author: draft.authors?.[0],
      known: {
        title: draft.title,
        authors: draft.authors,
        publisher: draft.publisher,
        publication_year: draft.publication_year,
        pages: draft.pages,
      },
    });
    setAiBusy(false);
    handleAiResult(res);
  }

  async function addToLibrary() {
    if (!draft?.title) {
      showToast("Sem título — não dá pra adicionar.");
      return;
    }
    setAdding(true);
    const payload: ScanDraft = {
      title: draft.title,
      authors: draft.authors,
      language: draft.language ?? null,
      publisher: draft.publisher ?? null,
      publication_year: draft.publication_year ?? null,
      original_title: draft.original_title ?? null,
      pages: draft.pages ?? null,
      synopsis: draft.synopsis ?? null,
      isbn: draft.isbn ?? null,
      cover_url: draft.cover_url ?? null,
      coverImageBase64: draft.coverPhotoBase64 ?? null,
      coverImageMime: draft.coverPhotoMime ?? null,
      categories: draft.categories,
      series_name: draft.seriesName ?? null,
      series_volume: draft.seriesVolume ?? null,
      series_total: draft.seriesTotal ?? null,
    };
    const res = await createBookFromScan(payload);
    setAdding(false);
    if (res.ok) {
      showToast(`${draft.title} entrou na biblioteca ✓`);
      resetScan();
    } else {
      setError(res.message);
    }
  }

  function resetScan() {
    setDraft(null);
    setError(null);
    setManualIsbn("");
    setNameQuery("");
    setCameraMode(null);
    setPhase("idle");
  }

  function onIsbnFocus() {
    if (cameraMode) closeCamera(); // digitar ISBN fecha a câmera
  }

  return (
    <div className={styles.stage}>
      <p className={styles.eyebrow}>Escanear</p>
      <h1 className={styles.title}>Aponte e cadastre</h1>
      <p className={styles.lead}>
        Leia o código de barras, fotografe a capa, ou só digite o nome — o
        livro entra preenchido pelas APIs e pela IA.
      </p>

      {phase === "idle" && (
        <>
          {cameraMode && (
            <div className={styles.viewer}>
              <video ref={videoRef} className={styles.video} playsInline muted />
              {camError ? (
                <div className={styles.noCam}>{camError}</div>
              ) : (
                <>
                  <div className={styles.reticle}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className={styles.scanline} />
                  <div className={styles.vcap}>
                    Aponte para o código de barras · segure firme
                  </div>
                </>
              )}
              <button className={styles.camClose} onClick={closeCamera}>
                ✕ fechar câmera
              </button>
            </div>
          )}

          <div className={styles.controls}>
            {!cameraMode && (
              <>
                <button
                  className={styles.btn}
                  onClick={() => setCameraMode("barcode")}
                >
                  📷 Escanear código de barras
                </button>
                <button
                  className={styles.btnGhost}
                  onClick={() => fileRef.current?.click()}
                >
                  🖼 Foto da capa (IA)
                </button>
              </>
            )}

            <form
              className={styles.manual}
              onSubmit={(e) => {
                e.preventDefault();
                if (manualIsbn.trim()) runIsbn(manualIsbn);
              }}
            >
              <input
                inputMode="numeric"
                placeholder="Digite o ISBN (busca nas APIs)…"
                value={manualIsbn}
                onFocus={onIsbnFocus}
                onChange={(e) => {
                  if (cameraMode) closeCamera();
                  setManualIsbn(e.target.value);
                }}
              />
              <button className={styles.btnGhost} type="submit">
                Buscar
              </button>
            </form>

            <form
              className={styles.manual}
              onSubmit={(e) => {
                e.preventDefault();
                searchByName();
              }}
            >
              <input
                placeholder="Ou o nome do livro (IA)… ex.: Uma Janela Sombria"
                value={nameQuery}
                onFocus={onIsbnFocus}
                onChange={(e) => {
                  if (cameraMode) closeCamera();
                  setNameQuery(e.target.value);
                }}
              />
              <button
                className={styles.btnGhost}
                type="submit"
                disabled={!nameQuery.trim()}
              >
                ✦ Buscar com IA
              </button>
            </form>

            <p className={styles.note}>
              <b>Código de barras</b>: câmera lê o ISBN (Chrome/Android).{" "}
              <b>Foto da capa</b>: no celular abre a câmera, no PC os arquivos —
              a IA identifica pela imagem.{" "}
              <b>ISBN</b>: APIs gratuitas. <b>Nome</b>: a IA acha pelo título.
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.hiddenFile}
            onChange={onFilePicked}
          />
        </>
      )}

      {phase === "loading" && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          buscando dados do livro…
        </div>
      )}

      {phase === "draft" && draft && (
        <DraftView
          draft={draft}
          error={error}
          aiBusy={aiBusy}
          adding={adding}
          onCompleteAI={completeWithAI}
          onAdd={addToLibrary}
          onAgain={resetScan}
        />
      )}

      {toast && <div className={`${styles.toast} ${styles.toastShow}`}>{toast}</div>}
    </div>
  );
}

function Badge({ source }: { source?: Source }) {
  if (!source) return null;
  const cls =
    source === "IA"
      ? styles.srcAi
      : source === "código"
        ? styles.srcCode
        : styles.srcApi;
  return <span className={`${styles.src} ${cls}`}>{source}</span>;
}

function Row({
  k,
  value,
  source,
  full = false,
}: {
  k: string;
  value?: string | number | null;
  source?: Source;
  full?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className={`${styles.frow} ${full ? styles.full : ""}`}>
      <span className={styles.fk}>{k}</span>
      <span className={styles.fv}>{value}</span>
      {!full && <Badge source={source} />}
    </div>
  );
}

function DraftView({
  draft,
  error,
  aiBusy,
  adding,
  onCompleteAI,
  onAdd,
  onAgain,
}: {
  draft: Draft;
  error: string | null;
  aiBusy: boolean;
  adding: boolean;
  onCompleteAI: () => void;
  onAdd: () => void;
  onAgain: () => void;
}) {
  const s = draft.sources;
  const authorStr = draft.authors?.join(", ");
  return (
    <div>
      <div className={styles.rhead}>
        <div className={styles.rcover}>
          {draft.coverPreview || draft.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.coverPreview ?? draft.cover_url}
              alt={draft.title ?? "capa"}
            />
          ) : (
            <span className={styles.rcoverFallback}>{draft.title ?? "sem capa"}</span>
          )}
        </div>
        <div>
          <h2 className={styles.rtitle}>{draft.title ?? "Livro não identificado"}</h2>
          {authorStr && <p className={styles.rauthor}>{authorStr}</p>}
          {draft.isbn && <p className={styles.risbn}>✓ ISBN {draft.isbn}</p>}
        </div>
      </div>

      {draft.confidence === "baixa" && (
        <div className={styles.conf}>
          A IA não tem certeza deste livro — confira os dados antes de adicionar.
        </div>
      )}

      <div className={styles.fields}>
        <Row k="Título" value={draft.title} source={s.title} />
        <Row k="Autor" value={draft.authors?.join(", ")} source={s.authors} />
        <Row k="Páginas" value={draft.pages} source={s.pages} />
        {draft.isbn && <Row k="ISBN" value={draft.isbn} source={s.isbn} />}
        <Row k="Editora" value={draft.publisher} source={s.publisher} />
        <Row
          k="Publicação (original)"
          value={draft.publication_year}
          source={s.publication_year}
        />
        <Row
          k="Idioma"
          value={draft.language ? LANG_LABEL[draft.language] ?? draft.language : undefined}
          source={s.language}
        />
        <Row k="Título original" value={draft.original_title} source={s.original_title} />
        <Row
          k="Série"
          value={
            draft.seriesName
              ? `${draft.seriesName}${draft.seriesVolume ? ` · vol. ${draft.seriesVolume}` : ""}${draft.seriesTotal ? ` (de ${draft.seriesTotal})` : ""}`
              : undefined
          }
          source={s.seriesName}
        />
        <Row k="Gêneros" value={draft.categories?.join(" · ")} source={s.categories} />
        <Row k="Sinopse" value={draft.synopsis} full />
      </div>

      <button className={styles.completeAi} onClick={onCompleteAI} disabled={aiBusy}>
        {aiBusy ? "consultando IA…" : "✦ Completar com IA"}
      </button>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.ractions}>
        <button className={styles.add} onClick={onAdd} disabled={adding || !draft.title}>
          {adding ? "adicionando…" : "Adicionar à biblioteca"}
        </button>
        <button className={styles.again} onClick={onAgain}>
          Escanear outro
        </button>
      </div>
    </div>
  );
}
