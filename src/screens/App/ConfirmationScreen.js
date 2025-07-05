import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.js';
import { styles } from '../../config/styles.js';

export default function ConfirmationScreen({ route, navigation }) {
  const { service, date, ticketNumberToday } = route.params;
  const user = auth.currentUser;
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);

  const calculateTime = (ticketNumber) => {
    const startTime = 13 * 60;
    const totalMinutes = startTime + (ticketNumber - 1) * 25;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  useEffect(() => {
    const newTicketNumber = ticketNumberToday + 1;
    const appointmentTime = calculateTime(newTicketNumber);

    const data = {
      id: `F${Date.now()}`, service, date, time: appointmentTime,
      ticketNumber: newTicketNumber, userId: user.uid,
      userName: user.displayName, status: 'ativo'
    };

    const saveAppointment = async () => {
      try {
        await setDoc(doc(db, "appointments", data.id), data);
        setTicketData(data);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível gerar sua ficha.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    saveAppointment();
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  const [year, month, day] = ticketData.date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.homeTitle}>Ficha Gerada!</Text>
        <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
                <Text style={styles.ticketService}>{ticketData.service}</Text>
                <Text style={styles.ticketNumber}>Ficha N° {ticketData.ticketNumber}</Text>
            </View>
            <Text style={styles.ticketInfo}>Paciente: {ticketData.userName}</Text>
            <Text style={styles.ticketInfo}>Data: {formattedDate}</Text>
            <Text style={styles.ticketInfo}>Horário Previsto: {ticketData.time}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}><Text style={styles.buttonText}>Voltar ao Início</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};