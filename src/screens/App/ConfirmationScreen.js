import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { doc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.js';
import { styles } from '../../config/styles.js';

const APPOINTMENT_INTERVAL = 15; // Intervalo de 20 minutos
const MORNING_END_TIME_MINUTES = 11 * 60; // Horário limite da manhã (11:00)
const AFTERNOON_END_TIME_MINUTES = 17 * 60; // Horário limite da tarde (17:00)

export default function ConfirmationScreen({ route, navigation }) {
  const { service, date, shift, ticketNumberToday } = route.params || {};
  const user = auth.currentUser;
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const createTicket = async () => {
      if (!service || !date || !shift || !user) {
        setError("Faltam informações para gerar a ficha. Por favor, tente novamente.");
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        const todayString = now.toISOString().split('T')[0];
        const isToday = date === todayString;

        const shiftStartTime = shift === 'Manhã' ? 7 * 60 : 13 * 60;
        let nextAvailableTimeInMinutes;

        if (isToday) {
          // Lógica Just-in-Time para o dia atual
          const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
          
          const q = query(
            collection(db, "appointments"),
            where("date", "==", date),
            where("shift", "==", shift),
            orderBy("time", "desc"),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          let lastAppointmentTimeInMinutes = 0;
          if (!querySnapshot.empty) {
            const lastAppointment = querySnapshot.docs[0].data();
            const [hours, minutes] = lastAppointment.time.split(':');
            lastAppointmentTimeInMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
          }
          
          // CORREÇÃO: Define o próximo horário como 20 minutos após o último agendamento
          const nextSlotAfterLast = lastAppointmentTimeInMinutes > 0 ? lastAppointmentTimeInMinutes + APPOINTMENT_INTERVAL : shiftStartTime;
          
          // CORREÇÃO: Define o horário base "just-in-time" como 20 minutos a partir de agora
          const currentTimeWithBuffer = currentTimeInMinutes + APPOINTMENT_INTERVAL;
          
          // O novo horário será o maior entre o próximo slot vago e o horário atual + 20 minutos
          nextAvailableTimeInMinutes = Math.max(nextSlotAfterLast, currentTimeWithBuffer);

        } else {
          // Lógica sequencial para dias futuros
          nextAvailableTimeInMinutes = shiftStartTime + ticketNumberToday * APPOINTMENT_INTERVAL;
        }

        // Verifica o limite de horário para cada turno
        if (shift === 'Manhã' && nextAvailableTimeInMinutes >= MORNING_END_TIME_MINUTES) {
            throw new Error("Não há mais horários disponíveis para o turno da manhã.");
        }
        if (shift === 'Tarde' && nextAvailableTimeInMinutes >= AFTERNOON_END_TIME_MINUTES) {
            throw new Error("Não há mais horários disponíveis para o turno da tarde.");
        }
        
        const hours = Math.floor(nextAvailableTimeInMinutes / 60);
        const minutes = nextAvailableTimeInMinutes % 60;
        const appointmentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        const newTicketNumber = ticketNumberToday + 1;
        const newTicket = {
          id: `F${Date.now()}`, service, date, time: appointmentTime,
          ticketNumber: newTicketNumber, userId: user.uid,
          userName: user.displayName, status: 'ativo', shift
        };

        await setDoc(doc(db, "appointments", newTicket.id), newTicket);
        setTicketData(newTicket);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createTicket();
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (error) {
    Alert.alert("Não foi possível agendar", error, [{ text: "Voltar", onPress: () => navigation.goBack() }]);
    return (
      <View style={styles.centered}>
        <Text style={{color: 'red', textAlign: 'center', padding: 20}}>{error}</Text>
      </View>
    );
  }

  if (!ticketData) {
    return null;
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
            <Text style={styles.ticketInfo}>Turno: {ticketData.shift}</Text>
            <Text style={styles.ticketInfo}>Horário Previsto: {ticketData.time}</Text>
            <Text style={[styles.ticketInfo, {marginTop: 15, fontWeight: 'bold', color: '#E53935'}]}>
                OBS: Chegue ao postinho com 30 minutos de antecedência.
            </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
            <Text style={styles.buttonText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}