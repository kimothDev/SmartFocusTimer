import Colors from '@/constants/colors';
import useTimerStore from '@/store/timerStore';
import { EnergyLevel } from '@/types';
import { BatteryFull, BatteryLow, BatteryMedium } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EnergyLevelSelector() {
  const { energyLevel, setEnergyLevel, isActive, isBreakTime } = useTimerStore();
  const isTimerRunning = isActive || isBreakTime;

  const handleSelect = (level: EnergyLevel) => {
    setEnergyLevel(level);
  };

  return (
    <View style={styles.slotButton}>
      <View>
        <Text style={styles.slotLabel}>Energy Level</Text>
        <View style={styles.energySelector}>
          <View style={styles.energyButtons}>
            <TouchableOpacity 
              disabled={isTimerRunning}
              style={[
                styles.energyButton,
                energyLevel === 'low' && styles.energyButtonSelected,
                isTimerRunning && { opacity: 0.5 }
              ]}
              onPress={() => !isTimerRunning && handleSelect('low')}
            >
              <BatteryLow 
                size={20} 
                color={energyLevel === 'low' ? Colors.primary : Colors.text.secondary} 
              />
              <Text style={[
                styles.energyText,
                energyLevel === 'low' && styles.energyTextSelected
              ]}>Low</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.energyButton,
                energyLevel === 'mid' && styles.energyButtonSelected,
                isTimerRunning && { opacity: 0.5 }
              ]}
              onPress={() => !isTimerRunning && handleSelect('mid')}
            >
              <BatteryMedium 
                size={20} 
                color={energyLevel === 'mid' ? Colors.primary : Colors.text.secondary} 
              />
              <Text style={[
                styles.energyText,
                energyLevel === 'mid' && styles.energyTextSelected
              ]}>Mid</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.energyButton,
                energyLevel === 'high' && styles.energyButtonSelected,
                isTimerRunning && { opacity: 0.5 }
              ]}
              onPress={() => !isTimerRunning && handleSelect('high')}
            >
              <BatteryFull 
                size={20} 
                color={energyLevel === 'high' ? Colors.primary : Colors.text.secondary} 
              />
              <Text style={[
                styles.energyText,
                energyLevel === 'high' && styles.energyTextSelected
              ]}>High</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slotButton: {
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  slotLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  energySelector: {
    marginTop: 2,
  },
  energyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  energyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  energyButtonSelected: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  energyText: {
    marginLeft: 5,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  energyTextSelected: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
});