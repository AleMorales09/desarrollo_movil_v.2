import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet,FlatList, StatusBar } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';


const turnosData = [
  { iconName: "users", iconSize: 28, iconColor: "#109beb", id: "1", hora: "PACIENTES", paciente: "Gestión de pacientes", tratamiento: "" },
  { iconName: "calendar", iconSize: 28, iconColor: "#109beb", id: "2", hora: "TURNOS", paciente: "Gestión de turnos", tratamiento: "" },
  { iconName: "user-md", iconSize: 28, iconColor: "#109beb", id: "3", hora: "PERSONAL", paciente: "Gestión del personal", tratamiento: "" },
  { iconName: "heart", iconSize: 28, iconColor: "#109beb", id: "4", hora: "HISTORIAS CLINICAS", paciente: "Gestión de historias clinicas", tratamiento: "" },
];
const TurnoCard = ({ hora, paciente, tratamiento, iconName, iconColor, iconSize }) => (
  <View style={styles.turnoCard}>
    <View style={styles.cardHeader}>
    <Icon name={iconName} size={iconSize} color={iconColor} />
    <Text style={styles. turnoHora}>{hora}</Text>
    </View>
    <Text style={styles.turnoPaciente}>{paciente}</Text>
    <Text style={styles.turnoTratamiento}>{tratamiento}</Text>
    
  </View>
);

export default function Home({ navigation }) {
  // const handleLogOut = async () => {
  //   try {
  //     await signOut(auth);
  //     Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
  //     navigation.replace('Login');
  //   } catch (error) {
  //     Alert.alert("Error", "Hubo un problema al cerrar sesión.");
  //   }
  // };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7ec9b8ff" />

      {/* HEADER CON DEGRADADO */}
      <LinearGradient
        colors={['#cef4e8', '#6c988aff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>¡Bienvenido/a!</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={28} color="#000000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>INICIO</Text>
      </LinearGradient>

      {/* LISTA DE TURNOS */}
      <FlatList
        data={turnosData}
        renderItem={({ item }) => <TurnoCard {...item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.turnosList}
        showsVerticalScrollIndicator={false}
      />

      {/* BOTÓN FLOTANTE */}
      {/* <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('NuevoTurno')}
      >
        <Ionicons name="add" size={36} color="#fff" />
      </TouchableOpacity> */}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eafbf6ff" },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#a8edea',
    borderTopWidth: 5,
    borderTopColor: '#68b4a7ff', //  borde superior
    borderEndColor: '#68b4a7ff', //  borde derecho
    borderStartColor: '#68b4a7ff', //  borde izquierdo
    borderBottomColor: '#68b4a7ff', //  borde inferior
    borderWidth: 4,

  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000ff",
  },
  notificationButton: {
    backgroundColor: "#ffffff33",
    padding: 8,
    borderRadius: 10,
  },
  headerSubtitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000ff",
  },

  // Turnos
  turnosList: { padding: 20 },
  turnoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  turnoHora: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#109beb",
  },
  turnoPaciente: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  turnoTratamiento: {
    fontSize: 14,
    color: "#777",
  },

  // Botón flotante
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#109beb",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 10,
  },
});