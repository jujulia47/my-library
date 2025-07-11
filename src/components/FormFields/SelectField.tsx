"use client"

import { SelectFieldProps } from "@/utils/typings/formFields";
import clsx from "clsx";

const SelectField = ({ label, className, options, ...props }: SelectFieldProps) => {
  return (
    <section className="space-y-2">
      <label htmlFor={props.id || props.name} className="block text-[14px] font-medium text-[#5A3522] mb-1 ml-1">
        {label}
      </label>

      <div className="relative">
        <select
          {...props}
          className={clsx(
            `w-full px-4 py-3 pr-10 rounded-lg 
            bg-[#F5F1E9] 
            border border-[#AE9372]/50
            shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]
            focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]
            focus:outline-none
            transition-all duration-200 
            text-[#5A3522] placeholder-[#AE9372]/70
            appearance-none`,
            props.disabled && "opacity-70 cursor-not-allowed",
            className
          )}
        >
          <option value="">Escolha uma opção</option>
          {options?.map((option) => (
            <option 
              key={option?.value} 
              value={option?.value} 
              className="bg-[#F5F1E9] text-[#5A3522]"
            >
              {option?.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#5A3522]">
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default SelectField;
