import { DEFAULT_FOCUS_TIME, DEFAULT_TASKS, TIME_ADJUSTMENT_STEP, TIMER_CONSTANTS } from '@/constants/timer';
import {
  Context,
  debugModel,
  updateModel
} from '@/services/contextualBandits';
import {
  DBSession,
  deleteAllSessions,
  getAllSessions,
  initDatabase,
  insertSession
} from '@/services/database';
import {
  calculateReward,
  detectTimeOfDay,
  TimeOfDay
} from '@/services/recommendations';
import { getSessionRecommendation } from '@/services/sessionPlanner';
import { EnergyLevel, Session, TimerState } from '@/types';
import { createSessionWithContext, resetTimerState, updateRecommendations } from '@/utils/sessionUtils';
import { normalizeTask } from '@/utils/task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';


const DYNAMIC_ARMS_KEY = 'dynamic_focus_arms';
//for debug
const SPEED_FACTOR = 1000;


//initialize database when the app starts
initDatabase().catch(error => {
  console.error("Failed to initialize database:", error);
});

const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isBreakTime: false,
      time: DEFAULT_FOCUS_TIME,
      initialTime: DEFAULT_FOCUS_TIME,
      focusSessionDuration: DEFAULT_FOCUS_TIME,
      taskType: '',
      energyLevel: '',
      showTimeAdjust: false,
      showCancel: false,
      showSkip: false,
      showTaskModal: false,
      showBreakModal: false,
      showSkipConfirm: false,
      customTask: '',
      previousTasks: DEFAULT_TASKS,
      sessions: [],
      isLoading: false,
      hasInteractedWithTimer: false,
      hasDismissedRecommendationCard: false,
      lastTimestamp: undefined,
      persistedTime: undefined,
      sessionStartTimestamp: undefined,
      includeShortSessions: false,
      dynamicFocusArms: [],
      recommendedDuration: 0,
      userSelectedDuration: 0,
      notificationsEnabled: false,
      hasSavedSession: false,
      
      //add new state field to store the original focus duration
      originalFocusDuration: 0,
      
      //recommendation fields
      recommendedFocusDuration: 25,
      recommendedBreakDuration: 5,
      userAcceptedRecommendation: true,
      selectedBreakDuration: 5,
      timeOfDay: detectTimeOfDay(),


      loadSessions: async () => {
        set({ isLoading: true });
        try {
          const dbSessions = await getAllSessions();
      
          const mappedSessions: Session[] = dbSessions.map((session) => ({
            ...session,
            energyLevel: session.energyLevel as EnergyLevel
          }));
      
          set({ 
            sessions: mappedSessions,
            isLoading: false 
          });
        } catch (error) {
          console.error("Failed to load sessions:", error);
          set({ isLoading: false });
        }
      },

      toggleNotificationsEnabled: () => set(state => ({ notificationsEnabled: !state.notificationsEnabled })),

      toggleHasDismissedRecommendationCard: () => set({ hasDismissedRecommendationCard: true }),

      toggleIncludeShortSessions: () =>
        set(state => ({ includeShortSessions: !state.includeShortSessions })),
      
    
      addDynamicFocusArm: (arm) => {
        const { dynamicFocusArms } = get(); //get current state
        if (dynamicFocusArms.includes(arm)) return;

        const updatedArms = [...dynamicFocusArms, arm];
        set({ dynamicFocusArms: updatedArms });

        //persist after state update
        AsyncStorage.setItem('dynamic_focus_arms', JSON.stringify(updatedArms))
          .catch(err => console.error('Failed to save dynamic arms:', err));
      },

      
      clearAllSessions: async () => {
        set({ isLoading: true });
        try {
          await deleteAllSessions();
          set({ 
            sessions: [],
            isLoading: false 
          });
        } catch (error) {
          console.error("Failed to clear sessions:", error);
          set({ isLoading: false });
        }
      },

      startTimer: () => {
        const { 
          taskType, 
          energyLevel, 
          time, 
          recommendedFocusDuration,
          userAcceptedRecommendation,
          isBreakTime
        } = get();
      
        if (!taskType) {
          alert("Please select a task type before starting the timer.");
          return;
        }
      
        if (!energyLevel) {
          alert("Please select your energy level before starting the timer.");
          return;
        }
      
        const now = Date.now();
      
        //store the original focus duration for later use
        if (!isBreakTime) {
          set({ originalFocusDuration: time });
        }
      
        set({ 
          isActive: true,
          showCancel: true,
          showSkip: false,
          initialTime: time,
          time,
          sessionStartTimestamp: now,
          focusSessionDuration: time,
          hasSavedSession: false,
          userAcceptedRecommendation:
            userAcceptedRecommendation || (time === recommendedFocusDuration * 60),
            
        });
      
        setTimeout(() => {
          if (get().isActive) {
            set({ showCancel: false, showSkip: true });
          }
        }, 10000);
      },

      pauseTimer: () => set({ isActive: false }),

      cancelTimer: () => {
        set({ 
          isActive: false,
          showCancel: false,
          showSkip: false,
          time: get().initialTime,
          sessionStartTimestamp: undefined,
        });
      },

      skipTimer: () => set({ showSkipConfirm: true }),

      completeTimer: async () => {
        const {
          taskType,
          energyLevel,
          recommendedFocusDuration,
          recommendedBreakDuration,
          userAcceptedRecommendation,
          selectedBreakDuration,
          timeOfDay,
          originalFocusDuration,
          isBreakTime
        } = get();
        
        const focusTimeInMinutes = Math.round(originalFocusDuration / 60);
        const breakTimeInMinutes = Math.round(selectedBreakDuration / 60);
      
        if (isBreakTime) {
          const sessionData = {
            taskType,
            energyLevel: energyLevel as EnergyLevel,
            timeOfDay: timeOfDay as TimeOfDay,
            recommendedDuration: recommendedFocusDuration,
            recommendedBreak: recommendedBreakDuration,
            userSelectedDuration: focusTimeInMinutes,
            userSelectedBreak: breakTimeInMinutes,
            acceptedRecommendation: userAcceptedRecommendation,
            sessionCompleted: true,
            focusedUntilSkipped: focusTimeInMinutes,
          };

          const focusContext: Context = {
            taskType,
            energyLevel: energyLevel as EnergyLevel,
            timeOfDay: timeOfDay as TimeOfDay,
          };

          const breakContext: Context = {
            taskType: `${taskType}-break`,
            energyLevel: energyLevel as EnergyLevel,
            timeOfDay: timeOfDay as TimeOfDay,
          };

          const { hasSavedSession, setHasSavedSession } = get();
          if (hasSavedSession) return;
          setHasSavedSession(true);

          try {
            // Log only one session for the focus+break cycle
            const newSession = await createSessionWithContext(focusContext, sessionData, get());
            // Update the break model so it still learns
            await updateModel(breakContext, breakTimeInMinutes, newSession.reward);
          } catch (error) {
            console.error('❌ Error inserting completed session:', error);
          }
        }
      
        resetTimerState(set);
      },

      skipFocusSession: async () => {
        const {
          initialTime,
          time,
          taskType,
          energyLevel,
          timeOfDay,
          recommendedFocusDuration,
          recommendedBreakDuration,
          userAcceptedRecommendation,
          loadSessions,
          focusSessionDuration,
          originalFocusDuration
        } = get();
      
        const elapsedSeconds = get().focusSessionDuration - time;
        const focusTimeInMinutes = Math.round(elapsedSeconds / 60);
        const totalFocusDuration = Math.round(originalFocusDuration / 60);
      
        if (isNaN(focusTimeInMinutes) || focusTimeInMinutes < 0) {
          console.warn('Invalid skip time:', { initialTime, time, elapsedSeconds });
          return;
        }
      
        const sessionData = {
          taskType,
          energyLevel: energyLevel as EnergyLevel,
          timeOfDay: timeOfDay as TimeOfDay,
          recommendedDuration: recommendedFocusDuration,
          recommendedBreak: recommendedBreakDuration,
          userSelectedDuration: totalFocusDuration,
          userSelectedBreak: 0,
          acceptedRecommendation: userAcceptedRecommendation,
          sessionCompleted: false,
          focusedUntilSkipped: focusTimeInMinutes,
          skipReason: 'skippedFocus' as const,
        };

        const context: Context = {
          taskType,
          energyLevel: energyLevel as EnergyLevel,
          timeOfDay: timeOfDay as TimeOfDay,
        };

        const { hasSavedSession, setHasSavedSession } = get();
        if (hasSavedSession) return;
        setHasSavedSession(true);

        try {
          await createSessionWithContext(context, sessionData, get());
        } catch (error) {
          console.error('❌ Error inserting skipped session:', error);
        }
      
        resetTimerState(set);
      },

      adjustTime: (direction) => {
        const { includeShortSessions } = get();
        const currentTime = get().time;
        const currentMinutes = Math.floor(currentTime / 60);
        
        //use constants from TIMER_CONSTANTS
        const minMinutes = includeShortSessions 
          ? TIMER_CONSTANTS.ADHD.MIN_FOCUS / 60 
          : TIMER_CONSTANTS.DEFAULT.MIN_FOCUS / 60;
        const maxMinutes = includeShortSessions 
          ? TIMER_CONSTANTS.ADHD.MAX_FOCUS / 60 
          : TIMER_CONSTANTS.DEFAULT.MAX_FOCUS / 60;
        
        let newMinutes = direction === 'up' 
          ? Math.min(maxMinutes, currentMinutes + TIME_ADJUSTMENT_STEP / 60)
          : Math.max(minMinutes, currentMinutes - TIME_ADJUSTMENT_STEP / 60);
        
        const newTime = newMinutes * 60;
        
        set({ 
          time: newTime,
          initialTime: newTime,
          userAcceptedRecommendation: true
        });
      },

      setTaskType: (task) => {
        set({ taskType: task, showTaskModal: false });
        
        //use updateRecommendations utility
        const { energyLevel, timeOfDay } = get();
        if (energyLevel) {
          updateRecommendations(energyLevel, timeOfDay as TimeOfDay, task, set);
        }
      },

      setEnergyLevel: (level) => {
        set({ energyLevel: level });
        
        //use updateRecommendations utility
        const { taskType, timeOfDay } = get();
        if (level) {
          if (taskType) {
            updateRecommendations(level, timeOfDay as TimeOfDay, taskType, set);
          } else {
            set({
              recommendedFocusDuration: 25,
              recommendedBreakDuration: 5,
              time: 25 * 60,
              initialTime: 25 * 60,
              userAcceptedRecommendation: true
            });
          }
        }
      },

      addCustomTask: (task) => {
        const normalized = normalizeTask(task);
        if (!normalized) return;
      
        const isDefaultTask = DEFAULT_TASKS.map(normalizeTask).includes(normalized);
      
        if (!isDefaultTask) {
          set(state => {
            const updatedTasks = [
              normalized,
              ...state.previousTasks.filter(t => normalizeTask(t) !== normalized)
            ];
            return {
              previousTasks: updatedTasks,
              taskType: normalized,
              customTask: '',
              showTaskModal: false
            };
          });
        } else {
          set({
            taskType: normalized,
            customTask: '',
            showTaskModal: false
          });
        }
      
        const { energyLevel, timeOfDay } = get();
        if (energyLevel) {
          getSessionRecommendation(energyLevel, timeOfDay as TimeOfDay, normalized)
            .then(({ focusDuration, breakDuration }) => {
              set({
                recommendedFocusDuration: focusDuration,
                recommendedBreakDuration: breakDuration,
                time: focusDuration * 60,
                initialTime: focusDuration * 60,
                userAcceptedRecommendation: true
              });
            })
            .catch(error => {
              console.error("Error getting session recommendation:", error);
            });
        }
      },

      getLiveTime: () => {
        const { isActive, sessionStartTimestamp, initialTime } = get();
        if (!isActive || !sessionStartTimestamp) return initialTime;
        const elapsed = Math.floor((Date.now() - sessionStartTimestamp) / 1000) * SPEED_FACTOR;
        return Math.max(initialTime - elapsed, 0);
      },
      
      
      removeCustomTask: (taskToRemove: string) =>
        set(state => ({
          previousTasks: state.previousTasks.filter(
            task => task !== taskToRemove
          ),
        })),
    
        startBreak: async (duration) => {
          const {
            taskType,
            energyLevel,
            timeOfDay,
            recommendedFocusDuration,
            recommendedBreakDuration,
            userAcceptedRecommendation,
            originalFocusDuration
          } = get();
 
          if (duration === 0) {
            const remainingFocus = get().time;
            const elapsedFocusSeconds = get().focusSessionDuration - remainingFocus;
            const focusTimeInMinutes = Math.round(elapsedFocusSeconds / 60);
            const totalFocusDuration = Math.round(originalFocusDuration / 60);
        
            const newSession: Omit<DBSession, 'id'> = {
              taskType,
              energyLevel,
              timeOfDay,
              recommendedDuration: recommendedFocusDuration,
              recommendedBreak: recommendedBreakDuration,
              userSelectedDuration: totalFocusDuration,
              userSelectedBreak: 0,
              acceptedRecommendation: userAcceptedRecommendation,
              sessionCompleted: false,
              focusedUntilSkipped: focusTimeInMinutes,
              reward: calculateReward(
                false,
                userAcceptedRecommendation,
                focusTimeInMinutes,
                totalFocusDuration,
                recommendedFocusDuration,
                'skippedBreak'
              ),
              date: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              skipReason: 'skippedBreak',
            };
            const { hasSavedSession, setHasSavedSession } = get();
            if (hasSavedSession) return;
            setHasSavedSession(true);
        
            try {
              await insertSession(newSession);
        
              //update model for focus session
              const focusContext: Context = {
                taskType,
                energyLevel: energyLevel as EnergyLevel,
                timeOfDay: timeOfDay as TimeOfDay,
              };
              await updateModel(focusContext, focusTimeInMinutes, newSession.reward);
              
              //update model for break session
              const breakContext: Context = {
                taskType: `${taskType}-break`,
                energyLevel: energyLevel as EnergyLevel,
                timeOfDay: timeOfDay as TimeOfDay,
              };
              await updateModel(breakContext, 0, newSession.reward); //0 minutes for skipped break
              
              get().loadSessions();
              await debugModel();
            } catch (error) {
              console.error("Failed to save session with skipped break:", error);
            }
        
            resetTimerState(set);
        
            return;
          }

          set({
            time: duration,
            initialTime: duration,
            isBreakTime: true,
            isActive: true,
            selectedBreakDuration: duration,
            showBreakModal: false,
          });
        
          get().startTimer();
        },                

      toggleTimeAdjust: () => {
          const { isActive, showTimeAdjust } = get();
          if (!isActive) {
            set({ 
              showTimeAdjust: !showTimeAdjust,
              userAcceptedRecommendation: false, //user is customizing the time
              hasInteractedWithTimer: true,
              
          });
        } 
      },

      toggleTaskModal: (show) => set({ showTaskModal: show }),

      toggleBreakModal: (show) => set({ showBreakModal: show }),

      toggleSkipConfirm: (show) => set({ showSkipConfirm: show }),

      resetTimer: () => {
        //update time of day when resetting
        const timeOfDay = detectTimeOfDay();
        const { energyLevel, taskType } = get();
        
        let recommendedFocusDuration = 25;
        let recommendedBreakDuration = 5;
        
        if (energyLevel && taskType) {
          getSessionRecommendation(energyLevel, timeOfDay as TimeOfDay, taskType)
            .then(({ focusDuration, breakDuration }) => {
              set({
                recommendedFocusDuration: focusDuration,
                recommendedBreakDuration: breakDuration,
                time: focusDuration * 60,
                initialTime: focusDuration * 60,
              });
            })
            .catch(error => {
              console.error("Error getting session recommendation:", error);
              set({
                recommendedFocusDuration: 25,
                recommendedBreakDuration: 5,
                time: 25 * 60,
                initialTime: 25 * 60,
              });
            });
        } else {
          //fallback if no energy/taskType
          set({
            recommendedFocusDuration: 25,
            recommendedBreakDuration: 5,
            time: 25 * 60,
            initialTime: 25 * 60,
          });
        }
        
        
        set({
          isActive: false,
          isBreakTime: false,
          showTimeAdjust: false,
          showCancel: false,
          showSkip: false,
          showTaskModal: false,
          showBreakModal: false,
          showSkipConfirm: false,
          timeOfDay,
          recommendedBreakDuration,
          userAcceptedRecommendation: true,
          originalFocusDuration: 0,
          hasSavedSession: false
        });
      },
      
      acceptRecommendation: () => {
        const { recommendedFocusDuration } = get();
        set({
          time: recommendedFocusDuration * 60,
          initialTime: recommendedFocusDuration * 60,
          userAcceptedRecommendation: true,
          hasInteractedWithTimer: false
        });
      },
      
      rejectRecommendation: () => {
        set({
          userAcceptedRecommendation: false,
          hasInteractedWithTimer: false
        });
      },
      
      setSelectedBreakDuration: (duration) => {
        set({
          selectedBreakDuration: duration
        });
      },
      // for debug
      restoreTimerState: () => {
        const state = get();
        const {
          isActive,
          sessionStartTimestamp,
          initialTime,
          isBreakTime,
          notificationsEnabled,
          focusSessionDuration,
          originalFocusDuration, //add this to preserve the original focus duration
        } = state;
      
        if (!isActive || !sessionStartTimestamp) return;
      
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTimestamp) / 1000) * SPEED_FACTOR;
        const remaining = initialTime - elapsed;
      
        if (remaining <= 0) {
          //session has ended
          //console.log("📣 SENDING NOTIFICATION...");
          const isBreakEnding = isBreakTime;
      
          //notify + vibrate
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (notificationsEnabled) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: isBreakEnding ? "🧘 Break Over!" : "⏱ Focus Complete!",
                body: isBreakEnding ? "Ready for another focus session?" : "Time to take a break.",
                sound: true,
              },
              trigger: Platform.OS === 'android' ? { channelId: 'default', seconds: 1 } : null,
            });
          }
      
          if (!isBreakEnding) {
            //make sure we keep track of the original focus duration
            set({
              time: 0,
              isActive: false,
              isBreakTime: true,
              showBreakModal: true,
              sessionStartTimestamp: undefined,
              focusSessionDuration,
              originalFocusDuration, //preserve the original focus duration
            });
            return;
          }
      
          //if break just ended → treat as full session completed
          get().completeTimer();
        } else {
          set({
            time: remaining,
            isActive: true,
          });
        }
      },      
      
      
      setHasInteractedWithTimer: (value:boolean) => set({ hasInteractedWithTimer: value }),
      setHasDismissedRecommendationCard: (value: boolean) => set({ hasDismissedRecommendationCard: value }),
      setHasSavedSession: (val: boolean) => set({ hasSavedSession: val }),

    }),
    {
      name: 'timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        previousTasks: state.previousTasks,
        includeShortSessions: state.includeShortSessions,
        dynamicFocusArms: state.dynamicFocusArms,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);

//load sessions when the store is initialized
useTimerStore.getState().loadSessions();

export default useTimerStore;

//One-time initializer for default tasks
const existingTasks = useTimerStore.getState().previousTasks;
if (!existingTasks || existingTasks.length === 0) {
  useTimerStore.setState({ previousTasks: DEFAULT_TASKS });
}

export const loadDynamicFocusArms = async () => {
  try {
    const stored = await AsyncStorage.getItem(DYNAMIC_ARMS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        useTimerStore.setState({ dynamicFocusArms: parsed });
      }
    }
  } catch (err) {
    console.error('Failed to load dynamic focus arms:', err);
  }
};
