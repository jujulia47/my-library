/**
 * Decorações da prateleira (sessões 17.4, ampliadas na 17.8).
 *
 * 11 variantes: 6 originais + 5 novas (planta, globo, quadro, busto, vaso).
 * Cada uma é um SVG inline com escala bumped pra ~1.8-2x do 17.4 — detalhes
 * mais visíveis na parede vintage.
 *
 * Distribuição agora é decidida pelo `getShelfLayout` em `utils/shelfLayout`,
 * não mais por `buildShelfLayout` (legacy). Esse módulo só exporta render.
 */
import { Vela } from "./Vela";
import { Lamparina } from "./Lamparina";
import { MaquinaEscrever } from "./MaquinaEscrever";
import { Bau } from "./Bau";
import { PilhaLivros } from "./PilhaLivros";
import { LivroDeitado } from "./LivroDeitado";
import { Planta } from "./Planta";
import { Globo } from "./Globo";
import { Quadro } from "./Quadro";
import { Busto } from "./Busto";
import { Vaso } from "./Vaso";

export type DecorType =
  | "vela"
  | "lamparina"
  | "maquina"
  | "bau"
  | "pilha"
  | "livro_deitado"
  | "planta"
  | "globo"
  | "quadro"
  | "busto"
  | "vaso";

/**
 * Renderiza uma decoração. `seed` é usado pra cor determinística em variantes
 * com aleatorização interna (livro deitado decorativo, quadro).
 */
export function renderDecoration(decor: DecorType, seed: string) {
  switch (decor) {
    case "vela":
      return <Vela />;
    case "lamparina":
      return <Lamparina />;
    case "maquina":
      return <MaquinaEscrever />;
    case "bau":
      return <Bau />;
    case "pilha":
      return <PilhaLivros />;
    case "livro_deitado":
      return <LivroDeitado seed={seed} />;
    case "planta":
      return <Planta />;
    case "globo":
      return <Globo />;
    case "quadro":
      return <Quadro seed={seed} />;
    case "busto":
      return <Busto />;
    case "vaso":
      return <Vaso />;
  }
}

export {
  Vela,
  Lamparina,
  MaquinaEscrever,
  Bau,
  PilhaLivros,
  LivroDeitado,
  Planta,
  Globo,
  Quadro,
  Busto,
  Vaso,
};
