"use client";

import Link from "next/link";
import DeleteBtn from "../DeleteBtn";

const TableActions = ({
  data,
  message,
  action,
  route,
}: {
  data: any;
  message: string;
  action: (id: number) => Promise<void>;
  route: string;
}) => {
  return (
    <section className="px-4 py-3 whitespace-nowrap flex gap-3 items-center">
      {/* Editar */}
      <Link
        href={`/${route}/${data}`}
        className="p-1.5 rounded transition hover:bg-[#B27D57]/10"
        aria-label="Editar"
        title="Editar"
      >
        <svg
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#7F4B30"
          strokeWidth="1.8"
        >
          <path d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L11 15H9v-2z" />
          <path
            d="M19 19H5a2 2 0 01-2-2V5a2 2 0 012-2h7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      {/* Visualizar */}
      <Link
        href={`/${route}/view/${data}`}
        className="p-1.5 rounded transition hover:bg-[#7F4B30]/10"
        aria-label="Visualizar"
        title="Visualizar"
      >
        <svg
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#424C21"
          strokeWidth="1.8"
        >
          <path d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12 18 19.5 12 19.5 1.5 12 1.5 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
      {/* Excluir */}
      <DeleteBtn id={data} action={action} message={message} />
    </section>
  );
};

export default TableActions;
