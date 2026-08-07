// Som ambiente SINTETIZADO via Web Audio — sem arquivos (CSP-safe). É um leito
// de ruído filtrado por cena, com leve modulação. Não é gravação real; a ideia
// é a "vibe", e dá pra trocar por áudios CC0 depois sem mexer no resto.

export type SceneKey = "cafe" | "rain" | "fire" | "library";

type AmbientPlayer = {
  start: (scene: SceneKey) => void;
  setMuted: (muted: boolean) => void;
  stop: () => void;
  dispose: () => void;
};

function makeNoise(ctx: AudioContext, seconds = 3): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    // ruído "marrom" (integrado) — mais grave/aveludado que branco puro.
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buf;
}

export function createAmbientPlayer(): AmbientPlayer {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let active: AudioNode[] = [];
  let crackle: ReturnType<typeof setInterval> | null = null;

  function ensure(): AudioContext {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  function teardown() {
    if (crackle) {
      clearInterval(crackle);
      crackle = null;
    }
    active.forEach((n) => {
      try {
        (n as OscillatorNode & AudioBufferSourceNode).stop?.();
      } catch {
        /* já parado */
      }
      try {
        n.disconnect();
      } catch {
        /* já desconectado */
      }
    });
    active = [];
  }

  function start(scene: SceneKey) {
    const context = ensure();
    if (context.state === "suspended") void context.resume();
    teardown();

    const src = context.createBufferSource();
    src.buffer = makeNoise(context);
    src.loop = true;
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    if (scene === "rain") {
      filter.type = "bandpass";
      filter.frequency.value = 1500;
      filter.Q.value = 0.5;
      gain.gain.value = 0.22;
    } else if (scene === "fire") {
      filter.type = "lowpass";
      filter.frequency.value = 460;
      gain.gain.value = 0.16;
    } else if (scene === "cafe") {
      filter.type = "lowpass";
      filter.frequency.value = 820;
      gain.gain.value = 0.11;
    } else {
      // biblioteca: quase silêncio, um sopro agudo.
      filter.type = "highpass";
      filter.frequency.value = 2600;
      gain.gain.value = 0.05;
    }

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master!);
    src.start();
    active.push(src, filter, gain);

    // Modulação sutil de volume (movimento) na chuva e no fogo.
    if (scene === "rain" || scene === "fire") {
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.value = scene === "rain" ? 0.3 : 0.7;
      lfoGain.gain.value = scene === "rain" ? 0.06 : 0.07;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      active.push(lfo, lfoGain);
    }

    // Estalos da lareira: bursts curtos de ruído em intervalos aleatórios.
    if (scene === "fire") {
      crackle = setInterval(
        () => {
          if (!ctx) return;
          const b = ctx.createBufferSource();
          b.buffer = makeNoise(ctx, 0.12);
          const f = ctx.createBiquadFilter();
          f.type = "bandpass";
          f.frequency.value = 1200 + Math.random() * 1800;
          f.Q.value = 2;
          const g = ctx.createGain();
          g.gain.value = 0.0;
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
          b.connect(f);
          f.connect(g);
          g.connect(master!);
          b.start();
          b.stop(ctx.currentTime + 0.16);
        },
        220 + Math.random() * 260,
      );
    }

    master!.gain.cancelScheduledValues(context.currentTime);
    master!.gain.linearRampToValueAtTime(1, context.currentTime + 0.8);
  }

  function setMuted(muted: boolean) {
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(muted ? 0 : 1, ctx.currentTime + 0.25);
  }

  function stop() {
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    window.setTimeout(teardown, 500);
  }

  function dispose() {
    teardown();
    try {
      void ctx?.close();
    } catch {
      /* noop */
    }
    ctx = null;
    master = null;
  }

  return { start, setMuted, stop, dispose };
}
