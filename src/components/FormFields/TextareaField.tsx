"use client";

import clsx from "clsx";
import { TextareaFieldProps } from "@/utils/typings/formFields";

const TextareaField = ({ label, className, ...props }: TextareaFieldProps) => {
  return (
    <section className="space-y-2">
      <label
        htmlFor={props.id || props.name}
        className="block text-sm font-medium text-[#5A3522] mb-1 ml-1"
      >
        {label}
      </label>
      <textarea
        {...props}
        className={clsx(
          `w-full px-4 py-3 rounded-lg 
          bg-[#F5F1E9] 
          border border-[#AE9372]/50
          shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]
          focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]
          focus:outline-none
          transition-all duration-200 
          h-32
          text-[#5A3522] placeholder-[#AE9372]/70`,
          props.disabled && "opacity-70 cursor-not-allowed",
          className
        )}
      />
    </section>
  );
};

export default TextareaField;
