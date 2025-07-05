interface ConfirmationPopUpProps {
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ConfirmationPopUp = ({ message, onConfirm, onCancel }: ConfirmationPopUpProps) => {
  return (
    <section className="fixed inset-0 bg-black/50 z-40">
      <section className="flex flex-col gap-4 p-4 bg-[#F3E2C7] rounded absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50">
        <h3 className="text-[14px] font-medium text-[#5A3522] mb-1 ml-1">{message}</h3>
        <article className="flex gap-2">
          <button type="button" className="px-4 py-2 bg-[#8B3737] text-[#F3E2C7] rounded font-bold" onClick={onCancel}>Não</button>
          <button
            type="button"
            className="px-4 py-2 border-2 border-[#6d8c3c] text-[#6d8c3c] rounded font-bold bg-transparent hover:bg-[#6d8c3c] hover:text-[#F3E2C7] transition-colors"
            onClick={onConfirm}
          >
            Sim
          </button>
        </article>
      </section>
    </section>
  );
};

export default ConfirmationPopUp;