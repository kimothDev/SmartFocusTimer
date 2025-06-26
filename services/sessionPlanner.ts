import { EnergyLevel } from '@/types';
import { getSmartBreakRecommendation, getSmartRecommendation } from './contextualBandits';
import { FocusRecommendation, getRecommendations, TimeOfDay } from './recommendations';

/**
 * Get a complete session recommendation, combining
 * rule-based logic with personalized learning using contextual bandits.
 *
 * @param context - Includes taskType, energyLevel, timeOfDay
 * @returns { focusDuration, breakDuration } both in minutes
 */
export const getSessionRecommendation = async (
  energyLevel: EnergyLevel,
  timeOfDay: TimeOfDay,
  taskType?: string
): Promise<FocusRecommendation> => {
  //get base recommendation from rule-based system
  const baseRecommendation = await getRecommendations(energyLevel, timeOfDay, taskType);

  //get smart recommendation from contextual bandits
  const smartFocus = await getSmartRecommendation(
    { energyLevel, timeOfDay, taskType: taskType || 'default' },
    baseRecommendation.focusDuration
  );
  const smartBreak = await getSmartBreakRecommendation(
    { energyLevel, timeOfDay, taskType: taskType || 'default' },
    baseRecommendation.breakDuration
  );

  return {
    focusDuration: smartFocus.value,
    breakDuration: smartBreak.value
  };
};
