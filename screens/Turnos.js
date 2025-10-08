import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // Para el icono de campana
import Pacientes from './Pacientes';

// Datos de ejemplo para los turnos
const turnosData = [
  {
    id: '1',
    hora: '17:30 hs',
    paciente: 'Ricardo Perez',
    tratamiento: 'Endodoncia',
  },
  {
    id: '2',
    hora: '18:00 hs',
    paciente: 'Sofia Martinez',
    tratamiento: 'Limpieza',
  },
  {
    id: '3',
    hora: '18:30 hs',
    paciente: 'Elena Diaz',
    tratamiento: 'Control Ortodoncia',
  },
  {
    id: '4',
    hora: '19:00 hs',
    paciente: 'Javier Gerardo Milei',
    tratamiento: 'Fotocurado',
  },
  {
    id: '5',
    hora: '19:30 hs',
    paciente: 'Lautaro Puca',
    tratamiento: 'Fotocurado',
  },
];

// Componente individual para cada tarjeta de turno
const TurnoCard = ({ hora, paciente, tratamiento }) => (
  <View style={styles.turnoCard} >
    <Text style={styles.turnoHora}>{hora}</Text>
    <Text style={styles.turnoPaciente}>Paciente: {paciente}</Text>
    <Text style={styles.turnoTratamiento}>{tratamiento}</Text>
    {/* <TouchableOpacity onPress={() => navigation.navigate("Pacientes")}>
      <Text style={styles.signUpText}>
        ¿No tenés cuenta?{" "}
        <Text style={styles.subtitle}>Regístrate</Text>
      </Text>
    </TouchableOpacity> */}
  </View>
);

export default function Turnos() {
  // const userName = "Maria Eugenia"; // Nombre del usuario logeado

  return (
    // <LinearGradient colors={['#109bebff', '#1022ebff']} style={styles.gradientBackground}>
    <View style={styles.contenedorHeader}>
      {/* SafeAreaView para iOS y StatusBar para Android */}

      <StatusBar barStyle="light-content" backgroundColor="#109bebff" />

      {/* Header Superior */}
      <View style={styles.header}>
        {/* <Text style={styles.welcomeText}>¡Bienvenida, {userName}!</Text> */}
        <Text style={styles.welcomeText}>¡Bienvenido/a!</Text>
        <TouchableOpacity style={styles.notificationButton}>
          {/* <Ionicons name="notifications-outline" size={24} color="#fff" /> */}
        </TouchableOpacity>
      </View>

      {/* Contenedor de Turnos */}
      <View style={styles.contentContainer}>
        <View style={styles.turnosHeader}>
          <Text style={styles.turnosHeaderText}>Turnos para hoy</Text>
        </View>

        {/* Lista de Turnos */}
        <LinearGradient colors={['#ffffffff', '#22e9beff']} style={styles.gradientTurnosList}>
          <FlatList
            data={turnosData}
            renderItem={({ item }) => <TurnoCard {...item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.turnosList}
            showsVerticalScrollIndicator={false} // Oculta la barra de scroll
            onPress={() => navigation.navigate("Pacientes.js")}
          />
        </LinearGradient>
      </View>

    </View>
    // </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedorHeader: {
    flex: 1,
    backgroundColor: '#109bebff',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Ajuste para Android StatusBar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: 'transparent', // Ya está cubierto por el LinearGradient principal
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: -15,
  },
  notificationButton: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Fondo gris claro para la sección de turnos
    overflow: 'hidden', // Asegura que el contenido interno se recorte a los bordes redondeados
    marginTop: 1, // Un pequeño espacio entre el header y el contenedor de turnos
  },
  turnosHeader: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 1,
    backgroundColor: '#2233e6ff',
  },
  gradientTurnosList: {
    paddingVertical: 2,
    alignItems: 'center',
    flex: 1,
  },
  turnosHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  turnosList: {
    paddingHorizontal: '10%',
    paddingBottom: 20, // Espacio al final de la lista
  },
  turnoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.99,
    shadowRadius: 10,
    elevation: 10,
  },
  turnoHora: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  turnoPaciente: {
    fontSize: 15,
    color: '#555',
    marginBottom: 3,
  },
  turnoTratamiento: {
    fontSize: 14,
    color: '#777',
  },
});