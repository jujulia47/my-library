export function formateTitleToSlug(title: string) {
  return title
    .normalize("NFD")                     // separa os acentos das letras
    .replace(/[\u0300-\u036f]/g, "")     // remove os acentos
    .toLowerCase()
    .replace(/\s+/g, "-")                // troca espaços por hífen
    .replace(/[^\w\-]+/g, "")            // remove tudo que não for letra, número ou hífen
    .replace(/\-\-+/g, "-")              // troca múltiplos hífens por um único
    .replace(/^-+/, "")                  // remove hífens no começo
    .replace(/-+$/, "");                 // remove hífens no final
}
