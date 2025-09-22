import React from 'react';
import { ScrollView } from 'react-native';
import ChatMessage from './ChatMessage';

export default function MessageList({ messages }) {
  return (
    <ScrollView>
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg.content} isUser={msg.role === 'user'} />
      ))}
    </ScrollView>
  );
}
