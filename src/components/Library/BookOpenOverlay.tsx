"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Text, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { getBookForOpenView } from "@/actions/getBookForOpenView";
import { BookOpenView, type BookForOpenView } from "./BookOpenView";
import { spineHexForBookId } from "@/utils/spineColors";

type Props = {
  bookSlug: string;
  bookId: string;
  bookTitle?: string;
  /** DOMRect da lombada clicada — anchor inicial do book em world coords. */
  originRect: DOMRect;
  onClose: () => void;
};

// Dimensões do livro em world units. Camera em z=12 + FOV 30 → o livro
// ocupa ~40% da altura do viewport (não toma a tela inteira).
const BOOK_W = 2.4;
const BOOK_H = 3.4;
const BOOK_D = 0.38;

// Cores
const PAGE = "#F5E8D0";
const PAGE_DARK = "#9D8C73";
const GOLD = "#A0843E";
const GOLD_LIGHT = "#D4B056";
const INK = "#1A0F09";
const IVORY = "#FAF6EC";

/**
 * Overlay 3D real do "livro saindo da estante e abrindo" — Sessão 17.10
 * Fase 1 (react-three-fiber + drei).
 *
 * O livro é um Box com 6 materiais (capa, contracapa, lombada, 3 fore-edges
 * em creme). Capa decorada com 3D Text + gold-foil planes (cantos + frisos)
 * em Three.js puro — escolha por Html overlay foi descartada porque
 * causava layout issues e não recebia iluminação 3D.
 *
 * Sequência:
 *  1. Mount → fase "spine": livro aparece OFF-CENTER (lado escolhido pela
 *     posição do originRect) com rotateY -90° (mostrando lombada). useFrame
 *     lerps em direção ao centro com rotateY 0.
 *  2. ~600ms → fase "cover": chegou no centro com cover frontal. `<Float>`
 *     toma conta da flutuação contínua até o data carregar.
 *  3. Data ready + tempo mínimo → fase "open": fade do Canvas e BookOpenView
 *     entra com fade-in.
 */
