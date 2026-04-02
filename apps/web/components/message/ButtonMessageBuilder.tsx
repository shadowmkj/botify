"use client";
import { useReducer, useEffect, useRef, useCallback } from "react";
import ButtonForm from "./ButtonForm";
import ButtonPreview from "./ButtonPreview";
import type {
  ButtonMessagePayload,
  BuilderErrors,
  ButtonEntry,
} from "./ButtonMessageTypes";

// ─── State / Reducer ────────────────────────────────────────────────────────

type State = {
  payload: ButtonMessagePayload;
  errors: BuilderErrors;
};

type Action =
  | { type: "SET_PAYLOAD"; payload: ButtonMessagePayload }
  | { type: "SET_ERRORS"; errors: BuilderErrors };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PAYLOAD":
      return { ...state, payload: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    default:
      return state;
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

const URL_RE = /^https?:\/\/.+/;
const PHONE_RE = /^\+?[0-9\s\-().]{7,20}$/;

function validate(payload: ButtonMessagePayload): BuilderErrors {
  const errors: BuilderErrors = {};

  if (!payload.body.trim()) {
    errors.body = "Body text is required.";
  }

  const btnErrors: BuilderErrors["buttons"] = {};
  payload.buttons.forEach((btn) => {
    const e: { text?: string; payload?: string } = {};

    if (!btn.text.trim()) e.text = "Button label is required.";

    if (btn.type === "cta_url" && btn.payload && !URL_RE.test(btn.payload)) {
      e.payload = "Must be a valid URL (https://…)";
    }
    if (btn.type === "cta_call" && btn.payload && !PHONE_RE.test(btn.payload)) {
      e.payload = "Must be a valid phone number.";
    }

    // single_select validation
    if (btn.type === "single_select") {
      const sections = btn.sections ?? [];
      if (sections.length === 0) {
        e.payload = "Add at least one section with options.";
      } else {
        const hasRows = sections.some((s) => s.rows.length > 0);
        if (!hasRows) {
          e.payload = "Each section must have at least one option.";
        } else {
          // Check all rows have id + title
          const badRow = sections
            .flatMap((s) => s.rows)
            .find((r) => !r.id.trim() || !r.title.trim());
          if (badRow) {
            e.payload = "All options must have an ID and a label.";
          }
        }
      }
    }

    if (Object.keys(e).length) btnErrors![btn.id] = e;
  });
  if (Object.keys(btnErrors).length) errors.buttons = btnErrors;

  return errors;
}

function isValid(errors: BuilderErrors): boolean {
  return !errors.body && !errors.buttons;
}

// ─── Component ───────────────────────────────────────────────────────────────

const DEFAULT_PAYLOAD: ButtonMessagePayload = {
  header: "",
  body: "",
  footer: "",
  buttons: [],
};

interface ButtonMessageBuilderProps {
  /** Called (debounced 300ms) whenever payload changes and passes validation */
  onChange: (payload: ButtonMessagePayload | null) => void;
  defaultValue?: ButtonMessagePayload;
}

export default function ButtonMessageBuilder({
  onChange,
  defaultValue,
}: ButtonMessageBuilderProps) {
  const [state, dispatch] = useReducer(reducer, {
    payload: defaultValue ?? DEFAULT_PAYLOAD,
    errors: {},
  });

  // Debounce onChange so parent doesn't re-render on every keystroke
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitChange = useCallback(
    (payload: ButtonMessagePayload) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const errors = validate(payload);
        dispatch({ type: "SET_ERRORS", errors });
        onChange(isValid(errors) ? payload : null);
      }, 300);
    },
    [onChange]
  );

  // Validate + emit whenever payload changes
  useEffect(() => {
    emitChange(state.payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.payload]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleChange = (updated: ButtonMessagePayload) => {
    dispatch({ type: "SET_PAYLOAD", payload: updated });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left — form */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 text-foreground">
          Build Message
        </h3>
        <ButtonForm
          payload={state.payload}
          errors={state.errors}
          onChange={handleChange}
        />
      </div>

      {/* Right — preview */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <ButtonPreview payload={state.payload} />
      </div>
    </div>
  );
}
