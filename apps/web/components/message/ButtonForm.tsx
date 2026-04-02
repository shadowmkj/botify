import type { ButtonEntry, ButtonMessagePayload, BuilderErrors } from "./ButtonMessageTypes";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmojiTextarea from "@/components/emoji-textarea";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BUTTON_TYPE_LABELS: Record<ButtonEntry["type"], string> = {
  quick_reply: "Quick Reply",
  cta_url: "Open URL",
  cta_call: "Call Phone",
  cta_copy: "Copy Code",
  single_select: "List / Select",
};

const PAYLOAD_LABEL: Record<ButtonEntry["type"], string> = {
  quick_reply: "Reply ID",
  cta_url: "URL (https://…)",
  cta_call: "Phone Number",
  cta_copy: "Copy Code",
  single_select: "List Title",
};

interface ButtonFormProps {
  payload: ButtonMessagePayload;
  errors: BuilderErrors;
  onChange: (updated: ButtonMessagePayload) => void;
}

export default function ButtonForm({ payload, errors, onChange }: ButtonFormProps) {
  const updateField = (field: keyof Omit<ButtonMessagePayload, "buttons">, value: string) => {
    onChange({ ...payload, [field]: value });
  };

  const addButton = () => {
    if (payload.buttons.length >= 3) return;
    const newBtn: ButtonEntry = {
      id: crypto.randomUUID(),
      type: "quick_reply",
      text: "",
      payload: "",
    };
    onChange({ ...payload, buttons: [...payload.buttons, newBtn] });
  };

  const removeButton = (id: string) => {
    onChange({ ...payload, buttons: payload.buttons.filter((b) => b.id !== id) });
  };

  const updateButton = (id: string, partial: Partial<ButtonEntry>) => {
    onChange({
      ...payload,
      buttons: payload.buttons.map((b) =>
        b.id === id ? { ...b, ...partial } : b
      ),
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <Label htmlFor="bm-header">
          Header <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="bm-header"
          placeholder="e.g., Welcome to Botify!"
          value={payload.header}
          onChange={(e) => updateField("header", e.target.value)}
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <Label htmlFor="bm-body">
          Body <span className="text-destructive">*</span>
        </Label>
        <EmojiTextarea
          placeholder="Enter your message body…"
          value={payload.body}
          onChange={(v) => updateField("body", v)}
        />
        {errors.body && (
          <p className="text-destructive text-sm">{errors.body}</p>
        )}
      </div>

      {/* Footer */}
      <div className="space-y-1.5">
        <Label htmlFor="bm-footer">
          Footer <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="bm-footer"
          placeholder="e.g., Reply STOP to unsubscribe"
          value={payload.footer}
          onChange={(e) => updateField("footer", e.target.value)}
        />
      </div>

      {/* Divider */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold">
            Buttons{" "}
            <span className="text-muted-foreground font-normal">
              ({payload.buttons.length}/3)
            </span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addButton}
            disabled={payload.buttons.length >= 3}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Button
          </Button>
        </div>

        {payload.buttons.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4 border border-dashed rounded-lg">
            No buttons yet. Add up to 3 buttons.
          </p>
        )}

        <div className="space-y-4">
          {payload.buttons.map((btn, index) => {
            const btnErrors = errors.buttons?.[btn.id];
            return (
              <div
                key={btn.id}
                className={cn(
                  "rounded-lg border p-3 space-y-3 bg-muted/30 relative",
                  btnErrors && "border-destructive/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Button {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeButton(btn.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={btn.type}
                    onValueChange={(v) =>
                      updateButton(btn.id, { type: v as ButtonEntry["type"], payload: "" })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BUTTON_TYPE_LABELS) as ButtonEntry["type"][]).map((t) => (
                        <SelectItem key={t} value={t} className="text-sm">
                          {BUTTON_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Display text */}
                <div className="space-y-1">
                  <Label className="text-xs">Button Label</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g., Learn More"
                    value={btn.text}
                    onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                  />
                  {btnErrors?.text && (
                    <p className="text-destructive text-xs">{btnErrors.text}</p>
                  )}
                </div>

                {/* Payload */}
                <div className="space-y-1">
                  <Label className="text-xs">{PAYLOAD_LABEL[btn.type]}</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder={
                      btn.type === "cta_url"
                        ? "https://example.com"
                        : btn.type === "cta_call"
                        ? "+919999999999"
                        : btn.type === "single_select"
                        ? "e.g., Choose an option"
                        : ""
                    }
                    value={btn.payload}
                    onChange={(e) => updateButton(btn.id, { payload: e.target.value })}
                  />
                  {btnErrors?.payload && (
                    <p className="text-destructive text-xs">{btnErrors.payload}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
