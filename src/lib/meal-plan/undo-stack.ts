export const UNDO_TOAST_DURATION_MS = 5000;

/**
 * Creates a detached snapshot of meal-plan state for one-level undo.
 * Meal objects in this app are plain JSON-compatible data from APIs/forms.
 */
export function createUndoSnapshot<T>(state: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(state);
  }

  return JSON.parse(JSON.stringify(state)) as T;
}
