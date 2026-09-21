import React, { useMemo } from "react";
import { cn } from "../../lib/utils";
import { formatNumber } from "../../lib/format";
import PropTypes from "prop-types";

/**/
const MoneyInput = React.forwardRef(
  ({ value, onChange, className, id, placeholder, disabled, ...props }, ref) => {
    const display = useMemo(() => {
      if (value === null || value === undefined || value === "") return "";
      return formatNumber(value, 2);
    }, [value]);

    const handleChange = (e) => {
      const digits = e.target.value.replace(/\D/g, "");
      if (digits === "") {
        onChange(undefined);
        return;
      }
      onChange(Number(digits) / 100);
    };

    return (
      <div className="money-input-wrapper">
        <span className="money-prefix" aria-hidden="true">R$</span>
        <input
          ref={ref}
          id={id}
          className={cn("theme-input money-input", className)}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder || "0,00"}
          value={display}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);
MoneyInput.displayName = "MoneyInput";
MoneyInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func,
  className: PropTypes.string,
  id: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

export { MoneyInput };
