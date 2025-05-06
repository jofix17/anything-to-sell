import { useField } from "formik";
import { FormFieldProps } from "./FormField";
import classNames from "classnames";

export const CheckboxField: React.FC<Omit<FormFieldProps, "type">> = ({
  name,
  label,
  disabled = false,
}) => {
  const [field, meta] = useField({ name, type: "checkbox" });
  const hasError = meta.touched && meta.error;

  return (
    <div className="mb-4 flex items-center">
      <input
        {...field}
        id={name}
        type="checkbox"
        disabled={disabled}
        className={classNames(
          "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded",
          {
            "cursor-not-allowed": disabled,
          }
        )}
      />
      <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
      {hasError && (
        <div className="ml-2 text-sm text-red-600">{meta.error}</div>
      )}
    </div>
  );
};
