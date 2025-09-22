import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function LoadingSpinner({ size = 'large', color = '#007bff' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});