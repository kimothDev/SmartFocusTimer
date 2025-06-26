import { EnergyLevel, Session } from '@/types';

/**
 * Filters sessions based on a date range
 */
export function filterSessionsByDateRange(
  sessions: Session[], 
  days: number
): Session[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return sessions.filter(session => 
    new Date(session.date) >= cutoffDate
  );
}

/**
 * Calculates the completion rate for a set of sessions
 */
export function calculateCompletionRate(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  
  const completedSessions = sessions.filter(s => s.sessionCompleted);
  return (completedSessions.length / sessions.length) * 100;
}

/**
 * Finds the most productive task based on completed duration
 */
export function findMostProductiveTask(sessions: Session[]): string {
  if (sessions.length === 0) return 'N/A';
  
  const taskMap = new Map<string, number>();
  
  sessions.forEach(s => {
    if (!s.taskType) return;
    const current = taskMap.get(s.taskType) || 0;
    taskMap.set(s.taskType, current + s.focusedUntilSkipped); //completedDuration was there
  });
  
  let mostProductiveTask = 'N/A';
  let maxTime = 0;
  
  taskMap.forEach((time, task) => {
    if (time > maxTime) {
      maxTime = time;
      mostProductiveTask = task;
    }
  });
  
  return mostProductiveTask;
}

/**
 * Finds the best energy level based on average completion duration
 */
export function findBestEnergyLevel(sessions: Session[]): EnergyLevel | 'N/A' {
  if (sessions.length === 0) return 'N/A';
  
  const energyMap = new Map<EnergyLevel, { total: number, count: number }>();
  
  sessions.forEach(s => {
    if (!s.energyLevel) return;
    const current = energyMap.get(s.energyLevel) || { total: 0, count: 0 };
    energyMap.set(s.energyLevel, {
      total: current.total + s.focusedUntilSkipped, //completedDuration was there
      count: current.count + 1
    });
  });
  
  let bestEnergyLevel: EnergyLevel | 'N/A' = 'N/A';
  let bestAvg = 0;
  
  energyMap.forEach((data, level) => {
    const avg = data.total / data.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestEnergyLevel = level;
    }
  });
  
  return bestEnergyLevel;
}

/**
 * Calculates daily focus time for the past week
 */
export function calculateDailyFocusTime(sessions: Session[]): { days: string[], values: number[] } {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const values = Array(7).fill(0);
  
  sessions.forEach(session => {
    const date = new Date(session.date);
    const dayIndex = date.getDay();
    values[dayIndex] += session.focusedUntilSkipped / 60; //convert to minutes
  });
  
  return { days, values };
}

/**
 * Determines if the performance trend is improving, declining, or neutral
 */
export function determinePerformanceTrend(sessions: Session[]): 'up' | 'down' | 'neutral' {
  if (sessions.length < 4) return 'neutral';
  
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const midpoint = Math.floor(sortedSessions.length / 2);
  const firstHalf = sortedSessions.slice(0, midpoint);
  const secondHalf = sortedSessions.slice(midpoint);
  
  const firstHalfCompletionRate = firstHalf.length > 0 
    ? firstHalf.filter(s => s.sessionCompleted).length / firstHalf.length 
    : 0;
  
  const secondHalfCompletionRate = secondHalf.length > 0 
    ? secondHalf.filter(s => s.sessionCompleted).length / secondHalf.length 
    : 0;
  
  if (secondHalfCompletionRate > firstHalfCompletionRate * 1.1) {
    return 'up';
  } else if (secondHalfCompletionRate < firstHalfCompletionRate * 0.9) {
    return 'down';
  }
  
  return 'neutral';
}

/**
 * Formats seconds into a minutes display string
 */
export function formatMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}