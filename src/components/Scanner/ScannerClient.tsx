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
  isbn?: string;
  cover_url?: string;
  confidence?: string;
  sources: Record<string, Source>;
};

type Phase = "scan" | "loading" | "draft";

function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9X]/gi, "");
}

/** Reduz uma imagem (video/img) a JPEG base64 leve pra mandar à IA. */
function toDownscaledBase64(
  source: HTMLVideoElement | HTMLImageElement,
  maxW = 900,
): { base64: string; mime: string } | null {
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
  return { base64: dataUrl.split(",")[1], mime: "image/jpeg" };
}

export function ScannerClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [phase, setPhase] = useState<Phase>("scan");
  const [found, setFound] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [manualIsbn, setManualIsbn] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [vcap, setVcap] = useState("Aponte para o código de barras · segure firme");

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

  // ---- busca por ISBN (APIs) ----
  const runIsbn = useCallback(async (rawIsbn: string) => {
    const isbn = normalizeIsbn(rawIsbn);
    if (isbn.length !== 10 && isbn.length !== 13) {
      setError("ISBN inválido (10 ou 13 dígitos).");
      return;
    }
    setFound(true);
    setVcap("✓ ISBN lido — buscando dados…");
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
      // APIs não acharam — parte pro rascunho vazio com CTA de IA.
      setDraft({ isbn, sources });
      setError(res.message);
    }
    setPhase("draft");
  }, [stopCamera]);

  // ---- câmera + BarcodeDetector ----
  useEffect(() => {
    if (phase !== "scan") return;
    let cancelled = false;
    setFound(false);
    setVcap("Aponte para o código de barras · segure firme");

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
        setCamError(null);

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
          setVcap("Sem leitor automático — digite o ISBN ou use a foto da capa");
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
  }, [phase, runIsbn, stopCamera]);

  // ---- IA: foto da capa ----
  async function scanCover() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      showToast("Câmera ainda carregando…");
      return;
    }
    const img = toDownscaledBase64(video);
    if (!img) return;
    stopCamera();
    setFound(true);
    setPhase("loading");
    setError(null);
    const res = await completeBookWithAI({
      coverImageBase64: img.base64,
      coverMimeType: img.mime,
    });
    handleAiResult(res, {});
  }

  // upload de arquivo (fallback sem câmera)
  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
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
      handleAiResult(res, {});
    };
    img.src = url;
  }

  function handleAiResult(
    res: Awaited<ReturnType<typeof completeBookWithAI>>,
    base: Partial<Draft>,
  ) {
    if (!res.ok) {
      setDraft((prev) => prev ?? { sources: {} });
      setError(res.message);
      setPhase("draft");
      return;
    }
    const d = res.data;
    setDraft((prev) => {
      const sources = { ...(prev?.sources ?? base.sources ?? {}) };
      const take = <T,>(k: string, cur: T | undefined, ai: T | undefined) => {
        if (cur !== undefined && cur !== null) return cur;
        if (ai !== undefined && ai !== null) {
          sources[k] = "IA";
          return ai;
        }
        return cur;
      };
      const merged: Draft = {
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
        cover_url: prev?.cover_url,
        isbn: prev?.isbn ?? d.isbn13,
        confidence: d.confidence,
        sources,
      };
      return merged;
    });
    setError(null);
    setPhase("draft");
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
    handleAiResult(res, { sources: draft.sources });
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
      categories: draft.categories,
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
    setFound(false);
    setManualIsbn("");
    setPhase("scan");
  }

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className={styles.stage}>
      <p className={styles.eyebrow}>Escanear</p>
      <h1 className={styles.title}>Aponte e cadastre</h1>
      <p className={styles.lead}>
        Leia o código de barras (ou fotografe a capa) e o livro entra
        preenchido — das APIs e, quando falta, da IA.
      </p>

      {phase === "scan" && (
        <>
          <div className={`${styles.viewer} ${found ? styles.found : ""}`}>
            <video
              ref={videoRef}
              className={styles.video}
              playsInline
              muted
            />
            {camError ? (
              <div className={styles.noCam}>
                {camError}
                <br />
                Digite o ISBN abaixo ou envie uma foto da capa.
              </div>
            ) : (
              <>
                <div className={styles.reticle}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.scanline} />
                <div className={styles.vcap}>{vcap}</div>
              </>
            )}
          </div>

          <div className={styles.controls}>
            <div className={styles.row}>
              <button
                className={styles.btn}
                onClick={scanCover}
                disabled={!!camError}
              >
                📷 Ler a capa (IA)
              </button>
              <button
                className={styles.btnGhost}
                onClick={() => fileRef.current?.click()}
              >
                Enviar foto
              </button>
            </div>
            <form
              className={styles.manual}
              onSubmit={(e) => {
                e.preventDefault();
                if (manualIsbn.trim()) runIsbn(manualIsbn);
              }}
            >
              <input
                inputMode="numeric"
                placeholder="Ou digite o ISBN…"
                value={manualIsbn}
                onChange={(e) => setManualIsbn(e.target.value)}
              />
              <button className={styles.btnGhost} type="submit">
                Buscar
              </button>
            </form>
            <p className={styles.note}>
              A câmera lê o código automaticamente (quando o navegador
              suporta). A leitura da capa usa IA pra identificar o livro.
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
          {draft.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.cover_url} alt={draft.title ?? "capa"} />
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
        <Row k="Gêneros" value={draft.categories?.join(" · ")} source={s.categories} />
        <Row k="Sinopse" value={draft.synopsis} full />
      </div>

      <button
        className={styles.completeAi}
        onClick={onCompleteAI}
        disabled={aiBusy}
      >
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
