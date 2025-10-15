import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../src/config/firebaseConfig";

export default function PacientesScreen({ navigation }) {
  const [pacientes, setPacientes] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios en la colección 'pacientes' en tiempo real
    const subscriber = onSnapshot(collection(db, "pacientes"), (querySnapshot) => {
      const pacientesArray = [];
      querySnapshot.forEach((documentSnapshot) => {
        pacientesArray.push({
          // CAMBIO CLAVE: Usar el operador spread (...)
          ...documentSnapshot.data(),
          id: documentSnapshot.id,
        });
      });

      setPacientes(pacientesArray);
      setLoading(false);
    });

    // Dejar de escuchar cuando el componente se desmonte
    return () => subscriber();
  },);

  const handleEdit = (id) => {
    // Navegar a la pantalla de edición, pasando el ID del paciente
    navigation.navigate('EditPaciente', { pacienteId: id });
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar a este paciente?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        { 
          text: "Eliminar", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "pacientes", id));
              Alert.alert("Eliminado", "Paciente eliminado correctamente.");
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el paciente.");
            }
          },
          style: "destructive",
        }
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.pacienteCard}>
      <View style={styles.infoContainer}>
        <Text style={styles.pacienteNombre}>{`${item.nombre} ${item.apellido}`}</Text>
        {/* Aquí asumimos que 'correo' y 'telefono' existen en los datos, si no, usa 'email' y 'telefono' */}
        <Text style={styles.pacienteInfo}>Correo: {item.correo || item.email}</Text>
        <Text style={styles.pacienteInfo}>Teléfono: {item.telefono}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item.id)}>
          <FontAwesome name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <FontAwesome name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a56e2" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#4a56e2", "#64bae8"]} style={styles.container}>
      <Text style={styles.title}>Lista de Pacientes</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddPaciente')}
      >
        <FontAwesome name="plus" size={20} color="#000000ff" style={styles.icon} />
        <Text style={styles.buttonText}>Agregar Paciente</Text>
      </TouchableOpacity>

      <FlatList
        data={pacientes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#05f7c2ff",
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 40,
    marginBottom: 20,
  },
  buttonText: {
    color: "#000000ff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  list: {
    width: '100%',
  },
  pacienteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  infoContainer: {
    flex: 1,
  },
  pacienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pacienteInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
});