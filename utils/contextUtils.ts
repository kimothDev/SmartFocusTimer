import { Context } from '@/services/contextualBandits';
 
export const createContextKey = (context: Context): string =>
  `${context.taskType}|${context.energyLevel}|${context.timeOfDay}`; 