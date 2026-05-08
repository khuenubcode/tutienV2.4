
import { ChronicleEntry } from '../types';

export interface ChronicleSummary {
  recentEventsDescription: string;
  importantEventsCount: number;
  lastImportantEvent: ChronicleEntry | null;
}

export function getChroniclesSummary(entries: ChronicleEntry[]): ChronicleSummary {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  const importantEntries = entries.filter(e => e.importance === 'important' || e.importance === 'monumental');
  const recentEntries = sortedEntries.slice(0, 3);
  
  let recentEventsDescription = "Chưa có sự kiện nào đáng chú ý.";
  if (recentEntries.length > 0) {
    recentEventsDescription = recentEntries.map(e => e.title).join(", ");
  }

  return {
    recentEventsDescription,
    importantEventsCount: importantEntries.length,
    lastImportantEvent: importantEntries.length > 0 ? importantEntries[0] : null
  };
}
