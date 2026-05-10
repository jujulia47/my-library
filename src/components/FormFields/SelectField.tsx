"use client";

import { Select } from "@/components/ui";
import type { SelectFieldProps } from "@/utils/typings/formFields";

const SelectField = ({
  label,
  className,
  options,
  ...props
}: SelectFieldProps) => {
  // Legacy SelectFieldOptions usa value: string|number; novo Select aceita só string.
  const normalizedOptions = options?.map((o) => ({
    value: String(o.value),
    label: o.label,
  }));
  return (
    <Select
      label={label}
      className={className}
      options={normalizedOptions}
      {...props}
    />
  );
};

export default SelectField;