export function BookOpenOverlay({
  bookSlug,
  bookId,
  bookTitle,
  originRect,
  onClose,
}: Props) {
  const [book, setBook] = useState<BookForOpenView | null>(null);
  // Phases:
  //   "cover"   — livro fechado flutuando (sai estante → centro → idle).
  //   "opening" — capa hinge abrindo no 3D (continuidade visual com "open").
  //   "open"    — Canvas faz fade-out e BookOpenView (HTML 2D) entra.
  const [phase, setPhase] = useState<"cover" | "opening" | "open">("cover");
  // Progresso 0..1 da animação de abertura da capa (hinge).
  const [openProgress, setOpenProgress] = useState(0);
  // Captura o timestamp do mount uma única vez (lazy init do useState).
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getBookForOpenView(bookSlug);
      if (!cancelled) setBook(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookSlug]);

  // Quando data + tempo mínimo flutuando passou, dispara "opening" (capa
  // começa a abrir).
  useEffect(() => {
    if (book && phase === "cover") {
      const elapsed = Date.now() - mountedAt;
      // 1.4s de transição (sai da estante → centro) + 1.5s de float idle.
      const minTotalTime = 2900;
      const wait = Math.max(0, minTotalTime - elapsed);
      const t = setTimeout(() => setPhase("opening"), wait);
      return () => clearTimeout(t);
    }
  }, [book, phase, mountedAt]);

  // Durante "opening": anima openProgress 0 → 1 com easeOutCubic em 1000ms.
  // Capa flipa 180° (full open spread). Ao final dispara "open".
  useEffect(() => {
    if (phase !== "opening") return;
    const startTime = Date.now();
    const duration = 1000;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setOpenProgress(eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Capa quase aberta — começa a transição pro BookOpenView.
        setPhase("open");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const title = book?.title ?? bookTitle ?? "";

  return (
    <div
      className="book-open-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Detalhe do livro"
    >
      {/* Canvas 3D sempre renderizado enquanto o overlay tá aberto. Não some
          quando phase vira "open" — fica como background atrás do BookOpenView
          2D que entra por cima. Continuidade: o livro 3D que abriu É o livro
          aberto que aparece. */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Canvas
          camera={{ position: [0, 0, 12], fov: 30 }}
          dpr={[1, 2]}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <Scene
            bookId={bookId}
            title={title}
            phase={phase}
            openProgress={openProgress}
            originRect={originRect}
          />
        </Canvas>
      </div>

      <AnimatePresence>
        {phase === "open" && book && (
          <motion.div
            key="book-content"
            // Fade in rápido — quando phase vira "open", o group 3D já some
            // (visible=false em AnimatedBook). Esse fade curto cobre o
            // micro-gap entre 3D hide e 2D appear. Acima de 0.35s o "cut"
            // fica perceptível; abaixo, parece que o conteúdo 2D apareceu
            // dentro do livro 3D que estava aberto.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 flex items-center justify-center overflow-y-auto py-12"
          >
            <div className="w-full">
              <BookOpenView
                book={book}
                onClose={onClose}
                useVintageCover
                embedded
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Scene({
  bookId,
  title,
  phase,
  openProgress,
  originRect,
}: {
  bookId: string;
  title: string;
  phase: "cover" | "opening" | "open";
  openProgress: number;
  originRect: DOMRect;
}) {
  return (
    <>
      {/* Iluminação warm vintage: ambient quente + directional principal +
          point dourado no canto superior esquerdo. */}
      <ambientLight intensity={0.65} color="#FFE8B0" />
      <directionalLight
        position={[3, 5, 5]}
        intensity={0.9}
        color="#FFFFFF"
        castShadow
      />
      <pointLight
        position={[-3, 2, 4]}
        intensity={0.55}
        color="#FFB347"
        distance={14}
      />

      <AnimatedBook
        bookId={bookId}
        title={title}
        phase={phase}
        openProgress={openProgress}
        originRect={originRect}
        visible={phase !== "open"}
      />

      {/* Sombra projetada do livro no plano abaixo. */}
      <ContactShadows
        position={[0, -BOOK_H / 2 - 0.6, 0]}
        opacity={0.45}
        scale={8}
        blur={2.5}
        far={4}
        color="#000000"
      />
    </>
  );
}

type AnimState = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
};

const START_Z = -3.5; // plano "fundo" da estante; livro emerge daqui pro z=0

function AnimatedBook({
  bookId,
  title,
  phase,
  openProgress,
  originRect,
  visible = true,
}: {
  bookId: string;
  title: string;
  phase: "cover" | "opening" | "open";
  openProgress: number;
  originRect: DOMRect;
  visible?: boolean;
}) {
  const { camera, size } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const animFrom = useRef<AnimState>({
    x: 0,
    y: 0,
    z: 0,
    rotY: -Math.PI / 2,
    scale: 1,
  });
  const animTo = useRef<AnimState>({
    x: 0,
    y: 0,
    z: 0,
    rotY: -Math.PI / 2,
    scale: 1,
  });
  // Sessão 17.11: tempo acumulado via delta do useFrame em vez de
  // performance.now(). Motivo: na PRIMEIRA abertura o Canvas WebGL leva
  // várias centenas de ms pra inicializar — se usássemos timestamp
  // absoluto, o gap entre `animStart = performance.now()` no useEffect e
  // o primeiro useFrame faria `elapsed > animDuration` já no frame 1,
  // pulando toda a animação. Delta só conta tempo entre frames de fato.
  const animElapsed = useRef(0);
  const animDuration = 1.4; // 1.4s — tempo confortável pra perceber o trajeto
  const animDone = useRef(true);

  // Posição inicial em world coords: raio da câmera passando pelo centro
  // do DOMRect, intersectando o plano z = START_Z. Resultado: livro nasce
  // EXATAMENTE no ponto da estante onde a lombada estava (perspectiva
  // garante que esse ponto de partida casa pixel-a-pixel).
  const startPos = useMemo(() => {
    const cx = originRect.left + originRect.width / 2;
    const cy = originRect.top + originRect.height / 2;
    const ndcX = (cx / size.width) * 2 - 1;
    const ndcY = -(cy / size.height) * 2 + 1;
    const v = new THREE.Vector3(ndcX, ndcY, 0.5);
    v.unproject(camera);
    const direction = v.sub(camera.position).normalize();
    const t = (START_Z - camera.position.z) / direction.z;
    return camera.position.clone().add(direction.multiplyScalar(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originRect, size.width, size.height]);

  // Escala inicial: o livro nasce com o mesmo tamanho aparente da lombada
  // DOM clicada. Como a câmera está em z=12 e startPos em z=-3.5 (distância
  // 15.5), calculo qual escala 3D faz BOOK_H ocupar o mesmo % vertical que
  // originRect.height ocupa do viewport. Escala final é 1 (tamanho cheio).
  const startScale = useMemo(() => {
    const distance = camera.position.z - START_Z;
    const fovRad =
      ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const visibleHeight = 2 * distance * Math.tan(fovRad / 2);
    const heightFraction = originRect.height / window.innerHeight;
    const desiredWorldHeight = heightFraction * visibleHeight;
    return Math.max(0.18, Math.min(1, desiredWorldHeight / BOOK_H));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originRect, camera]);

  useEffect(() => {
    animFrom.current = {
      x: startPos.x,
      y: startPos.y,
      z: startPos.z,
      rotY: -Math.PI / 2,
      scale: startScale,
    };
    animTo.current = animFrom.current;
    animDone.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!groupRef.current) return;
    animFrom.current = {
      x: groupRef.current.position.x,
      y: groupRef.current.position.y,
      z: groupRef.current.position.z,
      rotY: groupRef.current.rotation.y,
      scale: groupRef.current.scale.x,
    };
    // Sem fase "spine" — sempre anima pra (0,0,0). O ponto de partida
    // (lombada na estante) é capturado em animFrom direto do estado atual
    // do groupRef (que renderizou a 1 frame atrás no startPos).
    animTo.current = {
      x: 0,
      y: 0,
      z: 0,
      rotY: 0,
      scale: 1,
    };
    animElapsed.current = 0;
    animDone.current = false;
  }, [phase, startPos, startScale]);

  useFrame((_, delta) => {
    if (!groupRef.current || animDone.current) return;
    animElapsed.current += delta;
    const t = Math.min(1, animElapsed.current / animDuration);
    const eased = 1 - Math.pow(1 - t, 3);

    const f = animFrom.current;
    const o = animTo.current;
    groupRef.current.position.x = f.x + (o.x - f.x) * eased;
    groupRef.current.position.y = f.y + (o.y - f.y) * eased;
    groupRef.current.position.z = f.z + (o.z - f.z) * eased;
    groupRef.current.rotation.y = f.rotY + (o.rotY - f.rotY) * eased;
    const s = f.scale + (o.scale - f.scale) * eased;
    groupRef.current.scale.set(s, s, s);

    if (t >= 1) {
      groupRef.current.position.set(o.x, o.y, o.z);
      groupRef.current.rotation.y = o.rotY;
      groupRef.current.scale.set(o.scale, o.scale, o.scale);
      animDone.current = true;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[startPos.x, startPos.y, startPos.z]}
      rotation={[0, -Math.PI / 2, 0]}
      scale={[startScale, startScale, startScale]}
      visible={visible}
    >
      <Float
        enabled={phase === "cover"}
        speed={1.8}
        rotationIntensity={0.5}
        floatIntensity={1.2}
        floatingRange={[-0.18, 0.18]}
      >
        <Book bookId={bookId} title={title} openProgress={openProgress} />
      </Float>
    </group>
  );
}

function Book({
  bookId,
  title,
  openProgress = 0,
}: {
  bookId: string;
  title: string;
  /** 0 = capa fechada; 1 = capa totalmente aberta (-π/180°), formando
   *  spread completo. A capa flipa pra esquerda virando "página esquerda"
   *  e o box translada pra direita, mantendo o spread centrado em x=0. */
  openProgress?: number;
}) {
  const hex = spineHexForBookId(bookId);
  const darker = useMemo(() => darkenHex(hex, 35), [hex]);

  // Capa abre 0 → -π (180°) — a capa flipa completamente, BACK plane vira
  // a "página esquerda".
  const coverHingeAngle = -openProgress * Math.PI;
  // Hinge se desloca da lombada original (-W/2) pro centro (0) conforme abre,
  // mantendo o spread centrado em x=0 quando totalmente aberto.
  const hingeX = -BOOK_W / 2 * (1 - openProgress);
  // Box (que vira a "página direita") translada da origem pra +W/2.
  const boxOffsetX = (BOOK_W / 2) * openProgress;

  return (
    <group>
      {/* Corpo do livro + spine decoration — translada com o open progress. */}
      <group position={[boxOffsetX, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[BOOK_W, BOOK_H, BOOK_D]} />
          <meshStandardMaterial attach="material-0" color={PAGE} roughness={0.85} />
          <meshStandardMaterial
            attach="material-1"
            color={darker}
            roughness={0.55}
            metalness={0.05}
          />
          <meshStandardMaterial attach="material-2" color={PAGE} roughness={0.85} />
          <meshStandardMaterial
            attach="material-3"
            color={PAGE_DARK}
            roughness={0.85}
          />
          {/* +Z front — PAGE color: vira "página direita" quando aberto */}
          <meshStandardMaterial
            attach="material-4"
            color={PAGE}
            roughness={0.85}
          />
          <meshStandardMaterial
            attach="material-5"
            color={hex}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>
        <SpineDecoration title={title} />
      </group>

      {/* Cover hinge group — pivot dinâmico em hingeX. Quando openProgress=0
          fica em -W/2 (lombada original); quando =1 fica em 0 (centro do
          spread). */}
      <group
        position={[hingeX, 0, BOOK_D / 2 + 0.001]}
        rotation={[0, coverHingeAngle, 0]}
      >
        {/* FRONT plane da capa (com decoração) — visível quando hinge ∈ [0, -π/2]. */}
        <mesh position={[BOOK_W / 2, 0, 0]}>
          <planeGeometry args={[BOOK_W, BOOK_H]} />
          <meshStandardMaterial
            color={hex}
            roughness={0.45}
            metalness={0.08}
            side={THREE.FrontSide}
          />
        </mesh>
        {/* BACK plane da capa (PAGE color) — visível quando hinge passa
            de -π/2 e a capa flipa pra esquerda; vira a "página esquerda". */}
        <mesh
          position={[BOOK_W / 2, 0, -0.001]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[BOOK_W, BOOK_H]} />
          <meshStandardMaterial
            color={PAGE}
            roughness={0.85}
            side={THREE.FrontSide}
          />
        </mesh>
        {/* Decoração da capa — sobre o front plane. Ela mesma usa FrontSide
            (default), então some por backface culling quando capa flipa. */}
        <group position={[BOOK_W / 2, 0, 0.002]}>
          <CoverDecoration title={title} />
        </group>
      </group>
    </group>
  );
}

/**
 * Decoração da capa frontal: 4 frames dourados (moldura concêntrica) +
 * 4 cantos com pequena rosácea + título 3D centralizado com outline.
 * Tudo positioned levemente à frente da face (z = BOOK_D/2 + small) pra
 * evitar z-fighting com o material da capa.
 */
function CoverDecoration({ title }: { title: string }) {
  // Sessão 17.10: agora a CoverDecoration vive DENTRO do hinge group da
  // capa (que já está em z = BOOK_D/2 + 0.001). Por isso z relativo aqui
  // é só um pequeno offset positivo pra ficar à frente do plano da capa.
  const z = 0.002;
  const goldMat = (
    <meshStandardMaterial
      color={GOLD}
      metalness={0.55}
      roughness={0.32}
      emissive={GOLD}
      emissiveIntensity={0.05}
    />
  );

  return (
    <group position={[0, 0, z]}>
      {/* === Moldura externa (4 lados como planes finos) === */}
      <FrameRect
        width={BOOK_W * 0.92}
        height={BOOK_H * 0.94}
        thickness={0.025}
      />
      {/* Moldura interna (mais grossa) */}
      <FrameRect
        width={BOOK_W * 0.84}
        height={BOOK_H * 0.88}
        thickness={0.04}
        offset={0.001}
      />
      {/* Filete interno (fininho) */}
      <FrameRect
        width={BOOK_W * 0.78}
        height={BOOK_H * 0.82}
        thickness={0.018}
        offset={0.002}
      />

      {/* === Cantos: 4 rosáceas pequenas === */}
      {[
        { x: -BOOK_W * 0.4, y: BOOK_H * 0.42 },
        { x: BOOK_W * 0.4, y: BOOK_H * 0.42 },
        { x: -BOOK_W * 0.4, y: -BOOK_H * 0.42 },
        { x: BOOK_W * 0.4, y: -BOOK_H * 0.42 },
      ].map(({ x, y }, i) => (
        <CornerOrnament key={i} x={x} y={y} />
      ))}

      {/* === Friso superior (linha dourada acima do título) === */}
      <mesh position={[0, BOOK_H * 0.18, 0.003]}>
        <planeGeometry args={[BOOK_W * 0.5, 0.02]} />
        {goldMat}
      </mesh>
      {/* Pingo central acima */}
      <mesh position={[0, BOOK_H * 0.18, 0.005]}>
        <circleGeometry args={[0.05, 16]} />
        {goldMat}
      </mesh>

      {/* === Título 3D === */}
      <Text
        position={[0, 0, 0.012]}
        fontSize={0.22}
        color={IVORY}
        anchorX="center"
        anchorY="middle"
        maxWidth={BOOK_W * 0.7}
        textAlign="center"
        outlineWidth={0.012}
        outlineColor={INK}
        outlineOpacity={0.95}
        font={undefined}
        fontStyle="italic"
        fontWeight={600}
        lineHeight={1.15}
        letterSpacing={0.04}
      >
        {title}
      </Text>

      {/* === Friso inferior (linha dourada abaixo do título) === */}
      <mesh position={[0, -BOOK_H * 0.18, 0.003]}>
        <planeGeometry args={[BOOK_W * 0.5, 0.02]} />
        {goldMat}
      </mesh>
      <mesh position={[0, -BOOK_H * 0.18, 0.005]}>
        <circleGeometry args={[0.05, 16]} />
        {goldMat}
      </mesh>

      {/* === Emblema central inferior (rosácea) === */}
      <CenterEmblem y={-BOOK_H * 0.32} />
    </group>
  );
}

/** Moldura retangular feita de 4 planes finos (top + bottom + left + right). */
function FrameRect({
  width,
  height,
  thickness,
  offset = 0,
}: {
  width: number;
  height: number;
  thickness: number;
  offset?: number;
}) {
  const goldMat = (
    <meshStandardMaterial
      color={GOLD_LIGHT}
      metalness={0.55}
      roughness={0.32}
      emissive={GOLD}
      emissiveIntensity={0.06}
    />
  );
  const z = offset;
  return (
    <group position={[0, 0, z]}>
      {/* Top */}
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[width, thickness]} />
        {goldMat}
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -height / 2, 0]}>
        <planeGeometry args={[width, thickness]} />
        {goldMat}
      </mesh>
      {/* Left */}
      <mesh position={[-width / 2, 0, 0]}>
        <planeGeometry args={[thickness, height]} />
        {goldMat}
      </mesh>
      {/* Right */}
      <mesh position={[width / 2, 0, 0]}>
        <planeGeometry args={[thickness, height]} />
        {goldMat}
      </mesh>
    </group>
  );
}

/** Pequena rosácea no canto: anel + miolo + 4 raios pétalas. */
function CornerOrnament({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0.005]}>
      {/* 4 pétalas (planes elípticas como mini-rects rotacionados) */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.05, Math.sin(angle) * 0.05, 0]}
            rotation={[0, 0, angle]}
          >
            <planeGeometry args={[0.05, 0.022]} />
            <meshStandardMaterial
              color={GOLD}
              metalness={0.55}
              roughness={0.3}
            />
          </mesh>
        );
      })}
      {/* Miolo */}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.038, 18]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[0.022, 18]} />
        <meshStandardMaterial
          color={GOLD_LIGHT}
          metalness={0.6}
          roughness={0.3}
          emissive={GOLD}
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}

