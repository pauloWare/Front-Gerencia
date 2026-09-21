import React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-blue-100 text-blue-800 border-transparent",
    secondary: "bg-gray-100 text-gray-800 border-transparent",
    destructive: "bg-red-100 text-red-800 border-transparent",
    success: "bg-emerald-100 text-emerald-800 border-transparent",
    warning: "bg-amber-100 text-amber-800 border-transparent",
    outline: "text-gray-700 border-gray-200",
  };
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";
Badge.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "secondary", "destructive", "success", "warning", "outline"]),
};

export { Badge };