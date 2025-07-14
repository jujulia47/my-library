"use client";

import clsx from "clsx";
import TableActions from "../TableActions";
import TableStatus from "../TableStatus";
import ViewRating from "../ViewRating";
import { Tables, Database } from "@/utils/typings/supabase";

type TableName = keyof Database["public"]["Tables"];

type ReadTableProps<T extends TableName> = {
  data: Tables<T>[];
  headers: string[];
  fields: (keyof Tables<T>)[];
  message: string;
  action: (id: number) => Promise<void>;
  route: string;
  dataName: string;
};

const ReadTable = <T extends TableName>({
  data,
  headers,
  fields,
  message,
  action,
  route,
  dataName,
}: ReadTableProps<T>) => {
  return (
    <table className="min-w-full text-base rounded-xl border border-[#A05C41] bg-[#F3E2C7]">
      <thead>
        <tr className="bg-[#C48A6A]">
          {headers.map((header, index) => (
            <th
              key={index}
              className={clsx(
                "px-4 py-3 text-left font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30]",
                {
                  "rounded-tl-xl": index === 0,
                  "rounded-tr-xl": index === headers.length - 1,
                }
              )}
              style={{ fontSize: "13px" }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((item, idx) => (
          <tr
            key={item.id ?? idx}
            className="border-b last:border-b-0"
            style={{
              borderColor: "#AE9372",
              background: idx % 2 === 0 ? "#fff" : "#F3E2C7",
            }}
          >
            {fields.map((field, i) => (
              <td
                key={i}
                className="px-4 py-3 text-[#173125] whitespace-nowrap font-medium max-w-3xs overflow-hidden text-ellipsis"
                style={{ fontSize: "15px" }}
              >
                {item[field] !== null && item[field] !== undefined ? String(item[field]) : "-"}
              </td>
            ))}
            {"status" in item && item.status ? (
              <td> 
                <TableStatus data={item} dataName={dataName} />
              </td>
            ) : <></>}

            {"rating" in item && item.rating ? (
              <td>
                <ViewRating data={item} />
              </td>
            ) : <></>}
            <td>
              <TableActions
                data={item.id}
                message={message}
                action={action}
                route={route}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ReadTable;
