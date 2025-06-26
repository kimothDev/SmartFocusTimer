import { ADHD_BREAK_OPTIONS, ADHD_FOCUS_OPTIONS, BREAK_OPTIONS, FOCUS_OPTIONS } from '@/constants/timer';

export function getFocusOptions(includeShortSessions: boolean) {
  return includeShortSessions ? ADHD_FOCUS_OPTIONS : FOCUS_OPTIONS;
}

export function getBreakOptions(includeShortSessions: boolean) {
  return includeShortSessions ? ADHD_BREAK_OPTIONS : BREAK_OPTIONS;
} 