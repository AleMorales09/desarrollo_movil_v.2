import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // Para el icono de campana
import { Button } from 'react-native-web';
import { FontAwesome } from '@expo/vector-icons';
import NuevoPaciente from './NuevoPaciente';

// Datos de ejemplo para los turnos
const turnosData = [
  {
    id: '1',
    nombre: 'Ricardo Perez',
    telefono: '95475234',
    correo: 'rperez@gmail.com',
  },
  {
    id: '2',
    nombre: 'Sofia Martinez',
    telefono: '98754122',
    correo: 'smartinez@gmail.com',
  },
  {
    id: '3',
    nombre: 'Elena Diaz',
    telefono: '123456978',
    correo: 'ediaz@gmail.com',
  },
  {
    id: '4',
    nombre: 'Javier Gerardo Milei',
    telefono: '7988413516',
    correo: 'javoxd@gmail.com',
  },
  {
    id: '5',
    nombre: 'Lautaro Puca',
    telefono: '354165875',
    correo: 'lpuca@gmail.com',
  },
];

// Componente individual para cada tarjeta de turno
const PacienteCard = ({ nombre, telefono, correo }) => (
  <View style={styles.turnoCard}>
    <Text style={styles.pacienteNombre}>{nombre}</Text>
    <Text style={styles.pacienteTel}>Telefono: {telefono}</Text>
    <Text style={styles.pacienteEmail}>Email: {correo}</Text>

    {/* Contenedor para los botones de acción */}
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton]} 
        // onPress={() => onEdit(id)} // Llama a onEdit con el ID del paciente
      >
        <FontAwesome name="edit" size={18} color="#fff" />
        <Text style={styles.buttonText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton]} 
        // onPress={() => onDelete(id)} // Llama a onDelete con el ID del paciente
      >
        <FontAwesome name="trash" size={18} color="#fff" />
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>

  </View>
);

export default function Pacientes({ navigation }) {
  // const userName = "Maria Eugenia"; // Nombre del usuario logeado

  return (
    // <LinearGradient colors={['#109bebff', '#1022ebff']} style={styles.gradientBackground}>
    <View style={styles.contenedorHeader}>
      {/* SafeAreaView para iOS y StatusBar para Android */}

      <StatusBar barStyle="light-content" backgroundColor="#109bebff" />

      {/* Header Superior */}
      <View style={styles.header}>
        {/* <Text style={styles.welcomeText}>¡Bienvenida, {userName}!</Text> */}
        <Text style={styles.welcomeText}>Pacientes</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Contenedor de Turnos */}
      <View style={styles.contentContainer}>
        <View style={styles.turnosHeader}>
              <TextInput
                style={styles.input}
                placeholder= "Buscar paciente"
                // value={searchText}
                autoCapitalize="none" // Optional: Prevents auto-capitalization
                autoCorrect={false} // Optional: Disables autocorrect
              />
        </View>

        {/* Lista de Turnos */}
        <LinearGradient colors={['#2233e6ff', '#22e9beff']} style={styles.gradientTurnosList}>
          <FlatList
            data={turnosData}
            renderItem={({ item }) => <PacienteCard {...item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.turnosList}
            showsVerticalScrollIndicator={false} // Oculta la barra de scroll
          />
        </LinearGradient>
      </View>
            <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('NuevoPaciente')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
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
    width: "300",
    display: "flex",
  },
  pacienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  pacienteTel: {
    fontSize: 15,
    color: '#555',
    marginBottom: 3,
  },
  pacienteEmail: {
    fontSize: 14,
    color: '#777',
  },

  actionsContainer: {
    flexDirection: 'row', // Para que los botones estén uno al lado del otro
    justifyContent: 'flex-end', // Alinea los botones a la derecha
    marginTop: 10, // Espacio entre el texto y los botones
    borderTopWidth: 1, // Una línea separadora opcional
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row', // Para alinear icono y texto
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10, // Espacio entre los botones
  },
  editButton: {
    backgroundColor: '#4a90e2', // Un azul para editar
  },
  deleteButton: {
    backgroundColor: '#d0021b', // Un rojo para eliminar
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5, // Espacio entre el icono y el texto
    fontWeight: 'bold',
    fontSize: 14,
  },

  fabButton: {
    position: 'absolute', // Posicionamiento absoluto para que flote
    width: 60,
    height: 60,
    borderRadius: 30, // La mitad del width/height para que sea redondo
    backgroundColor: '#4a56e2', // Color de tu tema
    justifyContent: 'center',
    alignItems: 'center',
    right: 20, // Distancia desde la derecha
    bottom: 40, // Distancia desde abajo
    shadowColor: '#000', // Sombra para que "flote"
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // Sombra para Android
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 20,
    width: "80%",
    backgroundColor: "#fffefeff",
  },
});