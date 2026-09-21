import React from "react";
import { cn } from "../../lib/utils";
import { CalendarDays } from "lucide-react";
import PropTypes from "prop-types";

const DateInput = React.forwardRef(({ className, id, value, placeholder = "DD/MM/AAAA", disabled, ...props }, ref) => (
  <div className="input-icon-wrapper">
    <CalendarDays size={16} className="input-icon" aria-hidden="true" />
    <input
      ref={ref}
      id={id}
      type="date"
      value={value}
      disabled={disabled}
      className={cn("theme-input input-with-icon", className)}
      {...props}
    />
    {!value && !disabled && (
      <span className="input-placeholder-overlay" aria-hidden="true">{placeholder}</span>
    )}
  </div>
));
DateInput.displayName = "DateInput";
DateInput.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

export { DateInput };
