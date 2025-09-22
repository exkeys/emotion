import React from 'react';
import { Calendar } from 'react-native-calendars';

export default function CalendarView({ markedDates, onDayPress }) {
  return (
    <Calendar
      onDayPress={onDayPress}
      markedDates={{
        ...Object.fromEntries(
          Object.entries(markedDates || {}).map(([date, rec]) => [date, { marked: true }])
        )
      }}
    />
  );
}
