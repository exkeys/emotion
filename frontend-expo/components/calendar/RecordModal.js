import React from 'react';
import { Modal, View, Text, Button, TextInput, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function RecordModal({
  visible,
  selectedDate,
  fatigue,
  note,
  loading,
  onFatigueChange,
  onNoteChange,
  onSave,
  onClose
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <Text style={styles.modalTitle} role="heading" nativeID="modal-title">
            {selectedDate} 피곤함 기록
          </Text>
          
          <Text>피곤함 정도: {fatigue}</Text>
          
          <Slider
            style={{ width: 200, height: 40 }}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={fatigue}
            onValueChange={onFatigueChange}
            minimumTrackTintColor="#1EB1FC"
            maximumTrackTintColor="#1EB1FC"
            accessible={true}
            accessibilityLabel={`피곤함 정도 슬라이더: ${fatigue}`}
            accessibilityRole="adjustable"
            accessibilityValue={{ min: 1, max: 10, now: fatigue }}
          />
          <TextInput
            style={styles.input}
            placeholder="메모를 입력하세요"
            value={note}
            onChangeText={onNoteChange}
            accessible={true}
            accessibilityLabel="메모 입력"
            accessibilityHint="피곤함에 대한 메모를 입력하세요"
          />
          <Button 
            title="저장" 
            onPress={onSave} 
            disabled={loading} 
            accessibilityLabel="저장하기" 
          />
          <Button 
            title="닫기" 
            onPress={onClose} 
            accessibilityLabel="모달 닫기" 
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 300,
    minHeight: 200
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 10
  }
});