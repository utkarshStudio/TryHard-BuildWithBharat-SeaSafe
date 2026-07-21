import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const sleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

export const fmtNum = (n: number, d = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d });

export const fmtUsd = (n: number) =>
  Math.abs(n) >= 1e6
    ? `${n < 0 ? "-" : ""}$${(Math.abs(n) / 1e6).toFixed(2)}M`
    : `${n < 0 ? "-" : ""}$${(Math.abs(n) / 1e3).toFixed(0)}K`;

export const fmtHrs = (h: number) =>
  `${Math.round(h / 24)}d ${Math.round(h % 24)}h`;

export const fmtSigned = (n: number, suffix = "") =>
  `${n > 0 ? "+" : ""}${n.toLocaleString()}${suffix}`;

export const fmtUsdSigned = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "-" : ""}${
    Math.abs(n) >= 1e6
      ? `$${(Math.abs(n) / 1e6).toFixed(2)}M`
      : `$${(Math.abs(n) / 1e3).toFixed(0)}K`
  }`;
