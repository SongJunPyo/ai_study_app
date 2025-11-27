import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';

interface ReviewRecord {
  date: string;
  score: number;
  correctCount: number;
  totalCount: number;
}

interface ReviewCalendarProps {
  reviewHistory?: ReviewRecord[];
  nextReview?: string | null; // YYYY-MM-DD format
}

export default function ReviewCalendar({ reviewHistory = [], nextReview = null }: ReviewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get year and month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Check if date has review
  const hasReview = (day: number) => {
    return reviewHistory.some(review => {
      const reviewDate = new Date(review.date);
      return (
        reviewDate.getFullYear() === year &&
        reviewDate.getMonth() === month &&
        reviewDate.getDate() === day
      );
    });
  };

  // Get review for a specific day
  const getReview = (day: number) => {
    return reviewHistory.find(review => {
      const reviewDate = new Date(review.date);
      return (
        reviewDate.getFullYear() === year &&
        reviewDate.getMonth() === month &&
        reviewDate.getDate() === day
      );
    });
  };

  // Check if date is next review date
  const isNextReview = (day: number) => {
    if (!nextReview) return false;
    const nextReviewDate = new Date(nextReview);
    return (
      nextReviewDate.getFullYear() === year &&
      nextReviewDate.getMonth() === month &&
      nextReviewDate.getDate() === day
    );
  };

  // Generate calendar days
  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const review = getReview(day);
      const isToday =
        new Date().getFullYear() === year &&
        new Date().getMonth() === month &&
        new Date().getDate() === day;
      const isNext = isNextReview(day);

      days.push(
        <View
          key={day}
          style={[
            styles.dayCell,
            review && styles.dayCellReviewed,
            isNext && styles.dayCellNextReview,
            isToday && styles.dayCellToday,
          ]}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.dayTextToday,
            isNext && styles.dayTextNextReview
          ]}>
            {day}
          </Text>
          {review && (
            <Text style={styles.checkMark}>✅</Text>
          )}
          {isNext && !review && (
            <Text style={styles.nextReviewMark}>📌</Text>
          )}
        </View>
      );
    }

    return days;
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {year}년 {monthNames[month]}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Week days header */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={day} style={styles.weekDayCell}>
            <Text
              style={[
                styles.weekDayText,
                index === 0 && styles.weekDayTextSunday,
                index === 6 && styles.weekDayTextSaturday,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBoxReviewed]} />
          <Text style={styles.legendText}>복습 완료</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBoxNextReview]} />
          <Text style={styles.legendText}>다음 복습</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBoxToday]} />
          <Text style={styles.legendText}>오늘</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  navButtonText: {
    fontSize: 20,
    color: '#333',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  // Week days
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  weekDayTextSunday: {
    color: '#FF3B30',
  },
  weekDayTextSaturday: {
    color: '#007AFF',
  },
  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayCellReviewed: {
    backgroundColor: '#E8F5E9',
  },
  dayCellNextReview: {
    backgroundColor: '#FFF3E0',
  },
  dayCellToday: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  dayTextToday: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dayTextNextReview: {
    fontWeight: '600',
    color: '#FF9800',
  },
  checkMark: {
    fontSize: 16,
    marginTop: 2,
  },
  nextReviewMark: {
    fontSize: 16,
    marginTop: 2,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendBoxReviewed: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
  },
  legendBoxNextReview: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  legendBoxToday: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
