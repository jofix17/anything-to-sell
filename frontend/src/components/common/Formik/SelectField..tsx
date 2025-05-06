import { useField } from "formik";
import { FormFieldProps } from "./FormField";
import classNames from "classnames";

export const SelectField: React.FC<
  FormFieldProps & { options: { value: string; label: string }[] }
> = ({
  name,
  label,
  options,
  disabled = false,
  required = false,
  className = "",
}) => {
  const [field, meta] = useField(name);
  const hasError = meta.touched && meta.error;

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        {...field}
        id={name}
        disabled={disabled}
        className={classNames(
          "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          {
            "border-red-300 bg-red-50": hasError,
            "border-gray-300": !hasError,
            "bg-gray-100 cursor-not-allowed": disabled,
          },
          className
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <div className="mt-1 text-sm text-red-600">{meta.error}</div>
      )}
    </div>
  );
};
