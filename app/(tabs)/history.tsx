import SessionHistoryItem from '@/components/SessionHistoryItem';
import Colors from '@/constants/colors';
import useTimerStore from '@/store/timerStore';
import { Filter, History } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function HistoryScreen() {
  const { sessions, isLoading, loadSessions } = useTimerStore();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');

  //refresh sessions when the screen is focused
  useEffect(() => {
    loadSessions();
  }, []);

  const getFilteredSessions = () => {
    const now = new Date();
    
    switch (filterPeriod) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return sessions.filter(session => new Date(session.createdAt) >= today);
      
      case 'week':
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return sessions.filter(session => new Date(session.createdAt) >= oneWeekAgo);
      
      case 'month':
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return sessions.filter(session => new Date(session.createdAt) >= oneMonthAgo);
      
      default:
        return sessions;
    }
  };

  const filteredSessions = getFilteredSessions();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Session History</Text>
          
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, filterPeriod === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterPeriod('all')}
            >
              <Text style={[styles.filterText, filterPeriod === 'all' && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterPeriod === 'today' && styles.filterButtonActive]}
              onPress={() => setFilterPeriod('today')}
            >
              <Text style={[styles.filterText, filterPeriod === 'today' && styles.filterTextActive]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterPeriod === 'week' && styles.filterButtonActive]}
              onPress={() => setFilterPeriod('week')}
            >
              <Text style={[styles.filterText, filterPeriod === 'week' && styles.filterTextActive]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterPeriod === 'month' && styles.filterButtonActive]}
              onPress={() => setFilterPeriod('month')}
            >
              <Text style={[styles.filterText, filterPeriod === 'month' && styles.filterTextActive]}>Month</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Your Sessions</Text>
            <Filter size={18} color={Colors.text.secondary} />
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading sessions...</Text>
            </View>
          ) : filteredSessions.length > 0 ? (
            filteredSessions
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(session => (
                <SessionHistoryItem key={session.id} session={session} />
              ))
          ) : (
            <View style={styles.emptyState}>
              <History size={50} color={Colors.inactive} />
              <Text style={styles.emptyStateText}>No sessions found</Text>
              <Text style={styles.emptyStateSubtext}>
                Complete focus sessions to see your history here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: Colors.card,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.background,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.card,
    fontWeight: '600',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});