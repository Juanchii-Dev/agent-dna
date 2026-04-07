type InputFieldProps = {
  error?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function InputField({ error, label, onChange, value }: InputFieldProps) {
  return (
    <label className={error ? "inputBlock hasError" : "inputBlock"}>
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} type="text" value={value} />
      {error ? <small className="inputError">{error}</small> : null}
    </label>
  );
}
