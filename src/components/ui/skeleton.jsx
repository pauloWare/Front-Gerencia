import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Skeleton = ({ className, ...props }) => (
  <div className={cn("animate-pulse rounded-md bg-gray-200", className)} {...props} />
);

Skeleton.displayName = "Skeleton";
Skeleton.propTypes = {
  className: PropTypes.string,
};

export { Skeleton };