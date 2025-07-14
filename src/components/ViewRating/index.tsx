const ViewRating = ({ data }: { data: any }) => {
  return (
    <section
      className="px-4 py-3 text-center whitespace-nowrap"
      style={{ fontSize: "15px" }}
    >
      {data.rating ? (
        <span
          className="flex items-center gap-0.5"
          aria-label={`Avaliação: ${data.rating} de 5`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill={i < Number(data.rating) ? "#B28B2B" : "none"}
              stroke="#B28B2B"
              strokeWidth="1.2"
              aria-hidden="true"
              style={{
                display: "inline",
                verticalAlign: "middle",
              }}
            >
              <polygon points="10,2 12.5,7.5 18.5,8 14,12 15.5,18 10,15 4.5,18 6,12 1.5,8 7.5,7.5" />
            </svg>
          ))}
        </span>
      ) : (
        <span className="text-[#B27D57]">-</span>
      )}
    </section>
  );
};

export default ViewRating;
