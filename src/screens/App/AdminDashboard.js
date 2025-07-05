import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../config/firebase.js';
import { styles } from '../Auth/LoginScreen.js';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const querySnapshot = await getDocs(collection(db, "appointments"));
      const appointments = [];
      querySnapshot.forEach((doc) => appointments.push(doc.data()));

      const porModalidade = appointments.reduce((acc, curr) => {
        acc[curr.service] = (acc[curr.service] || 0) + 1;
        return acc;
      }, {});

      const porMes = appointments.reduce((acc, curr) => {
        const month = curr.date.substring(5, 7); // Pega apenas o mês
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const pieChartData = Object.keys(porModalidade).map((key, index) => ({
        name: key,
        population: porModalidade[key],
        color: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'][index % 5],
        legendFontColor: "#7F7F7F",
        legendFontSize: 15
      }));
      
      const barChartLabels = Object.keys(porMes).sort();
      const barChartDataValues = barChartLabels.map(label => porMes[label]);

      setStats({ pieChartData, barChartLabels, barChartDataValues });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.dashboardContainer}>
        <View style={styles.header}>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
            <TouchableOpacity onPress={() => signOut(auth)}><Text style={styles.logoutText}>Sair</Text></TouchableOpacity>
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fichas por Modalidade</Text>
            <PieChart
                data={stats.pieChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
            />
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fichas por Mês</Text>
            <BarChart
                data={{
                    labels: stats.barChartLabels,
                    datasets: [{ data: stats.barChartDataValues }]
                }}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                    backgroundColor: "#e26a00",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                verticalLabelRotation={30}
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};