"use client";

import { useState } from "react";
import { imagesBaseFor, useApiBase } from "@/lib/apiBase";

function initials(name: string | undefined): string {
  if (undefined === name) {
    return "?";
  }
  const words = name.split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Team / player / manager / unique-tournament image from the selected backend, initials on failure. */
export default function EntityImage({
  kind,
  id,
  name,
  size = 24,
}: {
  kind: "team" | "player" | "manager" | "unique-tournament";
  id: number | undefined;
  name?: string;
  size?: number;
}) {
  const base = useApiBase();
  const src = undefined === id || null === base ? null : `${imagesBaseFor(base)}/${kind}/${id}/image`;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const rounded = "player" === kind || "manager" === kind ? "rounded-full" : "rounded";
  if (null === src || failedSrc === src) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center bg-zinc-200 font-semibold text-zinc-600 ${rounded}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        title={name}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name ?? ""}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 object-contain ${rounded}`}
      style={{ width: size, height: size }}
      onError={() => setFailedSrc(src)}
    />
  );
}
