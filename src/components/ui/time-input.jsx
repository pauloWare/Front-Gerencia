import React from "react";
import { cn } from "../../lib/utils";
import { Clock3 } from "lucide-react";

/**
 * Campo de horário com ícone de relógio e placeholder visual. Valor em "HH:mm".
 */
const TimeInput = React.forwardRef(({ className, id, value, placeholder = "HH:MM", disabled, ...props }, ref) => (
  <div className="input-icon-wrapper">
    <Clock3 size={16} className="input-icon" aria-hidden="true" />
    <input
      ref={ref}
      id={id}
      type="time"
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
TimeInput.displayName = "TimeInput";

export { TimeInput };
