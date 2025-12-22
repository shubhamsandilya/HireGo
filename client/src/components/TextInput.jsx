const TextInput = ({
  type = "text",
  placeholder,
  styles = "",
  label,
  register,
  error,
}) => {
  return (
    <div className="flex flex-col mt-2">
      <label className="text-gray-600 text-sm mb-1">{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        {...register}  // ✅ RHF controls name + ref + value
        className={`rounded border border-gray-400 focus:outline-none
          focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          text-base px-4 py-2 ${styles}`}
        aria-invalid={error ? "true" : "false"}
      />

      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </div>
  );
};

export default TextInput;
