import React from "react";
import { cn } from "../../lib/utils";
import { CalendarDays } from "lucide-react";

/**
 * Campo de data (somente data) com ícone de calendário e placeholder visual.
 * Utiliza o input nativo type="date" (exibição amigável conforme o navegador),
 * mantendo o valor em ISO (AAAA-MM-DD), que é exatamente o que a API espera.
 */
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

export { DateInput };
