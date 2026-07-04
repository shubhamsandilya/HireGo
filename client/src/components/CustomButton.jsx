const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const CustomButton = ({
  title,
  containerStyles,
  iconRight,
  type,
  onClick,
  isLoading = false,
  disabled = false,
}) => {
  const blocked = isLoading || disabled;

  return (
    <button
      onClick={onClick}
      type={type || "button"}
      disabled={blocked}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${containerStyles}`}
    >
      {isLoading && <Spinner />}
      {title}
      {iconRight && !isLoading && <span className="ml-2">{iconRight}</span>}
    </button>
  );
};

export default CustomButton;
