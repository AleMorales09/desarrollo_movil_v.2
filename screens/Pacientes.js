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
    ActivityIndicator,
    Alert // <--- NUEVO: Para la confirmación de eliminación
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { db } from '../src/config/firebaseConfig'; 
// MODIFICADO: Agregando doc y deleteDoc para la eliminación
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'; 

// ==========================================================
// Componente para el menú modal (opciones de navegación)
// ==========================================================
// ... (MenuModal component remains the same)
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
    
    if (option.name === 'Turnos' || option.name === 'Pacientes') { 
        navigation.navigate(option.screen);
    } 
    else if (option.isTab) {
        navigation.navigate('App', { screen: option.screen });
    }
    else {
        navigation.navigate('App', { screen: option.screen }); 
    }
  };

  const getIconComponent = (option) => {
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
// MODIFICADO: Ahora acepta el objeto patient completo, onEdit y onDelete
const PacienteCard = ({ patient, onEdit, onDelete }) => ( 
  <View style={[styles.turnoCard, styles.pacienteCardGlow]}>
    {/* Usa la propiedad de display formateada (APELLIDO, Nombre) */}
    <Text style={styles.pacienteNombre}>{patient.nombreCompletoDisplay}</Text> 
    
    <Text style={styles.pacienteDni}>DNI: {patient.dni || 'No especificado'}</Text> 
    <Text style={styles.pacienteTel}>Teléfono: {patient.telefono}</Text>
    <Text style={styles.pacienteEmail}>Email: {patient.correo}</Text>

    {/* Contenedor para los botones de acción */}
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton, styles.buttonHalfWidth]} 
        onPress={() => onEdit(patient)} // Llama a onEdit con todos los datos
      >
        <FontAwesome name="edit" size={18} color="#fff" />
        <Text style={styles.buttonText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton, styles.buttonHalfWidth]} 
        onPress={() => onDelete(patient.id, patient.nombreCompletoDisplay)} // Llama a onDelete con ID y nombre
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
          id: doc.id, // <-- CLAVE: El ID del documento para editar/eliminar
          apellido: apellido, 
          nombre: nombre, // Para pre-cargar el formulario
          dni: data.dni || '',
          email: data.email || '', // Para pre-cargar el formulario
          telefono: data.telefono || '', // Para pre-cargar el formulario
          direccion: data.direccion || '', // Para pre-cargar el formulario
          nombreCompletoBusqueda: `${nombre} ${apellido}`.trim(), 
          nombreCompletoDisplay: `${apellido.toUpperCase()}, ${nombre}`, 
          correo: data.email || 'No especificado', // Para mostrar en la tarjeta
        };
      });

      // 1. Ordenamiento por Apellido (alfabético)
      list.sort((a, b) => {
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
    // Al montar el componente o cuando fetchPacientes cambie (solo al inicio)
    fetchPacientes();
    
    // Agregamos un listener para recargar la lista cuando se regrese de NuevoPaciente (después de guardar/actualizar)
    const unsubscribe = navigation.addListener('focus', () => {
        fetchPacientes();
    });

    return unsubscribe; // Limpia el listener al desmontar
  }, [fetchPacientes, navigation]); 

  // NUEVO: Función para manejar la edición
  const handleEdit = (patient) => {
    // Navega a NuevoPaciente, pasando todos los datos del paciente
    navigation.navigate('NuevoPaciente', { 
        patientData: {
            id: patient.id,
            firstName: patient.nombre,
            lastName: patient.apellido,
            email: patient.email,
            dni: patient.dni,
            telefono: patient.telefono,
            direccion: patient.direccion,
        }
    });
  };

  // NUEVO: Función para manejar la eliminación
  const handleDelete = (id, nombreCompleto) => {
    Alert.alert(
      "Confirmar Eliminación",
      `¿Estás seguro de que deseas eliminar a ${nombreCompleto}? Esta acción no se puede deshacer.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Eliminar", 
          onPress: async () => {
            try {
              setIsLoading(true);
              const pacienteRef = doc(db, "pacientes", id);
              await deleteDoc(pacienteRef);
              console.log("Paciente eliminado con ID:", id);
              // Recargar la lista después de la eliminación exitosa
              await fetchPacientes(); 
              Alert.alert("Éxito", "Paciente eliminado correctamente.");
            } catch (error) {
              console.error("Error al eliminar paciente:", error);
              Alert.alert("Error", "No se pudo eliminar el paciente. Inténtalo de nuevo.");
              setIsLoading(false); 
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Función para manejar la búsqueda en tiempo real
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (text && text.length > 0) { 
      const lowercasedText = text.toLowerCase();
      
      const newFilteredData = pacientesData.filter(item => { 
        // Búsqueda por Nombre, Apellido y DNI
        return (
          item.nombreCompletoBusqueda.toLowerCase().includes(lowercasedText) ||
          (item.dni && item.dni.includes(text)) 
        );
      });
      setFilteredData(newFilteredData);
    } else {
      setFilteredData(pacientesData); 
    }
  };
  
  // Vista de carga inicial
  if (isLoading && filteredData.length === 0) {
    return (
        <LinearGradient 
          colors={['#20d3c4ff', '#9FE2CF']} 
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
                placeholder= "Buscar paciente (Nombre, Apellido o DNI)" 
                placeholderTextColor="#666"
                value={searchText} 
                onChangeText={handleSearch} 
                autoCapitalize="none" 
                autoCorrect={false} 
              />
        </View>

        {/* Lista de Pacientes */}
        <LinearGradient colors={['#9FE2CF', '#FFFFFF']} style={styles.gradientTurnosList}>
          <FlatList
            data={filteredData} 
            renderItem={({ item }) => (
                // MODIFICADO: Pasamos el objeto paciente completo y los handlers
                <PacienteCard 
                    patient={item} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.turnosList}
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
    paddingVertical: 30,
    paddingTop: 50, 
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
    padding: 15, 
    marginTop: 5,
    marginBottom: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    width: "90%",
    alignSelf: 'center'
  },
  pacienteCardGlow: {
    borderLeftWidth: 6,
    borderLeftColor: '#1595a6', 
    borderRadius: 12, 
    overflow: 'hidden', 
  },
  pacienteNombre: {
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 5, 
    color: '#333',
  },
  pacienteDni: { 
    fontSize: 14, 
    color: '#333',
    marginBottom: 4, 
    fontWeight: '500',
  },
  pacienteTel: {
    fontSize: 14, 
    color: '#555',
    marginBottom: 4, 
  },
  pacienteEmail: {
    fontSize: 13, 
    color: '#777',
  },
  actionsContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#ddd', 
    paddingTop: 10, 
  },
  actionButton: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 8, 
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderWidth: 1, 
    borderColor: '#1595a6', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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