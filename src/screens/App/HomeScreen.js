import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase.js';
import { styles } from '../../config/styles.js';

export default function HomeScreen({ navigation }) {
  const user = auth.currentUser;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Olá, {user?.displayName || 'Usuário'}!</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Text style={styles.logoutText}>Sair</Text></TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.homeTitle}>FilaDireta</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SelectService')}>
          <Text style={styles.buttonText}>Novo Agendamento</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};