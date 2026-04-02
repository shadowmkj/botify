// Types for the ButtonMessageBuilder UI state

export type ButtonType =
  | "quick_reply"
  | "cta_url"
  | "cta_call"
  | "cta_copy"
  | "single_select";

export interface SelectRow {
  id: string;
  title: string;
  description?: string;
}

export interface SelectSection {
  title?: string;
  rows: SelectRow[];
}

export interface ButtonEntry {
  /** Stable React key */
  id: string;
  type: ButtonType;
  /** display_text shown on the button */
  text: string;
  /**
   * Contextual payload:
   * - quick_reply → id (arbitrary string)
   * - cta_url     → url
   * - cta_call    → phone_number
   * - cta_copy    → copy_code
   * - single_select → not used (uses sections)
   */
  payload: string;
  /** Only used when type === "single_select" */
  sections?: SelectSection[];
}

export interface ButtonMessagePayload {
  header: string;
  body: string;
  footer: string;
  buttons: ButtonEntry[];
}

/** Validation errors keyed by button id + field */
export interface ButtonFieldErrors {
  [buttonId: string]: {
    text?: string;
    payload?: string;
  };
}

export interface BuilderErrors {
  body?: string;
  buttons?: ButtonFieldErrors;
}
