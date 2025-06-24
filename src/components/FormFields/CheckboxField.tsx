"use client";

import { CheckboxFieldProps } from "@/utils/typings/formFields";
import clsx from "clsx";

export const CheckboxField = ({
  label,
  className,
  ...props
}: CheckboxFieldProps) => {
  return (
    <label
      className={clsx(
        "relative flex items-center space-x-3 cursor-pointer select-none",
        className
      )}
    >
      <input type="checkbox" className="sr-only peer" {...props} />

      <div
        className={clsx(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
          "bg-[#F5F1E9] border border-[#AE9372]/50",
          "shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]",
          "peer-checked:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
        )}
      />

      <div
        className="absolute w-2.5 h-2.5 rounded-full bg-[#7F4B30] scale-0 peer-checked:scale-100 transition-transform duration-200"
        style={{left: '6%'}}
      />

      <span className="text-sm font-medium text-[#5A3522]">{label}</span>
    </label>

  );
};

export default CheckboxField;
