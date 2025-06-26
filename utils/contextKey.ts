import { Context } from '@/services/contextualBandits';

export function createContextKey(context: Context): string {
  return `${context.taskType}|${context.energyLevel}|${context.timeOfDay}`;
}

export function createContextKeyFromParts(
  taskType: string | undefined,
  energyLevel: string,
  timeOfDay: string,
  isBreak: boolean = false
): string {
  const baseKey = `${taskType?.toLowerCase() || 'default'}|${energyLevel}|${timeOfDay}`;
  return isBreak ? `${baseKey}-break` : baseKey;
} 