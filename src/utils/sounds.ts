// Sons rituais da app — sintetizados via Web Audio API pra não depender de
// asset binário/rede. Cada som é uma combinação curta de ondas senoidais com
// envelope ADSR simples (attack + exponential decay).
//
// Mute persistente em localStorage. UI controla via toggleSoundMuted /
// isSoundMuted; componentes que tocam som chamam `playFinishChime` etc.
// diretamente — eles próprios checam a flag.

const MUTE_KEY = "mylib_sound_muted";

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (muted) window.localStorage.setItem(MUTE_KEY, "1");
    else window.localStorage.removeItem(MUTE_KEY);
    // Notifica outros tabs/instâncias do toggle.
    window.dispatchEvent(new Event("mylib:sound-muted-changed"));
  } catch {
    // best-effort
  }
}

type AudioContextLike = AudioContext & { close: () => Promise<void> };

function getAudioContext(): AudioContextLike | null {
  if (typeof window === "undefined") return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor() as AudioContextLike;
  } catch {
    return null;
  }
}

/**
 * Chime de "leitura encerrada" — três notas senoidais em escala maior (C5,
 * E5, G5) com decaimento exponencial. Duração total ~700ms.
 */
export function playFinishChime(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes: { freq: number; offset: number; volume: number }[] = [
    { freq: 523.25, offset: 0, volume: 0.16 }, // C5
    { freq: 659.25, offset: 0.07, volume: 0.13 }, // E5
    { freq: 783.99, offset: 0.14, volume: 0.11 }, // G5
  ];

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    const start = now + note.offset;
    const duration = 0.6;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(note.volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }

  // Libera recursos quando o som termina.
  window.setTimeout(() => {
    void ctx.close();
  }, 1000);
}

/**
 * Page turn — ruído branco com bandpass em ~3 kHz, envelope curto.
 * Simula o farfalhar de página virando. Tocado ao salvar progresso de
 * leitura (anotar páginas + nota do dia).
 */
export function playPageTurn(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.22;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  filter.Q.value = 1.4;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);

  window.setTimeout(() => void ctx.close(), 400);
}

/**
 * Quill scratch — ruído filtrado em frequência alta com leve modulação,
 * simulando caneta riscando papel. Tocado ao salvar citação ou anotação
 * solta. Mais agudo e curto que o page turn.
 */
export function playQuillScratch(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.28;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    // Modulação leve pra dar caráter "riscado" em vez de chiado uniforme.
    const flutter = 1 + Math.sin(i * 0.006) * 0.35;
    data[i] = (Math.random() * 2 - 1) * flutter;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 4800;
  filter.Q.value = 2.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);

  window.setTimeout(() => void ctx.close(), 500);
}

/**
 * Stamp — combinação de uma senoide grave em queda rápida (~150→80 Hz) com
 * um "click" agudo (triangle wave 2.5 kHz, 30ms). Simula carimbo de livro
 * catalogado. Tocado ao cadastrar livro novo.
 */
export function playStamp(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Thump grave — corpo do impacto.
  const thump = ctx.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(150, now);
  thump.frequency.exponentialRampToValueAtTime(70, now + 0.1);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0, now);
  thumpGain.gain.linearRampToValueAtTime(0.28, now + 0.005);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  thump.connect(thumpGain).connect(ctx.destination);
  thump.start(now);
  thump.stop(now + 0.15);

  // Click agudo — superfície do carimbo batendo.
  const click = ctx.createOscillator();
  click.type = "triangle";
  click.frequency.value = 2500;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0, now);
  clickGain.gain.linearRampToValueAtTime(0.08, now + 0.002);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  click.connect(clickGain).connect(ctx.destination);
  click.start(now);
  click.stop(now + 0.04);

  window.setTimeout(() => void ctx.close(), 400);
}
