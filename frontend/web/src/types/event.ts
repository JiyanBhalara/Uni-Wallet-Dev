// src/types/event.ts
export interface EventItem {
  id: number;
  eventCode: string;
  name: string;
  category: string;
  location: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  tags: string;
  cost: number;
  rsvped: boolean;
  checkedIn: boolean;
}
