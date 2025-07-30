import React from "react";
export function AccessibleButton({ children, ...props }) {
  return (
    <button {...props} aria-live="polite" tabIndex={0}>
      {children}
    </button>
  );
}