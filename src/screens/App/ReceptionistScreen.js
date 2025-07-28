import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../config/firebase';
import { styles } from '../../config/styles';

export default function ReceptionistScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Buscando fichas para a data: ${today}`); // Log para depuração
      
      const q = query(
        collection(db, "appointments"), 
        where("date", "==", today),
        where("status", "==", "ativo"),
        orderBy("time")
      );
      
      const querySnapshot = await getDocs(q);
      const dailyTickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Fichas encontradas: ${dailyTickets.length}`); // Log para depuração
      setTickets(dailyTickets);
      
    } catch (error) {
      console.error("Erro detalhado ao buscar fichas:", error);
      Alert.alert("Erro", `Falha ao buscar fichas: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [fetchTickets])
  );

  const handleCheckIn = async (ticketId) => {
    try {
      const ticketRef = doc(db, "appointments", ticketId);
      await updateDoc(ticketRef, {
        status: "concluido"
      });
      Alert.alert("Sucesso", "Check-in do paciente realizado.");
      fetchTickets(); // Atualiza a lista
    } catch (error) {
      Alert.alert("Erro", `Não foi possível fazer o check-in: ${error.message}`);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketService}>{item.service}</Text>
          <Text style={styles.ticketNumber}>Ficha N° {item.ticketNumber}</Text>
        </View>
        <Text style={styles.ticketInfo}>Paciente: {item.userName || 'Não informado'}</Text>
        <Text style={styles.ticketInfo}>Turno: {item.shift}</Text>
        <Text style={styles.ticketInfo}>Horário: {item.time}</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleCheckIn(item.id)}>
            <Text style={styles.buttonText}>Check-in</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tickets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <Text style={styles.dashboardTitle}>
            Fichas do Dia ({tickets.length})
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ textAlign: 'center' }}>Nenhuma ficha ativa para hoje.</Text>
          </View>
        }
        onRefresh={fetchTickets}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
}