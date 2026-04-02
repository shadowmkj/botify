"use client";
import { useState } from "react";
import type { ButtonMessagePayload } from "./ButtonMessageTypes";
import {
  ChevronDown,
  ChevronUp,
  Link,
  Phone,
  MessageSquare,
  Copy,
  List,
  Code2,
} from "lucide-react";

interface ButtonPreviewProps {
  payload: ButtonMessagePayload;
}

const BUTTON_ICONS: Record<string, React.ReactNode> = {
  quick_reply: <MessageSquare className="h-4 w-4" />,
  cta_url: <Link className="h-4 w-4" />,
  cta_call: <Phone className="h-4 w-4" />,
  cta_copy: <Copy className="h-4 w-4" />,
  single_select: <List className="h-4 w-4" />,
};

export default function ButtonPreview({ payload }: ButtonPreviewProps) {
  const [showJson, setShowJson] = useState(false);

  const hasContent = payload.header || payload.body || payload.buttons.length > 0;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Phone frame ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">
        {/* Phone shell */}
        <div
          className="w-[320px] rounded-[2.5rem] shadow-2xl overflow-hidden"
          style={{
            border: "6px solid #1a1a2e",
            boxShadow:
              "0 30px 80px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Notch bar */}
          <div className="bg-[#1a1a2e] flex justify-center pt-2 pb-1">
            <div className="w-20 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* WA header bar */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-teal-500 flex items-center justify-center shadow-inner shrink-0">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">
                Botify
              </p>
              <p className="text-emerald-200/80 text-[11px] leading-tight">
                online
              </p>
            </div>
            {/* Signal dots */}
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-white/40"
                />
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div
            className="min-h-[440px] p-4 flex flex-col justify-end gap-2"
            style={{
              background:
                "linear-gradient(180deg,#0d1117 0%,#111827 100%)",
            }}
          >
            {!hasContent ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageSquare className="h-7 w-7 text-white/20" />
                </div>
                <p className="text-white/25 text-xs text-center leading-relaxed">
                  Your message preview
                  <br />
                  will appear here
                </p>
              </div>
            ) : (
              <div className="w-full">
                {/* Message bubble */}
                <div
                  className="rounded-2xl rounded-tl-none overflow-hidden shadow-xl"
                  style={{
                    background: "linear-gradient(135deg,#1f2937 0%,#202c33 100%)",
                    maxWidth: "100%",
                  }}
                >
                  {/* Header */}
                  {payload.header && (
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-white font-bold text-[13px] leading-snug">
                        {payload.header}
                      </p>
                    </div>
                  )}

                  {/* Body */}
                  {payload.body && (
                    <div className="px-4 py-2">
                      <p className="text-[#e9edef] text-[12px] leading-relaxed whitespace-pre-wrap">
                        {payload.body}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  {payload.footer && (
                    <div className="px-4 pb-2">
                      <p className="text-[#8696a0] text-[11px] leading-snug italic">
                        {payload.footer}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="px-4 pb-2 flex justify-end">
                    <span className="text-[#8696a0] text-[10px]">
                      12:00 PM ✓✓
                    </span>
                  </div>

                  {/* Buttons */}
                  {payload.buttons.length > 0 && (
                    <div className="border-t border-white/10">
                      {payload.buttons.map((btn, i) => {
                        const isListBtn = btn.type === "single_select";
                        const totalRows = isListBtn
                          ? (btn.sections ?? []).reduce(
                              (acc, s) => acc + s.rows.length,
                              0
                            )
                          : 0;

                        return (
                          <div key={btn.id}>
                            {i > 0 && (
                              <div className="border-t border-white/10" />
                            )}

                            {/* Button row */}
                            <div className="flex items-center gap-2 py-2.5 px-4 hover:bg-white/5 cursor-pointer transition-colors">
                              <span className="text-[#53bdeb] shrink-0">
                                {BUTTON_ICONS[btn.type]}
                              </span>
                              <span className="text-[#53bdeb] text-[12px] font-medium flex-1 truncate">
                                {btn.text ||
                                  (isListBtn ? "Select Option" : "Button")}
                              </span>
                              {isListBtn && totalRows > 0 && (
                                <span className="text-[#8696a0] text-[10px] shrink-0 bg-white/5 px-1.5 py-0.5 rounded-full">
                                  {totalRows}
                                </span>
                              )}
                            </div>

                            {/* List option preview */}
                            {isListBtn &&
                              (btn.sections ?? []).length > 0 && (
                                <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-2">
                                  {(btn.sections ?? []).map((section, si) => (
                                    <div key={si} className="space-y-1">
                                      {section.title && (
                                        <p className="text-[#8696a0] text-[10px] uppercase tracking-widest font-semibold">
                                          {section.title}
                                        </p>
                                      )}
                                      {section.rows
                                        .slice(0, 3)
                                        .map((row, ri) => (
                                          <div
                                            key={ri}
                                            className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#53bdeb] mt-1.5 shrink-0" />
                                            <div className="min-w-0">
                                              <p className="text-[#e9edef] text-[11px] font-medium leading-tight truncate">
                                                {row.title || "Option"}
                                              </p>
                                              {row.description && (
                                                <p className="text-[#8696a0] text-[10px] truncate">
                                                  {row.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      {section.rows.length > 3 && (
                                        <p className="text-[#8696a0] text-[10px] pl-3.5">
                                          +{section.rows.length - 3} more options
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="bg-[#1a1a2e] flex justify-center pb-2 pt-1">
            <div className="w-24 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* ── JSON inspector ───────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden">
        <button
          type="button"
          onClick={() => setShowJson((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>JSON Payload</span>
          <span className="ml-auto">
            {showJson ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {showJson && (
          <pre className="text-[11px] leading-relaxed bg-muted/30 px-4 py-3 overflow-x-auto max-h-64 text-muted-foreground border-t whitespace-pre-wrap break-all font-mono">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
