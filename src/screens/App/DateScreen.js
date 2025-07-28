import React, { useState, useCallback } from 'react'; // Import useCallback
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';
import { styles } from '../../config/styles.js';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

const SHIFT_LIMIT = 10;

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: "Hoje"
};
LocaleConfig.defaultLocale = 'pt-br';

export default function DateScreen({ navigation, route }) {
  const { service, shift } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [appointmentsCount, setAppointmentsCount] = useState({});
  const [userAppointments, setUserAppointments] = useState({});
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const q = query(collection(db, "appointments"));
    const querySnapshot = await getDocs(q);
    const counts = {};
    const userCounts = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!counts[data.date]) {
        counts[data.date] = { 'Manhã': 0, 'Tarde': 0 };
      }
      if (data.shift) {
          counts[data.date][data.shift]++;
      }
      if (data.userId === user.uid) {
          userCounts[data.date] = (userCounts[data.date] || 0) + 1;
      }
    });
    setAppointmentsCount(counts);
    setUserAppointments(userCounts);
    setLoading(false);
  }, [user.uid]);

  // a busca de agendamentos toda vez que a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const onDayPress = (day) => {
    if (userAppointments[day.dateString] > 0) {
      Alert.alert("Atenção", "Você já possui um agendamento para este dia.");
      return;
    }
    const dayOfWeek = new Date(day.dateString + 'T00:00:00').getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        Alert.alert("Atenção", "Não há agendamentos para fins de semana.");
        return;
    }
    setSelectedDate(day.dateString);
  }

  const markedDates = {};
  for (const date in appointmentsCount) {
    if (appointmentsCount[date] && appointmentsCount[date][shift] >= SHIFT_LIMIT) {
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
        <Calendar onDayPress={onDayPress} markedDates={markedDates} minDate={new Date().toISOString().split('T')[0]} />
        <TouchableOpacity
          style={[styles.button, !selectedDate && styles.buttonDisabled]}
          disabled={!selectedDate}
          onPress={() => navigation.navigate('Confirmation', {
              service,
              date: selectedDate,
              shift,
              ticketNumberToday: (appointmentsCount[selectedDate] && appointmentsCount[selectedDate][shift]) || 0
          })}
        >
          <Text style={styles.buttonText}>Confirmar Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};