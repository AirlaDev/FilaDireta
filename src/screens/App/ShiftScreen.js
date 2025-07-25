import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { styles } from '../../config/styles.js';

export default function ShiftScreen({ navigation, route }) {
  const { service } = route.params;
  const shifts = ['Manhã (07h às 11h)', 'Tarde (13h às 15h)'];

  const handleShiftSelection = (shift) => {
    const selectedShift = shift.split(' ')[0];
    navigation.navigate('SelectDate', { service, shift: selectedShift });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.authTitle}>Escolha o Turno</Text>
        {shifts.map((shift) => (
          <TouchableOpacity
            key={shift}
            style={styles.serviceButton}
            onPress={() => handleShiftSelection(shift)}
          >
            <Text style={styles.serviceText}>{shift}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}