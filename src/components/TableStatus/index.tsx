import clsx from "clsx";

const TableStatus = ({ data, dataName }: { data: any; dataName: string }) => {
  console.log(data, "data Status");
  return (
    <section className="px-4 py-3 whitespace-nowrap">
      {data.status === "reading" ? (
        <div className="relative inline-block group">
          <span
            className={clsx(
              "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif transition-transform duration-150 text-[#F3E2C7] cursor-pointer hover:scale-105",
              "bg-[#2B4A73]"
            )}
          >
            {data.status}
          </span>
          {/* Tooltip só aparece no hover */}
          <div className="absolute z-10 hidden group-hover:flex flex-col gap-2 bg-[#F6F3ED] border-l-4 border-[#B27D57] p-4 rounded shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-2 w-max transition-all duration-300">
            <div className="flex gap-3 items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3A29] font-serif">
                Início da leitura:
              </span>
              <span className="text-[13px] text-[#A05C41] font-normal font-serif">
                {data.init_date
                  ? new Date(data.init_date).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            {dataName === "serie" && (
              <div className="flex gap-3 items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3A29] font-serif">
                  Volume atual:
                </span>
                <span className="text-[13px] text-[#A05C41] font-normal font-serif">
                  {data.book?.title ?? "-"}
                </span>
              </div>
            )}
            {dataName === "book" && (
              <div className="flex gap-3 items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3A29] font-serif">
                  Página atual:
                </span>
                <span className="text-[13px] text-[#A05C41] font-normal font-serif">
                  {data.current_page ?? "-"}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <span
          className={clsx(
            "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7]",
            {
              "bg-[#D35230]": data.status === "finish",
              "bg-[#B28B2B]": data.status === "tbr",
              "bg-[#8B3737]": data.status === "abandoned",
            }
          )}
        >
          {data.status}
        </span>
      )}
    </section>
  );
};

export default TableStatus;
