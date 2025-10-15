import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 
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

// Componente para el menú modal (opciones de navegación)
const MenuModal = ({ visible, onClose, navigation }) => {
  const menuOptions = [
    { name: 'Inicio', screen: 'Home', isTab: true, icon: 'home-outline' },
    { name: 'Personal', screen: 'Personal', isStack: false, icon: 'account-group' }, 
    { name: 'Tratamientos', screen: 'Tratamientos', isStack: false, icon: 'bandage-outline' }, 
    { name: 'Turnos', screen: 'Turnos', isTab: true, icon: 'calendar-outline' },
    { name: 'Perfil', screen: 'Perfil', isTab: true, icon: 'person-circle-outline' },
  ];

  const handleNavigate = (option) => {
    onClose();
    
    // Si la opción es Turnos o Pacientes, navega directamente al Stack.
    if (option.name === 'Turnos' || option.name === 'Pacientes') { 
        navigation.navigate(option.screen);
    } 
    // Para Home y Perfil (que están en el Tab Navigator 'App').
    else if (option.isTab) {
        navigation.navigate('App', { screen: option.screen });
    }
    // Para Personal y Tratamientos (que asumimos que son rutas del Stack o Tab ocultas dentro de 'App').
    else {
        navigation.navigate('App', { screen: option.screen }); 
    }
  };

  const getIconComponent = (option) => {
    // Usamos MaterialCommunityIcons para 'Personal' y Ionicons para los demás
    if (option.name === 'Personal') {
        return <MaterialCommunityIcons name={option.icon} size={24} color="#3b82f6" />;
    }
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


// Componente individual para cada tarjeta de paciente
const PacienteCard = ({ nombre, telefono, correo }) => (
  // Estilo de armonización aplicado
  <View style={[styles.turnoCard, styles.pacienteCardGlow]}>
    <Text style={styles.pacienteNombre}>{nombre}</Text>
    <Text style={styles.pacienteTel}>Teléfono: {telefono}</Text>
    <Text style={styles.pacienteEmail}>Email: {correo}</Text>

    {/* Contenedor para los botones de acción */}
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton]} 
        // onPress={() => onEdit(id)}
      >
        <FontAwesome name="edit" size={18} color="#fff" />
        <Text style={styles.buttonText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton]} 
        // onPress={() => onDelete(id)}
      >
        <FontAwesome name="trash" size={18} color="#fff" />
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>

  </View>
);
const renderEmptyList = (searchText) => { 
  if (searchText.length > 0) {
    return (
      <View style={styles.emptyListContainer}>
        <Text style={styles.emptyListText}>
          No se encontraró "{searchText}".
        </Text>
        <Text style={styles.emptyListSubText}>
          Verifica la escritura o registra un nuevo paciente.
        </Text>
      </View>
    );
  }
  return null; 
};
export default function Pacientes({ navigation }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchText, setSearchText] = useState(''); // Estado para el texto de búsqueda
  const [filteredData, setFilteredData] = useState(turnosData); // Estado para la lista filtrada

  // Función para manejar la búsqueda en tiempo real
  const handleSearch = (text) => {
    setSearchText(text);
    
    // Inicia el filtrado a partir del primer carácter
    if (text && text.length > 0) { 
      const lowercasedText = text.toLowerCase();
      const newFilteredData = turnosData.filter(item => {
        // Filtra por nombre o correo
        return (
          item.nombre.toLowerCase().includes(lowercasedText) ||
          item.correo.toLowerCase().includes(lowercasedText)
        );
      });
      setFilteredData(newFilteredData);
    } else {
      // Si el campo de búsqueda está vacío, muestra la lista completa
      setFilteredData(turnosData);
    }
  };

  return (
    <View style={styles.contenedorHeader}>

      <StatusBar barStyle="light-content" backgroundColor="#20d3c4ff" />

      {/* Header Superior */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Pacientes</Text>
        {/* BOTÓN PARA ABRIR EL MENÚ MODAL */}
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setIsMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Contenedor de Contenido */}
      <View style={styles.contentContainer}>
        <View style={styles.turnosHeader}>
              <TextInput
                style={styles.input}
                placeholder= "Buscar paciente"
                placeholderTextColor="#666"
                value={searchText} // Vincula el valor al estado
                onChangeText={handleSearch} // Usa la función de búsqueda
                autoCapitalize="none" 
                autoCorrect={false} 
              />
        </View>

        {/* Lista de Pacientes */}
        <LinearGradient colors={['#9FE2CF', '#FFFFFF']} style={styles.gradientTurnosList}>
          <FlatList
            data={filteredData} 
            renderItem={({ item }) => <PacienteCard {...item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.turnosList}
            showsVerticalScrollIndicator={false} 
            ListEmptyComponent={() => renderEmptyList(searchText)} // <-- NUEVO: Pasa searchText
          />
        </LinearGradient>
      </View>
            
      {/* Botón Flotante para Agregar Nuevo Paciente */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('NuevoPaciente')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

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
    backgroundColor: '#20d3c4ff', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 50, // Mantiene el ajuste para el margen superior
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
    backgroundColor: 'transparent', 
  },
  gradientTurnosList: {
    paddingVertical: 2,
    alignItems: 'center',
    flex: 1,
  },
  turnosList: {
    paddingHorizontal: '5%', 
    paddingBottom: 20, 
    width: '100%', 
  },
  turnoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25, 
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    width: "100%", 
  },
  // ESTILO DE BORDE DE TARJETA CAMBIADO A VERDE/TEAL
  pacienteCardGlow: {
    borderLeftWidth: 6,
    borderLeftColor: '#1595a6', // VERDE/TEAL
    borderRadius: 12, 
    overflow: 'hidden', 
  },
  pacienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8, 
    color: '#333',
  },
  pacienteTel: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5, 
  },
  pacienteEmail: {
    fontSize: 14,
    color: '#777',
  },
  actionsContainer: {
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#ddd', 
    paddingTop: 15, 
  },
  actionButton: {
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10, 
  },
  editButton: {
    backgroundColor: '#3b82f6', 
  },
  deleteButton: {
    backgroundColor: '#ff6b6b', 
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5, 
    fontWeight: 'bold',
    fontSize: 14,
  },
  fabButton: {
    position: 'absolute', 
    width: 60,
    height: 60,
    borderRadius: 30, 
    backgroundColor: '#3b82f6', 
    justifyContent: 'center',
    alignItems: 'center',
    right: 20, 
    bottom: 40, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, 
  },
  // ESTILO DEL BUSCADOR ARMONIZADO
  input: {
    height: 50, 
    borderRadius: 10, 
    paddingHorizontal: 15,
    width: "90%", 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fondo blanco semitransparente
    borderWidth: 1, 
    borderColor: '#1595a6', // Borde color Teal/Verde
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    color: '#333', // Asegura que el texto ingresado sea oscuro
  },
  
  // --- Estilos para el Modal de Menú ---
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
  },
  emptyListContainer: { 
    padding: 20,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: { 
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyListSubText: { 
    fontSize: 15,
    color: '#777',
    marginTop: 5,
    textAlign: 'center',
  }
});