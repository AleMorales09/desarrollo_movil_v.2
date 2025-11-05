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
    Image, // 💡 IMPORTANTE: Importar Image para mostrar la foto
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { db } from '../src/config/firebaseConfig'; 
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'; 

// Importamos el componente de Alerta personalizada 
import CustomAlert from '../components/Alert'; 

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
const PacienteCard = ({ patient, onViewDetails, onEdit, onDelete }) => ( 
  <View style={[styles.turnoCard, styles.pacienteCardGlow]}>
    
    <TouchableOpacity 
        style={styles.cardContent} 
        onPress={() => onViewDetails(patient)} 
        activeOpacity={0.7} 
    >
        {/* 💡 AÑADIDO: Contenedor de la foto y el nombre */}
        <View style={styles.photoHeaderContainer}>
            {patient.photoURL ? (
                // Si hay foto, mostrar la imagen
                <Image source={{ uri: patient.photoURL }} style={styles.profileImageSmall} />
            ) : (
                // Si no hay foto, mostrar placeholder
                <View style={styles.photoPlaceholderSmall}>
                    <Ionicons name="person" size={20} color="#fff" />
                </View>
            )}
            <Text style={styles.pacienteNombre}>{patient.nombreCompletoDisplay}</Text> 
        </View>
        
        {/* Los detalles se muestran debajo del header de la foto */}
        <Text style={styles.pacienteDni}>DNI: {patient.dni || 'No especificado'}</Text> 
        <Text style={styles.pacienteTel}>Teléfono: {patient.telefono}</Text>
        <Text style={styles.pacienteEmail}>Email: {patient.correo}</Text>
    </TouchableOpacity>

    {/* Contenedor para los botones de acción */}
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton, styles.buttonHalfWidth]} 
        onPress={() => onEdit(patient)} 
      >
        <FontAwesome name="edit" size={18} color="#fff" />
        <Text style={styles.buttonText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton, styles.buttonHalfWidth]} 
        onPress={() => onDelete(patient.id, patient.nombreCompletoDisplay)} 
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
          Verificá la escritura o registrá un nuevo paciente.
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

  // ESTADOS PARA LA ALERTA PERSONALIZADA
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error", 
    title: "",
    message: "",
    showCancel: false, 
  });
  const [patientToDelete, setPatientToDelete] = useState(null); 

  // Función para obtener pacientes de Firestore
  const fetchPacientes = useCallback(async () => {
    setIsLoading(true);
    try {
      const pacientesCol = collection(db, 'pacientes');
      const pacienteSnapshot = await getDocs(pacientesCol);
      
      let list = pacienteSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // 💡 CORRECCIÓN: Usar variables temporales con nombres claros, que coincidan con Firestore.
        const lastName = data.lastName || ''; 
        const firstName = data.firstName || ''; 

        return {
          id: doc.id, 
          // 💡 CLAVE: Usamos los nombres de campo (firstName/lastName) para que coincidan con NuevoPaciente.js
          firstName: firstName, // Lo que antes era 'nombre'
          lastName: lastName,   // Lo que antes era 'apellido'
          dni: data.dni || '',
          email: data.email || '', 
          telefono: data.telefono || '', 
          direccion: data.direccion || '', 
          photoURL: data.photoURL || null, 
          // Usamos las variables locales para la busqueda y el display
          nombreCompletoBusqueda: `${firstName} ${lastName}`.trim(), 
          nombreCompletoDisplay: `${lastName.toUpperCase()}, ${firstName}`, 
          correo: data.email || 'No especificado', 
        };
      });

      // 1. Ordenamiento por Apellido (alfabético)
      list.sort((a, b) => {
        // 💡 CORRECCIÓN: Usar el campo correcto en el objeto: 'lastName'
        return a.lastName.localeCompare(b.lastName);
      });
      
      setPacientesData(list);
      setFilteredData(list); 

    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      // Aseguramos que el error muestre una alerta de 1 botón y no rompa el flujo
      showAlert("error", "Error de Carga", "No se pudieron cargar los pacientes.", false);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    // Carga inicial
    fetchPacientes();
    
    // 💡 SOLUCIÓN A DATOS OBSOLETOS: Vuelve a cargar la lista cada vez que la pantalla entra en foco
    const unsubscribe = navigation.addListener('focus', () => {
        fetchPacientes();
    });

    return unsubscribe; 
  }, [fetchPacientes, navigation]); 


  // ==========================================================
  // FUNCIONES DE ALERTA PERSONALIZADA
  // ==========================================================
  
  const showAlert = useCallback((type, title, message, showCancel = false) => { 
      setAlertConfig({ visible: true, type, title, message, showCancel }); 
  }, []);

  const handleDismissAlert = useCallback(() => { 
      setAlertConfig((prev) => {
          if (prev.showCancel) { 
              setPatientToDelete(null); 
          }
          return { ...prev, visible: false };
      });
  }, []); 

  const handleConfirmDelete = useCallback(async () => {
      if (!patientToDelete) {
          handleDismissAlert(); 
          return;
      }

      const { id } = patientToDelete;

      handleDismissAlert(); 
      setIsLoading(true);

      try {
        const pacienteRef = doc(db, "pacientes", id);
        await deleteDoc(pacienteRef);
        
        await fetchPacientes(); 
        
        showAlert("success", "Éxito", "Paciente eliminado correctamente.", false);
      } catch (error) {
        console.error("Error al eliminar paciente:", error);
        showAlert("error", "Error", "No se pudo eliminar el paciente. Inténtalo de nuevo.", false); 
        setIsLoading(false); 
      } finally {
          setPatientToDelete(null); 
      }
  }, [patientToDelete, fetchPacientes, showAlert, handleDismissAlert]);


  const handleDelete = (id, nombreCompletoDisplay) => {
    setPatientToDelete({ id, nombreCompletoDisplay });
    
    showAlert(
        "error", 
        "Confirmar Eliminación", 
        `¿Estás seguro de que deseas eliminar a ${nombreCompletoDisplay}? Esta acción no se puede deshacer.`,
        true 
    );
  };
  
  // Función para ver detalles del paciente (Modo solo lectura)
  const handleViewDetails = (patient) => {
    navigation.navigate('NuevoPaciente', { 
        patientData: {
            id: patient.id,
            // 💡 CORRECCIÓN: Usar patient.firstName y patient.lastName directamente
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            dni: patient.dni,
            telefono: patient.telefono,
            direccion: patient.direccion,
            photoURL: patient.photoURL, 
        },
        isViewMode: true, 
    });
  };

  // Función para manejar la edición (Modo edición normal)
  const handleEdit = (patient) => {
    navigation.navigate('NuevoPaciente', { 
        patientData: {
            id: patient.id,
            // 💡 CORRECCIÓN: Usar patient.firstName y patient.lastName directamente
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            dni: patient.dni,
            telefono: patient.telefono,
            direccion: patient.direccion,
            photoURL: patient.photoURL, 
        },
        isViewMode: false, 
    });
  };

  // Función para manejar la búsqueda en tiempo real
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (text && text.length > 0) { 
      const lowercasedText = text.toLowerCase();
      
      const newFilteredData = pacientesData.filter(item => { 
        // 💡 CORRECCIÓN: nombreCompletoBusqueda ya usa firstName/lastName
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
                <PacienteCard 
                    patient={item} 
                    onViewDetails={handleViewDetails} 
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

      {/* COMPONENTE DE ALERTA PERSONALIZADA */}
      <CustomAlert
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          showCancel={alertConfig.showCancel} 
          onClose={handleDismissAlert} 
          onConfirm={handleConfirmDelete} 
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
    paddingVertical: 5,
    paddingTop: 40, 
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
    padding: 0, 
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
  cardContent: {
      padding: 15,
  },
  pacienteCardGlow: {
    borderLeftWidth: 6,
    borderLeftColor: '#1595a6', 
    borderRadius: 12, 
    overflow: 'hidden', 
  },
  // 💡 ESTILOS AÑADIDOS PARA LA FOTO
  photoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Separación entre la foto/nombre y los detalles
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  profileImageSmall: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#05f7c2',
  },
  photoPlaceholderSmall: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    backgroundColor: '#3b82f6', // Color de fondo del placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  // FIN ESTILOS DE FOTO
  
  pacienteNombre: {
    fontSize: 16, 
    fontWeight: 'bold',
    // Eliminamos el marginBottom aquí ya que está en photoHeaderContainer
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
    marginTop: 0, 
    borderTopWidth: 1, 
    borderTopColor: '#ddd', 
    paddingTop: 10, 
    paddingHorizontal: 15, 
    paddingBottom: 5,
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