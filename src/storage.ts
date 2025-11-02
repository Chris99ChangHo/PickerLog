// src/storage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PayType, PieceUnit } from "./domain";

// LogEntry: 앱이 저장하는 단일 로그 레코드
export interface LogEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  berryType: string;
  payType: PayType;
  rate: number;
  taxPercent: number;
  comment?: string;
  pieceUnit?: PieceUnit;
  kg?: number;
  punnets?: number;
  buckets?: number;
  hours?: number;
}

/** Storage key (v2 schema) */
const STORAGE_KEY = "picker_log_entries_v2";

/** Sort newest-date first, tie-break by id desc for stability */
function sortEntries(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate !== 0 ? byDate : b.id.localeCompare(a.id);
  });
}

/** Persist helper (always sorted) */
async function saveAll(entries: LogEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortEntries(entries)));
}

/** Load all logs (newest first); resilient to bad JSON */
export async function loadAll(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortEntries(parsed as LogEntry[]) : [];
  } catch (e) {
    console.error("Failed to load entries from storage.", e);
    return [];
  }
}

/** Upsert by id; keeps list sorted even if date changed */
export async function upsert(entry: LogEntry): Promise<void> {
  try {
    const all = await loadAll();
    const i = all.findIndex((e) => e.id === entry.id);
    if (i >= 0) all[i] = entry;
    else all.unshift(entry);
    await saveAll(all);
  } catch (e) {
    console.error("Failed to save (upsert) entry to storage.", e);
  }
}

/** Remove by id */
export async function remove(id: string): Promise<void> {
  try {
    const kept = (await loadAll()).filter((e) => e.id !== id);
    await saveAll(kept);
  } catch (e) {
    console.error("Failed to remove entry.", e);
  }
}

/** Fetch one entry for edit screen */
export async function getById(id: string): Promise<LogEntry | undefined> {
  const all = await loadAll();
  return all.find((e) => e.id === id);
}