/** Emblema central inferior: rosácea de 8 pétalas. */
function CenterEmblem({ y }: { y: number }) {
  return (
    <group position={[0, y, 0.005]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i * Math.PI) / 4;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.07, Math.sin(angle) * 0.07, 0]}
            rotation={[0, 0, angle]}
          >
            <planeGeometry args={[0.07, 0.03]} />
            <meshStandardMaterial
              color={GOLD}
              metalness={0.55}
              roughness={0.32}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.05, 18]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[0.03, 18]} />
        <meshStandardMaterial
          color={GOLD_LIGHT}
          metalness={0.6}
          roughness={0.3}
          emissive={GOLD}
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}

/** Decoração da lombada: 5 nervuras horizontais douradas + título vertical. */
function SpineDecoration({ title }: { title: string }) {
  const x = -BOOK_W / 2 - 0.005; // ligeiramente à frente da face -X
  const goldMat = (
    <meshStandardMaterial
      color={GOLD_LIGHT}
      metalness={0.55}
      roughness={0.32}
      emissive={GOLD}
      emissiveIntensity={0.05}
    />
  );

  return (
    <group position={[x, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {/* 4 nervuras horizontais (raised bands) */}
      {[0.36, 0.18, -0.18, -0.36].map((yPercent, i) => (
        <mesh key={i} position={[0, BOOK_H * yPercent, 0]}>
          <planeGeometry args={[BOOK_D * 0.85, 0.045]} />
          {goldMat}
        </mesh>
      ))}
      {/* Frisos próximos das pontas */}
      <mesh position={[0, BOOK_H * 0.45, 0]}>
        <planeGeometry args={[BOOK_D * 0.8, 0.012]} />
        {goldMat}
      </mesh>
      <mesh position={[0, -BOOK_H * 0.45, 0]}>
        <planeGeometry args={[BOOK_D * 0.8, 0.012]} />
        {goldMat}
      </mesh>

      {/* Título da lombada — vertical (rotateZ -90°), centralizado em painel
          entre as duas raised bands centrais (-0.18 e 0.18). */}
      <Text
        position={[0, 0, 0.001]}
        rotation={[0, 0, -Math.PI / 2]}
        fontSize={0.11}
        color={IVORY}
        anchorX="center"
        anchorY="middle"
        maxWidth={BOOK_H * 0.32}
        textAlign="center"
        outlineWidth={0.006}
        outlineColor={INK}
        outlineOpacity={0.95}
        fontStyle="italic"
        fontWeight={600}
        letterSpacing={0.04}
      >
        {title}
      </Text>
    </group>
  );
}

function darkenHex(hex: string, percent: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const f = 1 - percent / 100;
  return `#${[r, g, b]
    .map((c) => Math.max(0, Math.round(c * f)).toString(16).padStart(2, "0"))
    .join("")}`;
}
