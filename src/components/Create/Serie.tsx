"use client";

import createSerie from "@/actions/createSerie";
import { useState } from "react";

export default function CreateSerie() {
  const [ status, setStatus ] = useState<string>("")
  return (
    <section>
      <form
        action={createSerie}
        className="flex flex-col justify-center items-center"
      >
        <label htmlFor="">Nome da Série</label>
        <input type="text" name="serie_name" id="" className="border" />

        <label htmlFor="">Quantidade de volumes:</label>
        <input type="number" name="qty_volume" id="" className="border" />

        <fieldset>
          <legend>Coleção Completa:</legend>
          <input type="radio" name="collection_complete" id="" value="true" />
          <label htmlFor="">Sim</label>
          <input type="radio" name="collection_complete" id="" value="false" />
          <label htmlFor="">Não</label>
        </fieldset>

        <fieldset>
          <legend>Status</legend>
          <select name="status" id="" className="border" 
            onChange={(e) => setStatus(e.target.value)}
            >
            <option value="tbr">TBR</option>
            <option value="reading">Lendo</option>
            <option value="finish">Finalizado</option>
            <option value="abandoned">Abandonado</option>
          </select>
        </fieldset>

        <label htmlFor="">Data Início da Leitura</label>
        <input type="date" name="init_date" id="" className="border" disabled={status === "tbr"}/>

        <label htmlFor="">Data Fim da Leitura</label>
        <input type="date" name="finish_date" id="" className="border" disabled={status === "tbr" || status === "reading"}/>

        <label htmlFor="">Avaliação</label>
        <input type="number" name="rating" id="" className="border" disabled={status !== "finish"}/>

        <button type="submit" className="border">
          Send
        </button>
      </form>
    </section>
  );
}
