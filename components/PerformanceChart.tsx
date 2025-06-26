import Colors from '@/constants/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PerformanceChartProps {
  data: {
    label: string;
    value: number;
  }[];
  maxValue?: number;
  barColor?: string;
  barWidth?: number;
  height?: number;
}

export default function PerformanceChart({
  data,
  maxValue: propMaxValue,
  barColor = Colors.primary,
  barWidth = 20,
  height = 150
}: PerformanceChartProps) {
  //calculate max value if not provided
  const maxValue = propMaxValue || Math.max(...data.map(item => item.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      {data.map((item, index) => (
        <View key={index} style={styles.barColumn}>
          <View style={[styles.barContainer, { height: height * 0.8 }]}>
            <View 
              style={[
                styles.bar, 
                { 
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.value > 0 ? barColor : Colors.inactive,
                  width: barWidth
                }
              ]} 
            />
          </View>
          <Text style={styles.barLabel}>{item.label}</Text>
          <Text style={styles.barValue}>{Math.round(item.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  barLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  barValue: {
    fontSize: 10,
    color: Colors.text.light,
    marginTop: 2,
  },
});