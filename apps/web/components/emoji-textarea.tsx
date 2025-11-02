/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Textarea } from "@/components/ui/textarea";

interface EmojiTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function EmojiTextarea({
  value,
  onChange,
  placeholder,
}: EmojiTextareaProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const addEmoji = (emoji: any) => {
    onChange(value + emoji.native);
    setShowPicker(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="resize-y pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="absolute left-2 bottom-2 text-xl"
      >
        😊
      </button>

      {showPicker && (
        <div ref={pickerRef} className="absolute z-50 bottom-10 left-0">
          <Picker data={data} onEmojiSelect={addEmoji} />
        </div>
      )}
      <div></div>
    </div>
  );
}
