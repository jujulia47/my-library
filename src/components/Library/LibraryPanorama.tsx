import { ShelfMini } from "./ShelfMini";
import { AddShelfButton } from "./AddShelfButton";
import type { Shelf } from "@/services/libraryData";

type Props = {
  shelves: Shelf[];
};

/**
 * Panorâmica das estantes — scroll horizontal. Cada estante 280px largura;
 * AddShelfButton no fim da fila. Pode ser server component porque o estado
 * (drag, hover) está nos filhos.
 */
export function LibraryPanorama({ shelves }: Props) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar">
      {shelves.map((shelf) => (
        <ShelfMini key={shelf.id} shelf={shelf} />
      ))}
      <AddShelfButton />
    </div>
  );
}
