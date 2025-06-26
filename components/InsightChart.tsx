import Colors from '@/constants/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color?: string;
}

export default function InsightCard({ 
  icon, 
  title, 
  value, 
  color = Colors.primary 
}: InsightCardProps) {
  return (
    <View style={styles.insightItem}>
      <View style={[styles.insightIconContainer, { backgroundColor: color }]}>
        {icon}
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightLabel}>{title}</Text>
        <Text style={styles.insightValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});