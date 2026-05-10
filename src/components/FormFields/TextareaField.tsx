"use client";

import { Textarea } from "@/components/ui";
import type { TextareaFieldProps } from "@/utils/typings/formFields";

const TextareaField = ({
  label,
  className,
  ...props
}: TextareaFieldProps) => {
  return <Textarea label={label} className={className} {...props} />;
};

export default TextareaField;
