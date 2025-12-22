import { useEffect, useCallback } from "react";

/**
 * Custom hook to warn users before navigating away with unsaved changes.
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  message: string = "You have unsaved changes. Are you sure you want to leave?"
) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}

/**
 * Hook to track if form has unsaved changes.
 * Compares current state with initial state.
 */
export function useDetectChanges<T extends Record<string, any>>(
  initialState: T,
  currentState: T
): boolean {
  if (JSON.stringify(initialState) !== JSON.stringify(currentState)) {
    return true;
  }
  return false;
}
