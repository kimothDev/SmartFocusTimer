import Colors from '@/constants/colors';
import { EnergyLevel, Session } from '@/types';
import { Award, BatteryFull, BatteryLow, BatteryMedium, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SessionHistoryItemProps {
  session: Session;
}

export default function SessionHistoryItem({ session }: SessionHistoryItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };

  const renderEnergyIcon = (level: EnergyLevel) => {
    switch (level) {
      case 'low':
        return <BatteryLow size={16} color={Colors.text.secondary} />;
      case 'mid':
        return <BatteryMedium size={16} color={Colors.text.secondary} />;
      case 'high':
        return <BatteryFull size={16} color={Colors.text.secondary} />;
      default:
        return null;
    }
  };

  const renderReward = (reward: number, sessionCompleted: boolean): JSX.Element => {
    let color = Colors.inactive;
    let text = 'No reward';
  
    if (sessionCompleted) {
      if (reward >= 1.0) {
        color = Colors.success;
        text = 'Perfect!';
      } else if (reward >= 0.8) {
        color = Colors.primary;
        text = 'Good job!';
      }
    } else {
      if (reward >= 0.5) {
        color = Colors.warning;
        text = 'Almost there!';
      } else if (reward >= 0.3) {
        color = Colors.warning;
        text = 'Nice try';
      } else if (reward > 0) {
        color = Colors.warning;
        text = 'Started';
      }
    }
  
    return (
      <View style={styles.rewardContainer}>
        <Award size={16} color={color} />
        <Text style={[styles.rewardText, { color }]}>{text}</Text>
      </View>
    );
  };
  

  const getSessionStatus = () => {
    if (session.sessionCompleted) {
      return {
        status: 'Completed',
        color: Colors.success,
        icon: <CheckCircle size={16} color={Colors.success} />,
      };
    }
  
    switch (session.skipReason) {
      case 'skippedFocus':
        return {
          status: 'Focus Skipped',
          color: Colors.error,
          icon: <XCircle size={16} color={Colors.error} />,
        };
      case 'skippedBreak':
        return {
          status: 'Break Skipped',
          color: Colors.warning,
          icon: <XCircle size={16} color={Colors.warning} />,
        };
      default:
        return {
          status: 'Skipped',
          color: Colors.error,
          icon: <XCircle size={16} color={Colors.error} />,
        };
    }
  };
  
  
  

  const { status, color, icon } = getSessionStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.taskType}>{session.taskType}</Text>
        <Text style={styles.date}>{formatDate(session.createdAt)}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Clock size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              {formatDuration(session.focusedUntilSkipped)}
              {/* {session.acceptedRecommendation && 
                <Text style={styles.recommendedTag}> (Recommended)</Text>
              } */}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            {renderEnergyIcon(session.energyLevel as EnergyLevel)}
            <Text style={styles.detailText}>
              {session.energyLevel || 'Not set'}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            {icon}
            <Text style={[styles.detailText, { color }]}>
              {status}
            </Text>
          </View>
          
          {renderReward(session.reward, session.sessionCompleted)}
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  date: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  recommendedTag: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});