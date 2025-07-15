"use client";

import ReturnBtn from "../ReturnBtn";
import { Database } from "@/utils/typings/supabase";

type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];

// tipo para book com o relacionamento serie carregado
type BookWithSerie = Book & {
  serie: Serie | null;
};

interface DetailsBookProps {
  book: BookWithSerie[];
}

const DetailsBookPage = ({ book }: DetailsBookProps) => {
    return (
        <section className="min-h-screen bg-[#E1D9C9] py-12 px-4 sm:px-6 lg:px-8 font-serif">
            <ReturnBtn href="/book" btnText="Voltar" />
            <h1>{book?.[0].title ?? "Livro não encontrado"}</h1>
            <h1>{book?.[0].author ?? "Autor não encontrado"}</h1>
            <h1>{book?.[0].cover ?? "Capa não encontrada"}</h1>
            <h1>{book[0].serie_id ?? "Série não encontrada"}</h1>
            <h1>{book[0].serie?.serie_name ?? "Série não encontrada"}</h1>
            <h1>{book?.[0].volume ?? "Volume não encontrado"}</h1>
            <h1>{book?.[0].category ?? "Categoria não encontrada"}</h1>
            <h1>{book?.[0].pages ?? "Páginas não encontradas"}</h1>
            <h1>{book?.[0].language ?? "Idioma não encontrado"}</h1>
            <h1>{book?.[0].library ?? "Biblioteca não encontrada"}</h1>
            <h1>{book?.[0].acquisition_date ?? "Data de aquisição não encontrada"}</h1>
            <h1>{book?.[0].status ?? "Status não encontrado"}</h1>
            <h1>{book?.[0].init_date ?? "Data de início não encontrada"}</h1>
            <h1>{book?.[0].finish_date ?? "Data de término não encontrada"}</h1>
            <h1>{book?.[0].current_page ?? "Página atual não encontrada"}</h1>
            <h1>{book?.[0].rating ?? "Avaliação não encontrada"}</h1>
            <h1>{book?.[0].version ?? "Versão não encontrada"}</h1>
            <h1>{book?.[0].comments ?? "Comentários não encontrados"}</h1>
        </section>
    );
};

export default DetailsBookPage;