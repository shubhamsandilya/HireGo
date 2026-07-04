const TextInput = ({
  type = "text",
  placeholder,
  styles = "",
  label,
  register,
  error,
  rightElement,
}) => {
  return (
    <div className="flex flex-col mt-2">
      {label && <label className="text-gray-600 text-sm mb-1">{label}</label>}

      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          {...register} // RHF controls name + ref + value
          className={`w-full rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-base px-4 py-2.5 transition-colors ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          } ${rightElement ? "pr-11" : ""} ${styles}`}
          aria-invalid={error ? "true" : "false"}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <span role="alert" className="text-xs text-red-500 mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default TextInput;
