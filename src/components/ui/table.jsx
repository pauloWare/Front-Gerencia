import React from "react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-xl border border-gray-200">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";
Table.propTypes = {
  className: PropTypes.string,
};

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b bg-gray-50/80", className)} {...props} />
));
TableHeader.displayName = "TableHeader";
TableHeader.propTypes = {
  className: PropTypes.string,
};

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";
TableBody.propTypes = {
  className: PropTypes.string,
};

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-gray-100 transition-colors hover:bg-blue-50/40 data-[state=selected]:bg-gray-100", className)} {...props} />
));
TableRow.displayName = "TableRow";
TableRow.propTypes = {
  className: PropTypes.string,
};

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-10 px-4 text-left align-middle font-semibold text-gray-500 text-xs uppercase tracking-wider", className)} {...props} />
));
TableHead.displayName = "TableHead";
TableHead.propTypes = {
  className: PropTypes.string,
};

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle text-gray-700", className)} {...props} />
));
TableCell.displayName = "TableCell";
TableCell.propTypes = {
  className: PropTypes.string,
};

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-gray-500", className)} {...props} />
));
TableCaption.displayName = "TableCaption";
TableCaption.propTypes = {
  className: PropTypes.string,
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };