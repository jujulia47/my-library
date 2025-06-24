"use client";

// import { useState, useEffect } from "react";
import clsx from "clsx";
import { InputFieldProps } from "@/utils/typings/formFields";

const InputField = ({ 
  label, 
  className, 
  // defaultValue,
  // onChange,
  ...props 
}: InputFieldProps) => {

  // const [value, setValue] = useState(defaultValue || "");

  // useEffect(() => {
  //   setValue(defaultValue || "");
  // }, [defaultValue])

  return (
    <section className="space-y-2">
      <label htmlFor={props.id || props.name} className="block text-sm font-medium text-[#5A3522] mb-1 ml-1">
        {label}
      </label>

      <input
        {...props}
        className={clsx(
          `w-full px-4 py-3 rounded-lg 
            bg-[#F5F1E9] 
            border border-[#AE9372]/50
            shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]
            focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]
            focus:outline-none
            transition-all duration-200 
            text-[#5A3522] placeholder-[#AE9372]/70`,
          props.disabled && "opacity-70 cursor-not-allowed",
          className
        )}
        // onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        //   setValue(e.target.value);
        //   onChange?.(e);
        // }}
      />
    </section>
  );
};

export default InputField;


