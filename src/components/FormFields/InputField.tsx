"use client";

import { Input } from "@/components/ui";
import type { InputFieldProps } from "@/utils/typings/formFields";

const InputField = ({ label, className, ...props }: InputFieldProps) => {
  return <Input label={label} className={className} {...props} />;
};

export default InputField;
