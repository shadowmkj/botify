"use client";
import { useState } from "react";
import type { ButtonMessagePayload } from "./ButtonMessageTypes";
import { ChevronDown, ChevronUp, Link, Phone, MessageSquare, Copy, List } from "lucide-react";

interface ButtonPreviewProps {
  payload: ButtonMessagePayload;
}

const BUTTON_ICONS: Record<string, React.ReactNode> = {
  quick_reply: <MessageSquare className="h-3.5 w-3.5" />,
  cta_url: <Link className="h-3.5 w-3.5" />,
  cta_call: <Phone className="h-3.5 w-3.5" />,
  cta_copy: <Copy className="h-3.5 w-3.5" />,
  single_select: <List className="h-3.5 w-3.5" />,
};

export default function ButtonPreview({ payload }: ButtonPreviewProps) {
  const [showJson, setShowJson] = useState(false);

  const hasContent =
    payload.header || payload.body || payload.buttons.length > 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Phone frame */}
      <div className="flex-1 flex flex-col items-center">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
          Live Preview
        </p>

        {/* Phone shell */}
        <div className="w-[260px] rounded-[2rem] border-4 border-foreground/10 bg-neutral-900 shadow-2xl overflow-hidden">
          {/* Status bar */}
          <div className="bg-[#075E54] px-4 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-none">Botify</p>
              <p className="text-white/60 text-[10px] leading-none mt-0.5">online</p>
            </div>
          </div>

          {/* Chat area */}
          <div
            className="min-h-[320px] p-3 flex flex-col justify-end"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%231a1a2e' width='100' height='100'/%3E%3C/svg%3E")`,
              backgroundColor: "#1a1a2e",
            }}
          >
            {!hasContent ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/30 text-xs text-center">
                  Your message preview<br />will appear here
                </p>
              </div>
            ) : (
              <div className="w-full">
                {/* Message bubble */}
                <div className="bg-[#202c33] rounded-lg rounded-tl-none overflow-hidden shadow-md max-w-[220px]">
                  {/* Header */}
                  {payload.header && (
                    <div className="px-3 pt-2.5 pb-0">
                      <p className="text-white font-bold text-sm leading-snug">
                        {payload.header}
                      </p>
                    </div>
                  )}

                  {/* Body */}
                  {payload.body && (
                    <div className="px-3 py-2">
                      <p className="text-[#e9edef] text-xs leading-relaxed whitespace-pre-wrap">
                        {payload.body}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  {payload.footer && (
                    <div className="px-3 pb-2">
                      <p className="text-[#8696a0] text-[10px] leading-snug">
                        {payload.footer}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="px-3 pb-1.5 flex justify-end">
                    <span className="text-[#8696a0] text-[9px]">12:00 PM</span>
                  </div>

                  {/* Buttons */}
                  {payload.buttons.length > 0 && (
                    <div className="border-t border-white/10">
                      {payload.buttons.map((btn, i) => {
                        const isListBtn = btn.type === "single_select";
                        const totalRows = isListBtn
                          ? (btn.sections ?? []).reduce((acc, s) => acc + s.rows.length, 0)
                          : 0;

                        return (
                          <div key={btn.id}>
                            {i > 0 && <div className="border-t border-white/10" />}
                            <div className="flex items-center justify-center gap-1.5 py-2 px-3 hover:bg-white/5 cursor-pointer transition-colors">
                              <span className="text-[#53bdeb]">
                                {BUTTON_ICONS[btn.type]}
                              </span>
                              <span className="text-[#53bdeb] text-xs font-medium truncate">
                                {btn.text || (isListBtn ? "Select Option" : "Button")}
                              </span>
                              {isListBtn && totalRows > 0 && (
                                <span className="ml-auto text-[#8696a0] text-[9px] shrink-0">
                                  {totalRows} option{totalRows !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            {/* For list buttons: show a small collapsed option preview */}
                            {isListBtn && (btn.sections ?? []).length > 0 && (
                              <div className="px-3 pb-2 space-y-1">
                                {(btn.sections ?? []).map((section, si) => (
                                  <div key={si}>
                                    {section.title && (
                                      <p className="text-[#8696a0] text-[9px] uppercase tracking-wide mb-0.5">
                                        {section.title}
                                      </p>
                                    )}
                                    {section.rows.slice(0, 2).map((row, ri) => (
                                      <div
                                        key={ri}
                                        className="flex items-center gap-1.5 py-0.5"
                                      >
                                        <div className="w-1 h-1 rounded-full bg-[#53bdeb] shrink-0" />
                                        <div>
                                          <p className="text-[#e9edef] text-[10px] leading-none">
                                            {row.title || "Option"}
                                          </p>
                                          {row.description && (
                                            <p className="text-[#8696a0] text-[9px]">
                                              {row.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {section.rows.length > 2 && (
                                      <p className="text-[#8696a0] text-[9px]">
                                        +{section.rows.length - 2} more…
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
        </div>
      </div>

      {/* JSON toggle */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowJson((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          <span>JSON Payload</span>
          {showJson ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {showJson && (
          <pre className="text-[10px] leading-relaxed bg-muted/40 p-3 overflow-x-auto max-h-48 text-muted-foreground border-t whitespace-pre-wrap break-all">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
