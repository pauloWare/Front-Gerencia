import React from "react";
import { cn } from "../../lib/utils";
import { AlertCircle } from "lucide-react";
import PropTypes from "prop-types";

/**/
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
FormField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  htmlFor: PropTypes.string,
  children: PropTypes.node,
};

export { FormField };
