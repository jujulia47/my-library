"use client";

import createBook from "@/actions/books";
import { Database } from "@/utils/typings/supabase";
import { useState } from "react";

type Serie = Database["public"]["Tables"]["serie"]["Row"];

type SerieProps = {
  series: Serie[] | null;
};

//passando props para esse componente ser client side e o SerieList que é server side fica onde recebe esse componente
//Precisa ser client side para conseguir validar os input conforme o usuário for clicando
const NewBook = ({ series }: SerieProps) => {
  const [singleBook, setSingleBook] = useState<string>("");
  const [library, setLibrary] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  return (
    <section>
      <form
        action={createBook}
        className="flex flex-col justify-center items-center"
      >
        <label htmlFor="title">Título do Livro</label>
        <input type="text" name="title" id="" className="border" required />

        <label htmlFor="author">Autor(a)</label>
        <input type="text" name="author" id="" className="border" required />

        <label htmlFor="cover">Capa</label>
        <input type="text" name="cover" id="" className="border" required />

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
            <select name="serie_id" id="">
              {series?.map((serieName) => {
                return (
                  <option key={serieName.id} value={serieName?.id}>
                    {serieName?.serie_name}
                  </option>
                );
              })}
            </select>
          )}
          <label htmlFor="">Adicionar nova Série</label>
          <input type="text" name="serie_name" className="border" />
        </fieldset>

        <label htmlFor="volume">Volume</label>
        <input type="number" name="volume" id="" className="border" />

        <label htmlFor="category">Categoria</label>
        <input type="text" name="category" id="" className="border" />

        <label htmlFor="pages">Quantidade de Páginas</label>
        <input type="number" name="pages" id="pages" className="border" />

        <fieldset>
          <legend>Idioma</legend>
          <select name="language" id="" className="border">
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
          <input type="date" name="acquisition_date" id="" className="border" />
        </fieldset>

        <fieldset>
          <legend>Status da Leitura</legend>
          <select
            name="status"
            id=""
            className="border"
            onChange={(e) => setStatus(e.target.value)}
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
        />

        <label htmlFor="finish_date">Data finalização da Leitura</label>
        <input
          type="date"
          name="finish_date"
          id=""
          className="border"
          disabled={status === "reading" || status === "tbr"}
        />

        <label htmlFor="current_page">Página Atual</label>
        <input
          type="number"
          name="current_page"
          id=""
          className="border"
          disabled={status !== "reading"}
        />

        <label htmlFor="rating">Avaliação</label>
        <input
          type="number"
          name="rating"
          id=""
          className="border"
          disabled={status !== "finish"}
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

        {/* campo para adicionar as citações */}
        <fieldset>
          <input type="text" name="quote" id="" className="border" />
          <input type="number" name="quote_page" id="" className="border" />
        </fieldset>

        <label htmlFor="comments">Comentários</label>
        <textarea name="comments" id="" className="border" />

        <button type="submit">Send</button>
      </form>
    </section>
  );
};

export default NewBook;
