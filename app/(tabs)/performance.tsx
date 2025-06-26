import Colors from '@/constants/colors';
import useTimerStore from '@/store/timerStore';
import { TimeRange } from '@/types';
import { calculateCompletionRate, filterSessionsByDateRange, findBestEnergyLevel, findMostProductiveTask } from '@/utils/performanceUtils';
import { ArrowDownRight, ArrowUpRight, Award, Battery, BatteryFull, BatteryLow, BatteryMedium, Calendar, Clock, Target, TrendingUp, Zap } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

//utility to map energy level to battery icon and color
const getEnergyLevelProps = (level: string) => {
  switch (level) {
    case 'high':
      return { color: Colors.success, icon: <BatteryFull size={20} color={Colors.card} />, label: 'High energy' };
    case 'mid':
      return { color: Colors.warning, icon: <BatteryMedium size={20} color={Colors.card} />, label: 'Mid energy' };
    case 'low':
      return { color: Colors.error, icon: <BatteryLow size={20} color={Colors.card} />, label: 'Low energy' };
    default:
      return { color: Colors.inactive, icon: <Battery size={20} color={Colors.card} />, label: 'Not enough data' };
  }
};

export default function PerformanceScreen() {
  const { sessions, isLoading } = useTimerStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Get filtered sessions based on time range
  const filteredSessions = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    return filterSessionsByDateRange(sessions, days);
  }, [sessions, timeRange]);

  //calculate performance metrics
  const metrics = useMemo(() => {
    if (filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalFocusTime: 0,
        avgSessionLength: 0,
        completionRate: 0,
        mostProductiveTask: 'N/A',
        bestEnergyLevel: 'N/A',
        dailyAverage: 0,
        trend: 'neutral',
        avgReward: 0,
        recommendationAcceptanceRate: 0,
      };
    }

    const completed = filteredSessions.filter(s => s.sessionCompleted);
    const totalFocusTime = filteredSessions.reduce((acc, s) => {
      return acc + (s.sessionCompleted ? s.userSelectedDuration : s.focusedUntilSkipped);
    }, 0);
    
    const avgSessionLength = totalFocusTime / filteredSessions.length;
    const completionRate = calculateCompletionRate(filteredSessions);
    const mostProductiveTask = findMostProductiveTask(filteredSessions);
    const bestEnergyLevel = findBestEnergyLevel(filteredSessions);

    //calculate daily average
    const uniqueDays = new Set(
      filteredSessions.map(s => new Date(s.createdAt).toDateString())
    );
    const dailyAverage = filteredSessions.length / uniqueDays.size;

    //calculate average reward
    const totalReward = filteredSessions.reduce((acc, s) => acc + s.reward, 0);
    const avgReward = totalReward / filteredSessions.length;

    // --- IMPROVED: Smart Recommendation Acceptance Rate ---
    //only count focus sessions (not breaks), with a valid recommendedDuration, and user made a choice
    const recommendationSessions = filteredSessions.filter(
      s =>
        s.recommendedDuration &&
        s.recommendedDuration > 0 &&
        !s.taskType.endsWith('-break') &&
        s.userSelectedDuration > 0 // user made a choice
    );
    const acceptedRecommendations = recommendationSessions.filter(
      s => s.acceptedRecommendation && s.userSelectedDuration === s.recommendedDuration
    ).length;
    const recommendationAcceptanceRate = recommendationSessions.length > 0
      ? (acceptedRecommendations / recommendationSessions.length) * 100
      : 0;

    //determine trend (comparing first half to second half of the period)
    const sortedSessions = [...filteredSessions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const midpoint = Math.floor(sortedSessions.length / 2);
    const firstHalf = sortedSessions.slice(0, midpoint);
    const secondHalf = sortedSessions.slice(midpoint);

    const firstHalfCompletionRate = calculateCompletionRate(firstHalf);
    const secondHalfCompletionRate = calculateCompletionRate(secondHalf);

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (secondHalfCompletionRate > firstHalfCompletionRate * 1.1) {
      trend = 'up';
    } else if (secondHalfCompletionRate < firstHalfCompletionRate * 0.9) {
      trend = 'down';
    }

    return {
      totalSessions: filteredSessions.length,
      completedSessions: completed.length,
      totalFocusTime,
      avgSessionLength,
      completionRate,
      mostProductiveTask,
      bestEnergyLevel,
      dailyAverage,
      trend,
      avgReward,
      recommendationAcceptanceRate,
    };
  }, [filteredSessions]);

  //generate bar chart data for daily focus time
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = Array(7).fill(0);
    
    filteredSessions.forEach(session => {
      const date = new Date(session.createdAt);
      const dayIndex = date.getDay();
      dayData[dayIndex] += session.sessionCompleted ? 
        session.userSelectedDuration : 
        session.focusedUntilSkipped;
    });
    
    const maxValue = Math.max(...dayData, 1); //ensure at least 1 for scaling
    
    return {
      days,
      values: dayData,
      maxValue
    };
  }, [filteredSessions]);

  //format time in minutes
  const formatMinutes = (minutes: number) => {
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance Analytics</Text>
          
          <View style={styles.timeRangeSelector}>
            <TouchableOpacity 
              style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeActive]}
              onPress={() => setTimeRange('week')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeActive]}
              onPress={() => setTimeRange('month')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeRangeButton, timeRange === 'year' && styles.timeRangeActive]}
              onPress={() => setTimeRange('year')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'year' && styles.timeRangeTextActive]}>Year</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Focus Summary</Text>
            {metrics.trend === 'up' && (
              <View style={styles.trendBadge}>
                <ArrowUpRight size={14} color={Colors.success} />
                <Text style={[styles.trendText, { color: Colors.success }]}>Improving</Text>
              </View>
            )}
            {metrics.trend === 'down' && (
              <View style={styles.trendBadge}>
                <ArrowDownRight size={14} color={Colors.error} />
                <Text style={[styles.trendText, { color: Colors.error }]}>Declining</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Clock size={20} color={Colors.primary} />
              <Text style={styles.metricValue}>{formatMinutes(metrics.totalFocusTime)}</Text>
              <Text style={styles.metricLabel}>Total Focus</Text>
            </View>
            <View style={styles.metricItem}>
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.metricValue}>{metrics.totalSessions}</Text>
              <Text style={styles.metricLabel}>Sessions</Text>
            </View>
            <View style={styles.metricItem}>
              <Target size={20} color={Colors.primary} />
              <Text style={styles.metricValue}>{Math.round(metrics.completionRate)}%</Text>
              <Text style={styles.metricLabel}>Completion</Text>
            </View>
          </View>
        </View>

        {/* daily focus chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Focus Time</Text>
          <View style={styles.chartContainer}>
            {chartData.days.map((day, index) => (
              <View key={day} style={styles.chartColumn}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: `${(chartData.values[index] / chartData.maxValue) * 100}%`,
                        backgroundColor: chartData.values[index] > 0 ? Colors.primary : Colors.inactive
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{day}</Text>
                <Text style={styles.barValue}>{Math.round(chartData.values[index])}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Performance Insights</Text>
          {/* most productive task */}
          <View style={styles.insightItem}>
            <View style={[styles.insightIconContainer, { backgroundColor: Colors.primary }]}>
              <Award size={20} color={Colors.card} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Most Productive Task</Text>
              <Text style={styles.insightValue}>{metrics.mostProductiveTask}</Text>
            </View>
          </View>
          {/* typical energy level */}
          {(() => {
            const { color, icon, label } = getEnergyLevelProps(metrics.bestEnergyLevel);
            return (
              <View style={[styles.insightItem]}>
                <View style={[styles.insightIconContainer, { backgroundColor: color }]}>
                  {icon}
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Typical Energy Level</Text>
                  <Text style={styles.insightValue}>{label}</Text>
                </View>
              </View>
            );
          })()}
          {/* average session length */}
          <View style={styles.insightItem}>
            <View style={[styles.insightIconContainer, { backgroundColor: Colors.warning }]}>
              <Clock size={20} color={Colors.card} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Average Session Length</Text>
              <Text style={styles.insightValue}>
                {metrics.avgSessionLength > 0 
                  ? formatMinutes(Math.round(metrics.avgSessionLength)) 
                  : 'Not enough data'}
              </Text>
            </View>
          </View>
          {/* smart recommendations */}
          <View style={styles.insightItem}>
            <View style={[styles.insightIconContainer, { backgroundColor: Colors.success }]}>
              <Zap size={20} color={Colors.card} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Smart Recommendations</Text>
              <Text style={styles.insightValue}>
                {metrics.recommendationAcceptanceRate > 0 
                  ? `${Math.round(metrics.recommendationAcceptanceRate)}% accepted` 
                  : 'Not enough data'}
              </Text>
            </View>
          </View>
        </View>

        {/* empty state for no data */}
        {filteredSessions.length === 0 && (
          <View style={styles.emptyState}>
            <TrendingUp size={50} color={Colors.inactive} />
            <Text style={styles.emptyStateTitle}>No data available</Text>
            <Text style={styles.emptyStateText}>
              Complete focus sessions to see your performance analytics
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: Colors.card,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  timeRangeActive: {
    backgroundColor: Colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  timeRangeTextActive: {
    color: Colors.card,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 150,
    width: 20,
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
  insightsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.card,
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});