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
import { Plus, Trash2, ChevronDown, ChevronUp, ListTree, Sparkles, AlignLeft, MousePointer } from "lucide-react";
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
  cta_url: "URL",
  cta_call: "Phone Number",
  cta_copy: "Copy Code",
  single_select: "",
};

const PAYLOAD_PLACEHOLDER: Record<ButtonEntry["type"], string> = {
  quick_reply: "e.g., reply_yes",
  cta_url: "https://example.com",
  cta_call: "+919999999999",
  cta_copy: "PROMO2025",
  single_select: "",
};

// ─── Section label with icon ─────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <Label className="text-sm font-semibold text-foreground cursor-pointer">
        {children}
      </Label>
    </div>
  );
}

// ─── SingleSelectEditor ───────────────────────────────────────────────────────

interface SingleSelectEditorProps {
  sections: SelectSection[];
  onUpdate: (sections: SelectSection[]) => void;
  error?: string;
}

function SingleSelectEditor({ sections, onUpdate, error }: SingleSelectEditorProps) {
  const [openSection, setOpenSection] = useState<number>(0);

  const addSection = () => {
    const newSections = [
      ...sections,
      { title: "", rows: [{ id: crypto.randomUUID(), title: "", description: "" }] },
    ];
    onUpdate(newSections);
    setOpenSection(newSections.length - 1);
  };

  const removeSection = (si: number) => {
    onUpdate(sections.filter((_, i) => i !== si));
    setOpenSection(Math.max(0, si - 1));
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
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <SectionLabel icon={<ListTree className="h-4 w-4" />}>
          Sections &amp; Options
        </SectionLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSection}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {sections.length === 0 && !error && (
        <div className="border-2 border-dashed rounded-xl p-6 text-center">
          <ListTree className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No sections yet. Add a section to create list options.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sections.map((section, si) => (
          <div
            key={si}
            className="rounded-xl border bg-background overflow-hidden shadow-sm"
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => setOpenSection(openSection === si ? -1 : si)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <span className="text-muted-foreground">
                {openSection === si ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Section {si + 1}
                </span>
                {section.title && (
                  <span className="ml-2 text-sm text-foreground font-medium">
                    — {section.title}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 shrink-0">
                {section.rows.length} option{section.rows.length !== 1 ? "s" : ""}
              </span>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeSection(si); }}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </button>

            {/* Section body */}
            {openSection === si && (
              <div className="p-4 space-y-4">
                {/* Section title */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Section Header <span className="font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g., Popular choices"
                    value={section.title ?? ""}
                    onChange={(e) => updateSectionTitle(si, e.target.value)}
                    className="h-10"
                  />
                </div>

                {/* Rows */}
                <div className="space-y-3">
                  {section.rows.map((row, ri) => (
                    <div
                      key={row.id}
                      className="rounded-lg border bg-muted/20 p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Option {ri + 1}
                        </span>
                        {section.rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(si, ri)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* ID */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">ID *</Label>
                          <Input
                            className="h-9 text-sm font-mono"
                            placeholder="unique_id"
                            value={row.id}
                            onChange={(e) => updateRow(si, ri, { id: e.target.value })}
                          />
                        </div>
                        {/* Label */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Label *</Label>
                          <Input
                            className="h-9 text-sm"
                            placeholder="Display label"
                            value={row.title}
                            onChange={(e) => updateRow(si, ri, { title: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Description <span className="font-normal">(optional)</span>
                        </Label>
                        <Input
                          className="h-9 text-sm"
                          placeholder="Short description shown below the label"
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
                  className="w-full h-10 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
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
    <div className="space-y-7">

      {/* ── Message content ────────────────────────────────────────── */}
      <div className="space-y-5">
        <SectionLabel icon={<AlignLeft className="h-4 w-4" />}>
          Message Content
        </SectionLabel>

        {/* Header */}
        <div className="space-y-1.5">
          <Label htmlFor="bm-header" className="text-sm flex items-center gap-2">
            Header
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="bm-header"
            placeholder="e.g., Welcome to Botify!"
            value={payload.header}
            onChange={(e) => updateField("header", e.target.value)}
            className="h-11"
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <Label htmlFor="bm-body" className="text-sm flex items-center gap-2">
            Body
            <span className="text-xs font-normal text-destructive">required</span>
          </Label>
          <EmojiTextarea
            placeholder="Write your message here…"
            value={payload.body}
            onChange={(v) => updateField("body", v)}
          />
          {errors.body && (
            <p className="text-destructive text-sm flex items-center gap-1.5 mt-1">
              <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
              {errors.body}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-1.5">
          <Label htmlFor="bm-footer" className="text-sm flex items-center gap-2">
            Footer
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="bm-footer"
            placeholder="e.g., Reply STOP to unsubscribe"
            value={payload.footer}
            onChange={(e) => updateField("footer", e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className="border-t" />

      {/* ── Buttons ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionLabel icon={<MousePointer className="h-4 w-4" />}>
            Buttons
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({payload.buttons.length} / 3)
            </span>
          </SectionLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addButton}
            disabled={payload.buttons.length >= 3}
            className="h-9 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Button
          </Button>
        </div>

        {payload.buttons.length === 0 && (
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No buttons yet</p>
            <p className="text-xs text-muted-foreground/70">
              Add up to 3 interactive buttons to your message
            </p>
          </div>
        )}

        <div className="space-y-4">
          {payload.buttons.map((btn, index) => {
            const btnErrors = errors.buttons?.[btn.id];
            const isListType = btn.type === "single_select";

            return (
              <div
                key={btn.id}
                className={cn(
                  "rounded-xl border bg-card shadow-sm overflow-hidden",
                  btnErrors && "border-destructive/40 ring-1 ring-destructive/20"
                )}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-primary text-[10px] font-bold">{index + 1}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {BUTTON_TYPE_LABELS[btn.type]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeButton(btn.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Remove button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-4">
                  {/* Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-medium">Type</Label>
                    <Select
                      value={btn.type}
                      onValueChange={(v) => handleTypeChange(btn.id, v as ButtonEntry["type"])}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(BUTTON_TYPE_LABELS) as ButtonEntry["type"][]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {BUTTON_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Button label */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-medium">
                      {isListType ? "List Button Label" : "Button Label"}
                    </Label>
                    <Input
                      className="h-10"
                      placeholder={isListType ? "e.g., Choose an option" : "e.g., Learn More"}
                      value={btn.text}
                      onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                    />
                    {btnErrors?.text && (
                      <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
                        {btnErrors.text}
                      </p>
                    )}
                  </div>

                  {/* Payload field — not for single_select */}
                  {!isListType && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">
                        {PAYLOAD_LABEL[btn.type]}
                      </Label>
                      <Input
                        className="h-10"
                        placeholder={PAYLOAD_PLACEHOLDER[btn.type]}
                        value={btn.payload}
                        onChange={(e) => updateButton(btn.id, { payload: e.target.value })}
                      />
                      {btnErrors?.payload && (
                        <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
                          {btnErrors.payload}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Section editor for single_select */}
                  {isListType && (
                    <SingleSelectEditor
                      sections={btn.sections ?? []}
                      onUpdate={(sections) => updateButton(btn.id, { sections })}
                      error={btnErrors?.payload}
                    />
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
