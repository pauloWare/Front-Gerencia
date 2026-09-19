import React from "react";
import { cn } from "../../lib/utils";
import { AlertCircle } from "lucide-react";

/**
 * Campo de formulário com label, indicação de obrigatoriedade e mensagem de erro.
 */
const FormField = React.forwardRef(
  ({ className, label, required, error, hint, htmlFor, children, ...props }, ref) => (
    <div ref={ref} className={cn("form-field", error && "form-field-error", className)} {...props}>
      {label && (
        <label className="form-label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="required-mark" aria-hidden="true">*</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error">
          <AlertCircle size={14} /> {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  )
);
FormField.displayName = "FormField";

export { FormField };
