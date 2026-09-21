import React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Separator = React.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-gray-200",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
));
Separator.displayName = "Separator";
Separator.propTypes = {
  className: PropTypes.string,
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
  decorative: PropTypes.bool,
};

export { Separator };