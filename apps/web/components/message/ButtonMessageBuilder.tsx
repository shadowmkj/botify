"use client";
import { useReducer, useEffect, useRef, useCallback } from "react";
import ButtonForm from "./ButtonForm";
import ButtonPreview from "./ButtonPreview";
import type {
  ButtonMessagePayload,
  BuilderErrors,
} from "./ButtonMessageTypes";

// ─── State / Reducer ─────────────────────────────────────────────────────────

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

// ─── Validation ───────────────────────────────────────────────────────────────

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

    if (btn.type === "single_select") {
      const sections = btn.sections ?? [];
      if (sections.length === 0) {
        e.payload = "Add at least one section with options.";
      } else {
        const hasRows = sections.some((s) => s.rows.length > 0);
        if (!hasRows) {
          e.payload = "Each section must have at least one option.";
        } else {
          const badRow = sections
            .flatMap((s) => s.rows)
            .find((r) => !r.id.trim() || !r.title.trim());
          if (badRow) e.payload = "All options must have an ID and a label.";
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

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_PAYLOAD: ButtonMessagePayload = {
  header: "",
  body: "",
  footer: "",
  buttons: [],
};

interface ButtonMessageBuilderProps {
  onChange: (payload: ButtonMessagePayload | null) => void;
  defaultValue?: ButtonMessagePayload;
  mediaPreviewUrl?: string | null;
}

export default function ButtonMessageBuilder({
  onChange,
  defaultValue,
  mediaPreviewUrl,
}: ButtonMessageBuilderProps) {
  const [state, dispatch] = useReducer(reducer, {
    payload: defaultValue ?? DEFAULT_PAYLOAD,
    errors: {},
  });

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

  useEffect(() => {
    emitChange(state.payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.payload]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const handleChange = (updated: ButtonMessagePayload) => {
    dispatch({ type: "SET_PAYLOAD", payload: updated });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0 rounded-2xl border shadow-md overflow-hidden">
      {/* ── Left: form panel ────────────────────────────────────────── */}
      <div className="flex flex-col min-h-[680px]">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-semibold tracking-tight">
              Message Builder
            </span>
          </div>
          {isValid(state.errors) && state.payload.body && (
            <span className="ml-auto text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
              ✓ Ready to send
            </span>
          )}
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto p-6">
          <ButtonForm
            payload={state.payload}
            errors={state.errors}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ── Right: preview panel ─────────────────────────────────────── */}
      <div className="border-l flex flex-col bg-muted/10">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold tracking-tight">
            Live Preview
          </span>
        </div>

        {/* Preview content — sticky scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          <ButtonPreview payload={state.payload} mediaPreviewUrl={mediaPreviewUrl} />
        </div>
      </div>
    </div>
  );
}
