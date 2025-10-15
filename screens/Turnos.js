import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, Platform } from 'react-native'; // <-- 1. IMPORTAR Platform aquí
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; 

// Componente para el menú modal (opciones de navegación)
const MenuModal = ({ visible, onClose, navigation }) => {
  const allMenuOptions = [
    { name: 'Inicio', screen: 'Home', isTab: true, icon: 'home-outline' },
    { name: 'Pacientes', screen: 'Pacientes', isStack: true, icon: 'people-outline' }, 
    { name: 'Personal', screen: 'Personal', isStack: false, icon: 'account-group' }, 
    { name: 'Tratamientos', screen: 'Tratamientos', isStack: false, icon: 'bandage-outline' }, 
    { name: 'Turnos', screen: 'Turnos', isTab: true, icon: 'calendar-outline' },
    { name: 'Perfil', screen: 'Perfil', isTab: true, icon: 'person-circle-outline' },
  ];

  // FILTRADO CLAVE: Excluye la opción actual ("Turnos")
  const menuOptions = allMenuOptions.filter(option => option.name !== 'Turnos');

  const handleNavigate = (option) => {
    onClose();
    if (option.isTab) {
        navigation.navigate('App', { screen: option.screen });
    } else if (option.isStack) {
        navigation.navigate(option.screen);
    } else {
        navigation.navigate('App', { screen: option.screen }); 
    }
  };

  const getIconComponent = (option) => {
    // Usamos MaterialCommunityIcons para 'Personal' y Ionicons para los demás
    if (option.name === 'Personal') {
        return <MaterialCommunityIcons name={option.icon} size={24} color="#3b82f6" />;
    }
    // Usamos Ionicons (Incluye Tratamientos: bandage-outline)
    return <Ionicons name={option.icon} size={24} color="#3b82f6" />;
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.menuContainer}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => handleNavigate(option)}
            >
              {getIconComponent(option)}
              <Text style={styles.menuItemText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


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
  </View>
);

export default function Turnos({ navigation }) { 
  const [isMenuVisible, setIsMenuVisible] = useState(false); 

  return (
    <View style={styles.contenedorHeader}>

      <StatusBar barStyle="light-content" backgroundColor="#109bebff" />

      {/* Header Superior */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Turnos</Text>
        {/* BOTÓN PARA ABRIR EL MENÚ MODAL */}
        <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setIsMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={30} color="#fff" />
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
          />
        </LinearGradient>
      </View>

      {/* Menú Modal */}
      <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorHeader: {
    flex: 1,
    backgroundColor: '#109bebff',
  },
  // ELIMINADO EL ESTILO safeArea YA QUE CAUSABA PROBLEMAS DE SCOPE/TIPOGRAFÍA
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 50, // Ajustado para margen superior
    backgroundColor: 'transparent', 
  },
  welcomeText: {
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 0, 
    marginBottom: 0, 
  },
  menuButton: { 
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0', 
    overflow: 'hidden', 
    marginTop: 1, 
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
    paddingBottom: 20, 
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
    // --- Estilos para el Modal de Menú (Ajustados) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start', 
    alignItems: 'flex-end', 
    paddingRight: 10, 
    paddingTop: 85, 
  },
  menuContainer: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  }
});