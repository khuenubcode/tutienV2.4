import { CultivationTimeline, EraPhase } from '../data/cultivation_timeline_system';
import { TIME_NAMING } from '../data/timename';

export function getYearName(year: number, month?: number, day?: number): string {
  const eraIndex = Math.floor(year / 1000) % TIME_NAMING.eraNames.length;
  const eraName = TIME_NAMING.eraNames[eraIndex];
  const relativeYear = (year % 1000) + 1;
  let str = `${eraName} năm thứ ${relativeYear}`;
  if (month !== undefined && day !== undefined) {
    str += `, tháng ${month} ngày ${day}`;
  }
  return str;
}

export function getPhaseName(phase: EraPhase): string {
  switch (phase) {
    case "SPIRIT_LOW": return TIME_NAMING.phases[1]; // Mạt pháp
    case "SPIRIT_RISE": return TIME_NAMING.phases[2]; // Thiên biến
    case "SPIRIT_PEAK": return TIME_NAMING.phases[0]; // Thịnh thế
    case "SPIRIT_DECAY": return TIME_NAMING.phases[3]; // Loạn thế
    default: return phase;
  }
}

export function getTimelineSummary(timeline: CultivationTimeline) {
  const { cycle } = timeline;
  return {
    yearStr: getYearName(cycle.year, cycle.month, cycle.day),
    phaseStr: getPhaseName(cycle.phase),
    density: (cycle.spiritualDensity * 100).toFixed(0) + "%",
    danger: (cycle.dangerLevel * 100).toFixed(0) + "%",
  };
}
