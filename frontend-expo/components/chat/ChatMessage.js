import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatMessage({ message, isUser }) {
  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={{ color: isUser ? 'white' : 'black', lineHeight: 20 }}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    marginVertical: 5,
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 15,
  },
  userBubble: {
    backgroundColor: '#007bff',
  },
  aiBubble: {
    backgroundColor: '#e9ecef',
  },
});