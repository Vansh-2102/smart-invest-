import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon, suffix, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={[
            'form-input',
            icon && 'pl-10',
            suffix && 'pr-16',
            error && 'form-input-error',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Input;

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <select
        className={[
          'form-input appearance-none cursor-pointer',
          error && 'form-input-error',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <textarea
        className={[
          'form-input resize-none',
          error && 'form-input-error',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
