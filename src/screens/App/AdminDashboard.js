import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Dimensions, Alert, Platform } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../config/firebase.js';
import { styles } from '../../config/styles.js';
import { BarChart, PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';

// Só importa o 'expo-sharing' se não estiver na web
const Sharing = Platform.OS === 'web' ? null : require('expo-sharing');

const screenWidth = Dimensions.get("window").width;

const getMonthName = (monthNumber) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(monthNumber, 10) - 1];
};

export default function AdminDashboard({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... (o resto das suas funções `fetchAppointments` e `generateStats` continuam iguais)
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "appointments"));
      const allAppointments = [];
      querySnapshot.forEach((doc) => allAppointments.push(doc.data()));
      setAppointments(allAppointments);
      generateStats(allAppointments);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const generateStats = (data) => {
    const porModalidade = data.reduce((acc, curr) => {
      acc[curr.service] = (acc[curr.service] || 0) + 1;
      return acc;
    }, {});

    const porMes = data.reduce((acc, curr) => {
      const month = curr.date.substring(5, 7);
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
    
    const barChartLabels = Object.keys(porMes).sort().map(getMonthName);
    const barChartDataValues = Object.keys(porMes).sort().map(label => porMes[label]);

    setStats({ pieChartData, barChartLabels, barChartDataValues });
  };
  
  useEffect(() => {
    fetchAppointments();
  }, []);

  const createPdfHtml = (title, data) => {
    const tableRows = data.map(item => `
      <tr>
        <td>${item.date}</td>
        <td>${item.userName}</td>
        <td>${item.service}</td>
        <td>${item.shift}</td>
        <td>${item.time}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Serviço</th>
                <th>Turno</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };
  
  const generatePdf = async (title, data, fileName) => {
    if (data.length === 0) {
        Alert.alert("Relatório Vazio", "Não há dados para gerar o relatório para este período.");
        return;
    }
    const html = createPdfHtml(title, data);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'web') {
        // Na web, simplesmente abrimos o PDF (não é possível partilhar)
        const pdfAsBase64 = await Print.printToStringAsync({ html: html, base64: true });
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfAsBase64.base64}`;
        link.download = fileName;
        link.click();
      } else {
        // No mobile, usamos o sistema de partilha nativo
        if (Sharing && Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { dialogTitle: fileName, mimeType: 'application/pdf' });
        }
      }
    } catch (error) {
        Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  const generateMonthlyReport = () => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyData = appointments.filter(app => app.date.startsWith(currentMonth));
    generatePdf('Relatório Mensal de Fichas', monthlyData, 'relatorio_mensal.pdf');
  };

  const generateYearlyReport = () => {
    const currentYear = new Date().getFullYear().toString();
    const yearlyData = appointments.filter(app => app.date.startsWith(currentYear));
    generatePdf('Relatório Anual de Fichas', yearlyData, 'relatorio_anual.pdf');
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  // O resto da sua tela continua igual...
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.dashboardContainer}>
        <View style={styles.header}>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
            <TouchableOpacity onPress={() => signOut(auth)}><Text style={styles.logoutText}>Sair</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ReceptionistView')}>
          <Text style={styles.buttonText}>Acompanhamento Diário</Text>
        </TouchableOpacity>
        
        <View style={{marginTop: 20}}>
            <TouchableOpacity style={styles.button} onPress={generateMonthlyReport}>
                <Text style={styles.buttonText}>Gerar Relatório Mensal (PDF)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={generateYearlyReport}>
                <Text style={styles.buttonText}>Gerar Relatório Anual (PDF)</Text>
            </TouchableOpacity>
        </View>

        {stats && (
          <>
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
                    height={240}
                    chartConfig={{
                        backgroundColor: "#ffffff",
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    fromZero={true}
                    verticalLabelRotation={30}
                />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};