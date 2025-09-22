import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function ChatInput({ value, onChangeText, onSend, disabled }) {
  return (
    <View style={styles.inputRow}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder="메시지를 입력하세요..."
        editable={!disabled}
        onSubmitEditing={onSend}
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={disabled || !value.trim()}
        style={[styles.button, (disabled || !value.trim()) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>전송</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});