import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { styles } from '../config/styles.js';

// Importando as telas
import LoginScreen from '../screens/Auth/LoginScreen.js';
import RegisterScreen from '../screens/Auth/RegisterScreen.js';
import HomeScreen from '../screens/App/HomeScreen.js';
import ServiceScreen from '../screens/App/ServiceScreen.js';
import DateScreen from '../screens/App/DateScreen.js';
import ConfirmationScreen from '../screens/App/ConfirmationScreen.js';
import AdminDashboard from '../screens/App/AdminDashboard.js';
import MyTicketsScreen from '../screens/App/MyTicketsScreen.js';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ADMIN_UID = "CmhlPdJgD9agRYRI8JlUP1rMjN242"; 

// Navegador para o fluxo de agendamento
const AppointmentNavigator = () => (
    <AppStack.Navigator>
        <AppStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <AppStack.Screen name="SelectService" component={ServiceScreen} options={{ title: 'Escolha o Serviço' }} />
        <AppStack.Screen name="SelectDate" component={DateScreen} options={{ title: 'Escolha a Data' }} />
        <AppStack.Screen name="Confirmation" component={ConfirmationScreen} options={{ title: 'Confirmação' }} />
    </AppStack.Navigator>
);

// Navegador principal com abas para o usuário logado
const MainAppNavigator = () => (
    <Tab.Navigator screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
    }}>
        <Tab.Screen name="Agendar" component={AppointmentNavigator} />
        <Tab.Screen name="Minhas Fichas" component={MyTicketsScreen} />
    </Tab.Navigator>
);

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
            user.uid === ADMIN_UID ? (
                <AuthStack.Screen name="AdminDashboard" component={AdminDashboard} />
            ) : (
                <AuthStack.Screen name="MainApp" component={MainAppNavigator} />
            )
        ) : (
          <>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </AuthStack.Navigator>
    </NavigationContainer>
  );
};