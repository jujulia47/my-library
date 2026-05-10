import { Vela } from "@/components/Library/decorations/Vela";

/**
 * Rodapé final da home (sessão 17.10) — agora usa a mesma Vela da library
 * (cera com gradiente, chama em 3 camadas, prato de bronze, halo radial)
 * pra continuidade visual entre as duas páginas.
 */
export function HomeFooter() {
  return (
    <footer className="home-footer flex flex-col items-center gap-3 py-12 mt-2">
      <span style={{ opacity: 0.85 }}>
        <Vela width={56} />
      </span>
      <p className="font-display italic text-xs text-ink-fade">Boa leitura.</p>
    </footer>
  );
}
