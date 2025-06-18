"use client";

import updateBook from "@/actions/updateBook";
import { Database } from "@/utils/typings/supabase";
import { useState } from "react";

type Book = Database["public"]["Tables"]["book"]["Update"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];

type UpdateBookProps = {
  id: number;
  book: Book[];
  series: Serie[] | null;
};

const UpdateBook = ({ id, book, series }: UpdateBookProps) => {
  const [singleBook, setSingleBook] = useState<string>("");
  const [library, setLibrary] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  console.log("id", id);
  console.log("book", book);

  return book.length > 0 ? (
    <section>
      <form
        action={updateBook}
        className="flex flex-col justify-center items-center"
      >
        <input type="hidden" name="id" value={id} />
        <label htmlFor="title">Título do Livro</label>
        <input
          type="text"
          name="title"
          id=""
          className="border"
          required
          defaultValue={book[0]?.title}
        />

        <label htmlFor="author">Autor(a)</label>
        <input
          type="text"
          name="author"
          id=""
          className="border"
          required
          defaultValue={book[0]?.author}
        />

        <label htmlFor="cover">Capa</label>
        <input
          type="text"
          name="cover"
          id=""
          className="border"
          required
          defaultValue={book[0]?.cover}
        />

        <fieldset>
          <legend>Livro Único:</legend>
          <input
            type="radio"
            name="single_book"
            id="true"
            className="border"
            value="true"
            onChange={(e) => setSingleBook(e.target.value)}
          />
          <label htmlFor="true">Sim</label>
          <input
            type="radio"
            name="single_book"
            id="false"
            className="border"
            value="false"
            onChange={(e) => setSingleBook(e.target.value)}
          />
          <label htmlFor="false">Não</label>
        </fieldset>

        {/* Campo para adicionar a série */}

        <fieldset disabled={singleBook === "true"}>
          <legend>Serie</legend>
          {series?.length !== 0 && (
            <select name="serie_id" id="" defaultValue={book[0]?.serie_id ?? ""}>
              {series?.map((serieName) => {
                return (
                  <option key={serieName.id} value={serieName?.id}>
                    {serieName?.serie_name}
                  </option>
                );
              })}
            </select>
          )}
        </fieldset>

        <label htmlFor="volume">Volume</label>
        <input type="number" name="volume" id="" className="border" defaultValue={book[0]?.volume ?? ""}/>

        <label htmlFor="category">Categoria</label>
        <input type="text" name="category" id="" className="border" defaultValue={book[0]?.category ?? ""}/>

        <label htmlFor="pages">Quantidade de Páginas</label>
        <input type="number" name="pages" id="pages" className="border" defaultValue={book[0]?.pages ?? ""}/>

        <fieldset>
          <legend>Idioma</legend>
          <select name="language" id="" className="border" defaultValue={book[0]?.language ?? ""}>
            <option value="portugues">Português</option>
            <option value="english">Inglês</option>
            <option value="spanish">Espanhol</option>
          </select>
        </fieldset>

        <fieldset>
          <legend>Biblioteca</legend>
          <input
            type="radio"
            name="library"
            id="true"
            className="border"
            value="true"
            onChange={(e) => setLibrary(e.target.value)}
          />
          <label htmlFor="true">Sim</label>
          <input
            type="radio"
            name="library"
            id="false"
            className="border"
            value="false"
            onChange={(e) => setLibrary(e.target.value)}
          />
          <label htmlFor="false">Não</label>
        </fieldset>

        <fieldset disabled={library === "false"}>
          <label htmlFor="acquisition_date">Data que entrou pra coleção</label>
          <input type="date" name="acquisition_date" id="" className="border" defaultValue={book[0]?.acquisition_date ?? ""}/>
        </fieldset>

        <fieldset>
          <legend>Status da Leitura</legend>
          <select
            name="status"
            id=""
            className="border"
            onChange={(e) => setStatus(e.target.value)}
            defaultValue={book[0]?.status ?? ""}
          >
            <option value="tbr">TBR</option>
            <option value="reading">Lendo</option>
            <option value="finish">Finalizado</option>
            <option value="abandoned">Abandonado</option>
          </select>
        </fieldset>

        <label htmlFor="init_date">Data de Início da Leitura</label>
        <input
          type="date"
          name="init_date"
          id=""
          className="border"
          disabled={status === "tbr"}
          defaultValue={book[0]?.init_date ?? ""}
        />

        <label htmlFor="finish_date">Data finalização da Leitura</label>
        <input
          type="date"
          name="finish_date"
          id=""
          className="border"
          disabled={status === "reading" || status === "tbr"}
          defaultValue={book[0]?.finish_date ?? ""}
        />

        <label htmlFor="current_page">Página Atual</label>
        <input
          type="number"
          name="current_page"
          id=""
          className="border"
          disabled={status !== "reading"}
          defaultValue={book[0]?.current_page ?? ""}
        />

        <label htmlFor="rating">Avaliação</label>
        <input
          type="number"
          name="rating"
          id=""
          className="border"
          disabled={status !== "finish"}
          defaultValue={book[0]?.rating ?? ""}
        />

        <fieldset>
          <legend>Versão do Livro</legend>
          <input
            type="checkbox"
            name="physical"
            id="physical"
            className="border"
            value={"physical"}
          />
          <label htmlFor="physical">Físico</label>
          <input
            type="checkbox"
            name="audiobook"
            id="audiobook"
            className="border"
            value={"audiobook"}
          />
          <label htmlFor="audiobook">Audiobook</label>
          <input
            type="checkbox"
            name="ebook"
            id="ebook"
            className="border"
            value={"ebook"}
          />
          <label htmlFor="ebook">E-book</label>
        </fieldset>

        <label htmlFor="comments">Comentários</label>
        <textarea name="comments" id="" className="border" defaultValue={book[0]?.comments ?? ""}/>

        <button type="submit">Update</button>
      </form>
    </section>
  ) : (
    <div>Nada aqui</div>
  );
};

export default UpdateBook;
