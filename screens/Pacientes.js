import React, { useState, useEffect, useCallback } from 'react'; 
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    StatusBar, 
    TextInput, 
    Modal, 
    ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { db } from '../src/config/firebaseConfig'; 
import { collection, getDocs } from 'firebase/firestore'; 

// ==========================================================
// Componente para el menú modal (opciones de navegación)
// ==========================================================
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


// ==========================================================
// Componente individual para cada tarjeta de paciente
// ==========================================================
const PacienteCard = ({ nombreCompletoDisplay, dni, telefono, correo, id }) => ( // <-- MODIFICADO: Usamos nombreCompletoDisplay
  <View style={[styles.pacienteCard, styles.pacienteCardGlow]}>
    {/* Muestra el nombre en formato: APELLIDO, Nombre */}
    <Text style={styles.pacienteNombre}>{nombreCompletoDisplay}</Text> 
    
    <Text style={styles.pacienteDni}>DNI: {dni || 'No especificado'}</Text> 
    <Text style={styles.pacienteTel}>Teléfono: {telefono}</Text>
    <Text style={styles.pacienteEmail}>Email: {correo}</Text>

    {/* Contenedor para los botones de acción */}
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton, styles.buttonHalfWidth]} 
        onPress={() => console.log('Editar paciente:', id)} 
      >
        <FontAwesome name="edit" size={18} color="#fff" />
        <Text style={styles.buttonText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton, styles.buttonHalfWidth]} 
        onPress={() => console.log('Eliminar paciente:', id)} 
      >
        <FontAwesome name="trash" size={18} color="#fff" />
        <Text style={styles.buttonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>

  </View>
);


// ==========================================================
// Mensajes de Lista Vacía
// ==========================================================
const renderEmptyList = (searchText, isLoading) => { 
  if (isLoading) {
    return (
      <View style={styles.emptyListContainer}>
        <Text style={[styles.emptyListText, {color: '#3b82f6'}]}>Cargando pacientes...</Text>
        <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 10}}/>
      </View>
    );
  }

  if (searchText.length > 0) {
    return (
      <View style={styles.emptyListContainer}>
        <Text style={styles.emptyListText}>
          No se encontró "{searchText}".
        </Text>
        <Text style={styles.emptyListSubText}>
          Verifica la escritura o registra un nuevo paciente.
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.emptyListContainer}>
        <Text style={styles.emptyListText}>
            No hay pacientes registrados.
        </Text>
        <Text style={styles.emptyListSubText}>
            Presiona el botón "+" para agregar uno nuevo.
        </Text>
    </View>
  );
};


