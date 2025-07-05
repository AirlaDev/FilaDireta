import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { styles } from '../../config/styles.js';

const DAILY_LIMIT = 10;

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: "Hoje"
};
LocaleConfig.defaultLocale = 'pt-br';

export default function DateScreen({ navigation, route }) {
  const { service } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [appointmentsCount, setAppointmentsCount] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const q = query(collection(db, "appointments"));
      const querySnapshot = await getDocs(q);
      const counts = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        counts[data.date] = (counts[data.date] || 0) + 1;
      });
      setAppointmentsCount(counts);
      setLoading(false);
    };
    fetchAppointments();
  }, []);

  const markedDates = {};
  for (const date in appointmentsCount) {
    if (appointmentsCount[date] >= DAILY_LIMIT) {
      markedDates[date] = { disabled: true, disableTouchEvent: true, marked: true, dotColor: 'red' };
    } else {
      markedDates[date] = { marked: true, dotColor: 'green' };
    }
  }
  
  if (selectedDate) {
      markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: '#007AFF' };
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Calendar onDayPress={day => setSelectedDate(day.dateString)} markedDates={markedDates} minDate={new Date().toISOString().split('T')[0]} />
        <TouchableOpacity 
          style={[styles.button, !selectedDate && styles.buttonDisabled]} 
          disabled={!selectedDate} 
          onPress={() => navigation.navigate('Confirmation', { 
              service, 
              date: selectedDate,
              ticketNumberToday: appointmentsCount[selectedDate] || 0
          })}
        >
          <Text style={styles.buttonText}>Confirmar Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};