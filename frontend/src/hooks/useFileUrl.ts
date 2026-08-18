"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFileUrl } from "@/store/slices/filesSlice";

export function useFileUrl(src?: string | null): string | null {
  const dispatch = useAppDispatch();
  const urls = useAppSelector((s) => s.files.urls);

  useEffect(() => {
    if (!src || !src.startsWith("MotoServe/") || urls[src]) return;
    void dispatch(fetchFileUrl(src));
  }, [src, urls, dispatch]);

  if (!src) return null;
  if (!src.startsWith("MotoServe/")) return src;
  return urls[src] ?? null;
}