// ==========================================================
// Pantalla principal Pacientes
// ==========================================================
export default function Pacientes({ navigation }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchText, setSearchText] = useState(''); 
  const [pacientesData, setPacientesData] = useState([]); 
  const [filteredData, setFilteredData] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 

  // Función para obtener pacientes de Firestore
  const fetchPacientes = useCallback(async () => {
    setIsLoading(true);
    try {
      const pacientesCol = collection(db, 'pacientes');
      const pacienteSnapshot = await getDocs(pacientesCol);
      
      let list = pacienteSnapshot.docs.map(doc => {
        const data = doc.data();
        const apellido = data.apellido || '';
        const nombre = data.nombre || '';

        return {
          id: doc.id,
          apellido: apellido, // Para ordenar
          nombreCompletoBusqueda: `${nombre} ${apellido}`.trim(), // Para búsqueda
          // Formato requerido: APELLIDO, Nombre
          nombreCompletoDisplay: `${apellido.toUpperCase()}, ${nombre}`, 
          dni: data.dni || '',
          telefono: data.telefono || 'No especificado',
          correo: data.email || 'No especificado',
        };
      });

      // 1. Ordenamiento por Apellido (alfabético)
      list.sort((a, b) => {
        // localeCompare es más robusto para caracteres especiales (ñ, tildes)
        return a.apellido.localeCompare(b.apellido);
      });
      
      setPacientesData(list);
      setFilteredData(list); 

    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]); 

  // Función para manejar la búsqueda en tiempo real
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (text && text.length > 0) { 
      const lowercasedText = text.toLowerCase();
      
      const newFilteredData = pacientesData.filter(item => { 
        // Búsqueda por Nombre, Apellido (incluidos en nombreCompletoBusqueda) y DNI
        return (
          item.nombreCompletoBusqueda.toLowerCase().includes(lowercasedText) ||
          (item.dni && item.dni.includes(text)) 
        );
      });
      setFilteredData(newFilteredData);
    } else {
      // Si el campo de búsqueda está vacío, muestra la lista completa
      setFilteredData(pacientesData); 
    }
  };
  
  // Vista de carga inicial
  if (isLoading && filteredData.length === 0) {
    return (
        <LinearGradient 
          colors={['#20d3c4ff', '#ab9fe2ff']} 
          style={[styles.contenedorHeader, {justifyContent: 'center', alignItems: 'center'}]}
        >
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{color: '#fff', marginTop: 10, fontSize: 16}}>Cargando pacientes...</Text>
        </LinearGradient>
    );
  }

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
        <View style={styles.pacientesHeader}>
              <TextInput
                style={styles.input}
                placeholder= "Buscar paciente (Nombre, Apellido o DNI)" 
                placeholderTextColor="#666"
                value={searchText} 
                onChangeText={handleSearch} 
                autoCapitalize="none" 
                autoCorrect={false} 
              />
        </View>

        {/* Lista de Pacientes */}
        <LinearGradient colors={['#ffffffff', '#67c4aaff']} style={styles.gradientPacientesList}>
          <FlatList
            // Le pasamos la nueva propiedad nombreCompletoDisplay
            data={filteredData} 
            renderItem={({ item }) => <PacienteCard {...item} nombreCompletoDisplay={item.nombreCompletoDisplay} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.pacientesList}
            showsVerticalScrollIndicator={false} 
            ListEmptyComponent={() => renderEmptyList(searchText, isLoading)} 
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
    paddingVertical: 10,
    paddingTop: 30, 
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
  pacientesHeader: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 1,
    backgroundColor: 'transparent', 
  },
  gradientPacientesList: {
    paddingVertical: 2,
    alignItems: 'center',
    flex: 1,
  },
  pacientesList: {
    paddingHorizontal: '5%', 
    paddingBottom: 20, 
    width: '90%', 
  },
  // --- MODIFICADO: Reducción de tamaño de tarjeta ---
  pacienteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15, // REDUCIDO de 25
    marginBottom: 12, // REDUCIDO de 15
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    width: "100%", 
  },
  pacienteCardGlow: {
    borderLeftWidth: 6,
    borderLeftColor: '#1595a6', 
    borderRadius: 12, 
    overflow: 'hidden', 
  },
  pacienteNombre: {
    fontSize: 16, // REDUCIDO de 18
    fontWeight: 'bold',
    marginBottom: 5, // REDUCIDO de 8
    color: '#333',
  },
  pacienteDni: { 
    fontSize: 14, // REDUCIDO de 15
    color: '#333',
    marginBottom: 4, // REDUCIDO de 5
    fontWeight: '500',
  },
  pacienteTel: {
    fontSize: 14, // REDUCIDO de 15
    color: '#555',
    marginBottom: 4, // REDUCIDO de 5
  },
  pacienteEmail: {
    fontSize: 13, // REDUCIDO de 14
    color: '#777',
  },
  actionsContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10, // REDUCIDO de 15
    borderTopWidth: 1, 
    borderTopColor: '#ddd', 
    paddingTop: 10, // REDUCIDO de 15
  },
  actionButton: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 8, // REDUCIDO de 10
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonHalfWidth: {
    width: '48%', 
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
  input: {
    height: 50, 
    borderRadius: 10, 
    paddingHorizontal: 15,
    width: "90%", 
    backgroundColor: 'rgba(252, 252, 252, 0.73)', 
    borderWidth: 1, 
    borderColor: '#67c4aaff', 
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1.1,
    shadowRadius: 3,
    elevation: 3,
    color: '#333', 
  },
  
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