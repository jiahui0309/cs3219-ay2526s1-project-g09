import React from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => (
  <div className="flex flex-col gap-2">
    <label className="font-semibold">{label}</label>
    {children}
    {error && <span className="text-red-400 text-sm">{error}</span>}
  </div>
);

export default FormField;
