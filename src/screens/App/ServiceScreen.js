import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { styles } from '../../config/styles.js';

export default function ServiceScreen({ navigation }) {
  const [selectedService, setSelectedService] = useState(null);
  const services = [{ name: 'Médico' }, { name: 'Dentista' }, { name: 'Enfermeira' }, { name: 'Vacina' }];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {services.map((service) => (
          <TouchableOpacity key={service.name} style={[styles.serviceButton, selectedService === service.name && styles.selectedService]} onPress={() => setSelectedService(service.name)}>
            <Text style={styles.serviceText}>{service.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.button, !selectedService && styles.buttonDisabled]} disabled={!selectedService} onPress={() => navigation.navigate('SelectDate', { service: selectedService })}>
          <Text style={styles.buttonText}>Avançar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};