import React from "react";

type Option = {
  value: string;
  label: string;
};

type MultiSelectWithTagsProps = {
  label: string;
  options: Option[];
  selected: Option[];
  onSelect: (option: Option) => void;
  onRemove: (option: Option) => void;
  name: string;
};

const MultiSelectWithTags: React.FC<MultiSelectWithTagsProps> = ({
  label,
  options,
  selected,
  onSelect,
  onRemove,
  name,
}) => {
  // Remove already selected from dropdown options
  const availableOptions = options.filter(
    (opt) => !selected?.some((sel) => sel.value === opt.value)
  );

  return (
    <div className="mb-4">
      <label className="block mb-2 text-[14px] font-medium text-[#7F4B30]">{label}</label>
      <select
        className="w-full border border-[#7F4B30] rounded-lg px-3 py-2 focus:ring-[#B27D57] focus:border-[#7F4B30] text-[#5A3522]"
        onChange={(e) => {
          const value = e.target.value;
          const opt = options.find((o) => o.value === value);
          if (opt) {
            onSelect(opt);
          }
          e.target.selectedIndex = 0; // reset select
        }}
        value=""
      >
        <option value="" disabled>
          Selecione...
        </option>
        {availableOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2 mt-2">
        {selected?.map((item) => (
          <span
            key={item.value}
            className="flex items-center bg-[#B27D57] text-[#E1D9C9] px-3 py-1 rounded-full text-sm shadow"
          >
            {item.label}
            <button
              type="button"
              className="ml-2 text-[#E1D9C9] hover:text-red-200 font-bold"
              onClick={() => onRemove(item)}
              aria-label={`Remover ${item.label}`}
            >
              ×
            </button>
            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={item.value} />
          </span>
        ))}
      </div>
    </div>
  );
};

export default MultiSelectWithTags;
