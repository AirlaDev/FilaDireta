import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';
import { styles } from '../../config/styles';

export default function MyTicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true); // Inicia como true para mostrar loading inicial
  const [refreshing, setRefreshing] = useState(false); // Estado separado para refresh
  const user = auth.currentUser;

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Buscando fichas para ${user.uid} a partir de ${today}`);
      
      // Consulta modificada para incluir ordenação
      const q = query(
        collection(db, "appointments"), 
        where("userId", "==", user.uid),
        where("date", ">=", today),
        orderBy("date"), // Ordena por data
        orderBy("time") // E depois por horário
      );
      
      const querySnapshot = await getDocs(q);
      const userTickets = [];
      
      querySnapshot.forEach((doc) => {
        console.log('Documento encontrado:', doc.id, doc.data());
        userTickets.push({
          id: doc.id, // Garantindo que temos o ID do documento
          ...doc.data()
        });
      });
      
      console.log(`Total de fichas encontradas: ${userTickets.length}`);
      
      // Ordenação adicional no cliente para garantir
      const sortedTickets = userTickets.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        
        // Se for a mesma data, ordena por horário
        return a.time.localeCompare(b.time);
      });
      
      setTickets(sortedTickets);
      
    } catch (error) {
      console.error("Erro detalhado:", error);
      Alert.alert("Erro", `Falha ao buscar fichas: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Atualiza quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [fetchTickets])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const renderItem = ({ item }) => {
    const [year, month, day] = item.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    return (
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketService}>{item.service}</Text>
          <Text style={styles.ticketNumber}>Ficha N° {item.ticketNumber}</Text>
        </View>
        <Text style={styles.ticketInfo}>Paciente: {item.userName || 'Não informado'}</Text>
        <Text style={styles.ticketInfo}>Data: {formattedDate}</Text>
        <Text style={styles.ticketInfo}>Horário: {item.time}</Text>
        {item.status && <Text style={styles.ticketInfo}>Status: {item.status}</Text>}
      </View>
    );
  };

  if (loading) {
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
            Minhas Fichas Ativas ({tickets.length})
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ textAlign: 'center' }}>
              Nenhuma ficha ativa encontrada.
              {'\n\n'}
              <Text style={{ color: '#007AFF' }}>Arraste para atualizar</Text>
            </Text>
          </View>
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
}