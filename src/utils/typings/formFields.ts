export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement>{
  label: string;
}

export interface SelectFieldOptions {
  value: string | number;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement>{
  label: string;
  options: SelectFieldOptions[]
}

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}


export interface ToggleFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

export interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}
