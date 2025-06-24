"use client";

import { ToggleFieldProps } from "@/utils/typings/formFields";
import clsx from "clsx";

export const ToggleSwitch = ({ label, className, ...props }: ToggleFieldProps) => {
  const isChecked = Boolean(props.checked);

  return (
    <section className={clsx("flex items-center", className)}>
      <input
        type="checkbox"
        id={props.id}
        className="sr-only peer"
        {...props}
      />
      <label
        htmlFor={props.id}
        className={clsx(
          "relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-200 cursor-pointer",
          isChecked
            ? "bg-gradient-to-br from-[#7F4B30] to-[#B27D57] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]"
            : "bg-gradient-to-br from-gray-200 to-gray-300 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.8)]"
        )}
      >
        <span
          className={clsx(
            "absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md",
            isChecked ? "translate-x-7 shadow-[1px_1px_3px_rgba(0,0,0,0.3)]" : "translate-x-1 shadow-[1px_1px_3px_rgba(0,0,0,0.2)]"
          )}
        />
      </label>
      <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
    </section>
  );
};

export default ToggleSwitch;
