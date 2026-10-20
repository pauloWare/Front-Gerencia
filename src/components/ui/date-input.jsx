import React from "react";
import { cn } from "../../lib/utils";
import { CalendarDays } from "lucide-react";
import PropTypes from "prop-types";

const DateInput = React.forwardRef(({ className, id, value, disabled, ...props }, ref) => (
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
    {/* O navegador já exibe o formato nativo ("dd/mm/aaaa") dentro do campo;
        o overlay de placeholder antigo ficava duplicado/sobreposto ao ícone. */}
    {/* Firefox pinta um ícone nativo de calendário que não responde a CSS
        (ver theme.css — .native-picker-cover). pointer-events:none mantém o
        clique abrindo o seletor nativo; aria-hidden preserva a acessibilidade. */}
    <span className="native-picker-cover" aria-hidden="true" />
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
