export const CALENDAR_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type DaySlot = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
  reason: string;
};

export const FALLBACK_DAY_SLOTS: DaySlot[] = [
  { id: "08-10", label: "08h00 - 10h00", startTime: "08:00", endTime: "10:00", available: false, reason: "erreur" },
  { id: "10-12", label: "10h00 - 12h00", startTime: "10:00", endTime: "12:00", available: false, reason: "erreur" },
  { id: "14-16", label: "14h00 - 16h00", startTime: "14:00", endTime: "16:00", available: false, reason: "erreur" },
  { id: "16-18", label: "16h00 - 18h00", startTime: "16:00", endTime: "18:00", available: false, reason: "erreur" },
  { id: "18-20", label: "18h00 - 20h00", startTime: "18:00", endTime: "20:00", available: false, reason: "erreur" },
];
