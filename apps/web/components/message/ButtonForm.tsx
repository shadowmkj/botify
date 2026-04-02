import type { ButtonEntry, ButtonMessagePayload, BuilderErrors, SelectSection, SelectRow } from "./ButtonMessageTypes";
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
import { Plus, Trash2, ChevronDown, ChevronUp, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

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
  single_select: "", // not used
};

// ─── SingleSelectEditor ───────────────────────────────────────────────────────

interface SingleSelectEditorProps {
  sections: SelectSection[];
  onUpdate: (sections: SelectSection[]) => void;
}

function SingleSelectEditor({ sections, onUpdate }: SingleSelectEditorProps) {
  const [openSection, setOpenSection] = useState<number>(0);

  const addSection = () => {
    onUpdate([
      ...sections,
      { title: "", rows: [{ id: crypto.randomUUID(), title: "", description: "" }] },
    ]);
    setOpenSection(sections.length);
  };

  const removeSection = (si: number) => {
    onUpdate(sections.filter((_, i) => i !== si));
    setOpenSection(Math.max(0, openSection - 1));
  };

  const updateSectionTitle = (si: number, title: string) => {
    onUpdate(sections.map((s, i) => (i === si ? { ...s, title } : s)));
  };

  const addRow = (si: number) => {
    onUpdate(
      sections.map((s, i) =>
        i === si
          ? { ...s, rows: [...s.rows, { id: crypto.randomUUID(), title: "", description: "" }] }
          : s
      )
    );
  };

  const removeRow = (si: number, ri: number) => {
    onUpdate(
      sections.map((s, i) =>
        i === si ? { ...s, rows: s.rows.filter((_, j) => j !== ri) } : s
      )
    );
  };

  const updateRow = (si: number, ri: number, partial: Partial<SelectRow>) => {
    onUpdate(
      sections.map((s, i) =>
        i === si
          ? { ...s, rows: s.rows.map((r, j) => (j === ri ? { ...r, ...partial } : r)) }
          : s
      )
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs flex items-center gap-1.5">
          <ListTree className="h-3.5 w-3.5 text-muted-foreground" />
          Sections &amp; Options
        </Label>
        <button
          type="button"
          onClick={addSection}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add Section
        </button>
      </div>

      {sections.length === 0 && (
        <p className="text-muted-foreground text-xs py-2 text-center border border-dashed rounded-md">
          No sections yet. Add at least one section with options.
        </p>
      )}

      {sections.map((section, si) => (
        <div key={si} className="border rounded-md overflow-hidden bg-background">
          {/* Section header */}
          <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === si ? -1 : si)}
              className="flex-1 flex items-center gap-1.5 text-xs font-medium text-left"
            >
              {openSection === si ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-muted-foreground">Section {si + 1}</span>
              {section.title && (
                <span className="truncate text-foreground">&mdash; {section.title}</span>
              )}
              <span className="ml-auto text-muted-foreground font-normal">
                {section.rows.length} option{section.rows.length !== 1 ? "s" : ""}
              </span>
            </button>
            {sections.length > 1 && (
              <button
                type="button"
                onClick={() => removeSection(si)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Section body */}
          {openSection === si && (
            <div className="p-2 space-y-3">
              {/* Section title */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Section Title <span className="font-normal">(optional)</span>
                </Label>
                <Input
                  className="h-7 text-xs"
                  placeholder="e.g., Popular choices"
                  value={section.title ?? ""}
                  onChange={(e) => updateSectionTitle(si, e.target.value)}
                />
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {section.rows.map((row, ri) => (
                  <div
                    key={row.id}
                    className="grid gap-1.5 p-2 bg-muted/30 rounded border border-border/60 relative"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        Option {ri + 1}
                      </span>
                      {section.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(si, ri)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Row ID */}
                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-muted-foreground">ID</Label>
                      <Input
                        className="h-6 text-xs font-mono"
                        placeholder="unique_id"
                        value={row.id}
                        onChange={(e) => updateRow(si, ri, { id: e.target.value })}
                      />
                    </div>

                    {/* Row title */}
                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-muted-foreground">Label *</Label>
                      <Input
                        className="h-6 text-xs"
                        placeholder="Option label"
                        value={row.title}
                        onChange={(e) => updateRow(si, ri, { title: e.target.value })}
                      />
                    </div>

                    {/* Row description */}
                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Description <span className="font-normal">(optional)</span>
                      </Label>
                      <Input
                        className="h-6 text-xs"
                        placeholder="Short description"
                        value={row.description ?? ""}
                        onChange={(e) => updateRow(si, ri, { description: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addRow(si)}
                className="w-full text-xs text-primary hover:underline flex items-center justify-center gap-1 py-1 border border-dashed rounded"
              >
                <Plus className="h-3 w-3" /> Add Option
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── ButtonForm ───────────────────────────────────────────────────────────────

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
      buttons: payload.buttons.map((b) => (b.id === id ? { ...b, ...partial } : b)),
    });
  };

  const handleTypeChange = (id: string, newType: ButtonEntry["type"]) => {
    const base: Partial<ButtonEntry> = { type: newType, payload: "" };
    // Seed a default section when switching to single_select
    if (newType === "single_select") {
      base.sections = [
        {
          title: "",
          rows: [{ id: crypto.randomUUID(), title: "", description: "" }],
        },
      ];
    } else {
      base.sections = undefined;
    }
    updateButton(id, base);
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
        {errors.body && <p className="text-destructive text-sm">{errors.body}</p>}
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

      {/* Buttons section */}
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
            const isListType = btn.type === "single_select";

            return (
              <div
                key={btn.id}
                className={cn(
                  "rounded-lg border p-3 space-y-3 bg-muted/30 relative",
                  btnErrors && "border-destructive/50"
                )}
              >
                {/* Card header */}
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

                {/* Type selector */}
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={btn.type}
                    onValueChange={(v) => handleTypeChange(btn.id, v as ButtonEntry["type"])}
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

                {/* Button label (always shown — maps to title for single_select) */}
                <div className="space-y-1">
                  <Label className="text-xs">
                    {isListType ? "List Button Label" : "Button Label"}
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder={isListType ? "e.g., Choose an option" : "e.g., Learn More"}
                    value={btn.text}
                    onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                  />
                  {btnErrors?.text && (
                    <p className="text-destructive text-xs">{btnErrors.text}</p>
                  )}
                </div>

                {/* Payload — only for non-list types */}
                {!isListType && (
                  <div className="space-y-1">
                    <Label className="text-xs">{PAYLOAD_LABEL[btn.type]}</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder={
                        btn.type === "cta_url"
                          ? "https://example.com"
                          : btn.type === "cta_call"
                          ? "+919999999999"
                          : ""
                      }
                      value={btn.payload}
                      onChange={(e) => updateButton(btn.id, { payload: e.target.value })}
                    />
                    {btnErrors?.payload && (
                      <p className="text-destructive text-xs">{btnErrors.payload}</p>
                    )}
                  </div>
                )}

                {/* Single-select: sections editor */}
                {isListType && (
                  <div className="border-t pt-3">
                    <SingleSelectEditor
                      sections={btn.sections ?? []}
                      onUpdate={(sections) => updateButton(btn.id, { sections })}
                    />
                    {btnErrors?.payload && (
                      <p className="text-destructive text-xs mt-1">{btnErrors.payload}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
