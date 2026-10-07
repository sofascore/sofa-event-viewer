"use client";

import { useState } from "react";

export default function RawJson({ data, label = "Raw JSON" }: { data: unknown; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Stringify only when open: some responses (incidents, shotmap) are tens of kB.
  const text = open ? JSON.stringify(data, null, 2) : "";

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <details
      className="mt-3 rounded border border-zinc-200 bg-zinc-50"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer select-none px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900">
        {label}
      </summary>
      {open && (
        <div className="relative border-t border-zinc-200">
          <button
            type="button"
            onClick={copy}
            className="absolute right-2 top-2 rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs hover:bg-zinc-100"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="max-h-[32rem] overflow-auto p-3 text-xs leading-relaxed num">{text}</pre>
        </div>
      )}
    </details>
  );
}
