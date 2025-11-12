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
    Image, 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { db } from '../src/config/firebaseConfig'; 
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'; 
import CustomAlert from '../components/Alert'; 

// ==========================================================
// Componente para el menú modal (opciones de navegación)
// ==========================================================
const MenuModal = ({ visible, onClose, navigation, currentRouteName }) => { 
  const allMenuOptions = [
    { name: 'Inicio', screen: 'Home', isTab: true, icon: 'home-outline' },
    { name: 'Pacientes Activos', screen: 'Pacientes', isStack: true, icon: 'people-outline' }, 
    { name: 'Pacientes Inactivos', screen: 'PacientesInactivos', isStack: true, icon: 'archive-outline' }, 
    { name: 'Personal', screen: 'Personal', isStack: false, icon: 'account-group' }, 
    { name: 'Tratamientos', screen: 'Tratamientos', isStack: false, icon: 'bandage-outline' }, 
    { name: 'Turnos', screen: 'Turnos', isTab: true, icon: 'calendar-outline' },
    { name: 'Perfil', screen: 'Perfil', isTab: true, icon: 'person-circle-outline' },
  ];

  const handleNavigate = (option) => {
    
    if (option.screen === currentRouteName) {
        onClose();
        return;
    }

    onClose();
    
    if (option.isTab) {
        navigation.navigate('App', { screen: option.screen });
    } 
    else { 
        navigation.navigate(option.screen);
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
          {allMenuOptions.map((option, index) => {
            
            const isActive = option.screen === currentRouteName; 
            
            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.menuItem, isActive && styles.menuItemActive]} 
                onPress={() => handleNavigate(option)}
                disabled={isActive} 
              >
                {getIconComponent(option)}
                <Text 
                    style={[styles.menuItemText, isActive && styles.menuItemTextActive]}
                >
                    {option.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


// ==========================================================
// Componente individual para cada tarjeta de paciente
// ==========================================================
const PacienteCard = ({ patient, onViewDetails, onEdit, onDeactivate }) => { 
    const cardGlowStyle = patient.isActive 
        ? styles.pacienteCardGlowActive 
        : styles.pacienteCardGlowInactive;
        
    const buttonBgColor = patient.isActive ? '#ff6b6b' : '#05f7c2'; 
    const buttonIcon = patient.isActive ? "trash" : "undo";
    const buttonText = patient.isActive ? "Desactivar" : "Activar";

    return (
        <View style={[styles.turnoCard, cardGlowStyle]}>
            <TouchableOpacity 
                style={styles.cardContent} 
                onPress={() => onViewDetails(patient)} 
                activeOpacity={0.7} 
            >
                <View style={styles.photoHeaderContainer}>
                    {patient.photoURL ? (
                        <Image source={{ uri: patient.photoURL }} style={styles.profileImageSmall} />
                    ) : (
                        <View style={styles.photoPlaceholderSmall}>
                            <Ionicons name="person" size={20} color="#fff" />
                        </View>
                    )}
                    <View>
                        <Text style={styles.pacienteNombre}>{patient.nombreCompletoDisplay}</Text> 
                        <Text style={patient.isActive ? styles.pacienteEstadoActive : styles.pacienteEstadoInactive}>
                            Estado: {patient.isActive ? 'Activo' : 'Inactivo'}
                        </Text>
                    </View>
                </View>
                
                <Text style={styles.pacienteDni}>DNI: {patient.dni || 'No especificado'}</Text> 
                <Text style={styles.pacienteTel}>Teléfono: {patient.telefono}</Text>
                <Text style={styles.pacienteEmail}>Email: {patient.correo}</Text>
            </TouchableOpacity>

            <View style={styles.actionsContainer}>
                
                {patient.isActive && (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton, styles.buttonHalfWidth]} 
                        onPress={() => onEdit(patient)} 
                    >
                        <FontAwesome name="edit" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                    style={[
                        styles.actionButton, 
                        patient.isActive ? styles.buttonHalfWidth : styles.buttonFullWidth, 
                        { backgroundColor: buttonBgColor }
                    ]} 
                    onPress={() => onDeactivate(patient.id, patient.nombreCompletoDisplay, patient.isActive)} 
                >
                    <FontAwesome name={buttonIcon} size={18} color="#fff" />
                    <Text style={styles.buttonText}>{buttonText}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


// ==========================================================
// Mensajes de Lista Vacía
// ==========================================================
const renderEmptyList = (searchText, isLoading, filterActive) => { 
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
          Verificá la escritura.
        </Text>
      </View>
    );
  }
  
  if (filterActive) {
      return (
          <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>
                  No hay pacientes activos registrados.
              </Text>
              <Text style={styles.emptyListSubText}>
                  Presiona el botón "+" para agregar uno nuevo.
              </Text>
          </View>
      );
  }
  
  return (
    <View style={styles.emptyListContainer}>
        <Text style={styles.emptyListText}>
            No hay pacientes inactivos.
        </Text>
    </View>
  );
};


// ==========================================================
// FUNCIÓN BASE DEL COMPONENTE (Manejo de estados de carga)
// ==========================================================
export function PacientesList({ navigation, filterActive = true }) { 
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchText, setSearchText] = useState(''); 
  const [pacientesData, setPacientesData] = useState([]); 
  const [filteredData, setFilteredData] = useState([]); 
  
  // 💡 ESTADOS CLAVE: isInitialLoading para pantalla completa, isLoading para refresco
  const [isLoading, setIsLoading] = useState(true); 
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // <--- NUEVO ESTADO CLAVE

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error", 
    title: "",
    message: "",
    showCancel: false, 
  });
  const [patientToModify, setPatientToModify] = useState(null); 

  // Función para obtener pacientes de Firestore
  const fetchPacientes = useCallback(async () => {
    // 💡 Si no es la primera carga (ya mostramos datos), solo activamos el indicador sutil
    if (!hasLoadedOnce) {
        setIsLoading(true);
    }
    
    try {
      const pacientesRef = collection(db, 'pacientes');
      let q = pacientesRef;
      
      if (filterActive === false) { 
          q = query(pacientesRef, where("isActive", "==", false));
      }
      
      const pacienteSnapshot = await getDocs(q); 
      
      let list = pacienteSnapshot.docs.map(doc => {
        const data = doc.data();
        
        const lastName = data.lastName || ''; 
        const firstName = data.firstName || ''; 

        return {
          id: doc.id, 
          firstName: firstName, 
          lastName: lastName,
          dni: data.dni || '',
          email: data.email || '', 
          telefono: data.telefono || '', 
          direccion: data.direccion || '', 
          photoURL: data.photoURL || null, 
          isActive: data.isActive !== false, 
          nombreCompletoBusqueda: `${firstName} ${lastName}`.trim(), 
          nombreCompletoDisplay: `${lastName.toUpperCase()}, ${firstName}`, 
          correo: data.email || 'No especificado', 
        };
      });

      if (filterActive === true) {
          list = list.filter(p => p.isActive === true);
      }
      
      list.sort((a, b) => a.lastName.localeCompare(b.lastName));
      
      setPacientesData(list);
      setFilteredData(list); 

    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      showAlert("error", "Error de Carga", "No se pudieron cargar los pacientes.", false);
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true); // 💡 Marcamos que la carga inicial ha ocurrido
    }
  }, [filterActive]); 

  useEffect(() => {
    fetchPacientes();
    
    const unsubscribe = navigation.addListener('focus', () => {
        // Al regresar a la pantalla, recargamos (esto activa el indicador sutil si hasLoadedOnce es true)
        fetchPacientes(); 
    });

    return unsubscribe; 
  }, [fetchPacientes, navigation]); 


  // ==========================================================
  // FUNCIONES DE MANEJO DE ESTADO (Desactivación/Activación)
  // ==========================================================
  
  const showAlert = useCallback((type, title, message, showCancel = false) => { 
      setAlertConfig({ visible: true, type, title, message, showCancel }); 
  }, []);

  const handleDismissAlert = useCallback(() => { 
      setAlertConfig((prev) => {
          if (prev.showCancel) { 
              setPatientToModify(null); 
          }
          return { ...prev, visible: false };
      });
  }, []); 

  const handleConfirmDeactivate = useCallback(async () => { 
      if (!patientToModify) {
          handleDismissAlert(); 
          return;
      }

      const { id, nombreCompletoDisplay, isActive } = patientToModify;
      const newState = !isActive; 
      const actionText = newState ? "activar" : "desactivar";
      const successText = newState ? "activado" : "desactivado";

      handleDismissAlert(); 
      setIsLoading(true);

      try {
        const pacienteRef = doc(db, "pacientes", id);
        await updateDoc(pacienteRef, {
            isActive: newState, 
        });
        
        await fetchPacientes(); 
        
        showAlert("success", "Éxito", `Paciente ${nombreCompletoDisplay} ha sido ${successText} correctamente.`, false);
      } catch (error) {
        console.error(`Error al ${actionText} paciente:`, error);
        showAlert("error", "Error", `No se pudo ${actionText} al paciente. Inténtalo de nuevo.`, false); 
        setIsLoading(false); 
      } finally {
          setPatientToModify(null); 
      }
  }, [patientToModify, fetchPacientes, showAlert, handleDismissAlert]);


  const handleDeactivate = (patientId, nombreCompletoDisplay, isActive) => { 
    setPatientToModify({ id: patientId, nombreCompletoDisplay, isActive });
    
    const title = isActive ? "Confirmar Desactivación" : "Confirmar Activación";
    const message = isActive 
        ? `¿Estás seguro de que deseas desactivar a ${nombreCompletoDisplay}? Ya no aparecerá en la lista de activos.`
        : `¿Estás seguro de que deseas reactivar a ${nombreCompletoDisplay}? Volverá a aparecer en la lista de activos.`;
        
    showAlert(
        "error", 
        title, 
        message,
        true 
    );
  };
  
  const handleViewDetails = (patient) => {
    navigation.navigate('NuevoPaciente', { 
        patientData: patient,
        isViewMode: true, 
    });
  };

  const handleEdit = (patient) => {
    navigation.navigate('NuevoPaciente', { 
        patientData: patient,
        isViewMode: false, 
    });
  };

  const handleSearch = (text) => {
    setSearchText(text);
    
    if (text && text.length > 0) { 
      const lowercasedText = text.toLowerCase();
      
      const newFilteredData = pacientesData.filter(item => { 
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
  
  const screenTitle = filterActive ? "Pacientes Activos" : "Pacientes Inactivos";
  const currentRouteName = navigation.getState().routes[navigation.getState().index].name;

  // 💡 CLAVE: Pantalla de carga COMPLETA solo si es la primera vez (para evitar mostrar datos vacíos)
  if (isLoading && !hasLoadedOnce) {
    return (
        <LinearGradient 
          colors={['#20d3c4ff', '#9FE2CF']} 
          style={[styles.contenedorHeader, {justifyContent: 'center', alignItems: 'center'}]}
        >
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{color: '#fff', marginTop: 10, fontSize: 16}}>{`Cargando pacientes ${filterActive ? 'activos' : 'inactivos'}...`}</Text>
        </LinearGradient>
    );
  }

  return (
    <View style={styles.contenedorHeader}>

      <StatusBar barStyle="light-content" backgroundColor="#20d3c4ff" />

      {/* Header Superior (Título dinámico) */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{screenTitle}</Text>
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
                placeholder= {`Buscar paciente ${filterActive ? 'activo' : 'inactivo'} (Nombre, Apellido o DNI)`} 
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
                    onDeactivate={handleDeactivate} 
                />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.turnosList}
            showsVerticalScrollIndicator={false} 
            ListEmptyComponent={() => renderEmptyList(searchText, isLoading, filterActive)} 
          />
           {/* 💡 INDICADOR DE REFRESH EN SEGUNDO PLANO */}
          {isLoading && hasLoadedOnce && (
              <View style={styles.refreshingOverlay}>
                  <ActivityIndicator size="small" color="#3b82f6" />
              </View>
          )}
        </LinearGradient>
      </View>
            
      {/* Botón Flotante para Agregar Nuevo Paciente (Solo visible en Activos) */}
      {filterActive && (
          <TouchableOpacity
              style={styles.fabButton}
              onPress={() => navigation.navigate('NuevoPaciente')}
          >
              <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
      )}


      {/* Menú Modal */}
      <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
        navigation={navigation}
        currentRouteName={currentRouteName} 
      />

      {/* COMPONENTE DE ALERTA PERSONALIZADA */}
      <CustomAlert
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          showCancel={alertConfig.showCancel} 
          onClose={handleDismissAlert} 
          onConfirm={handleConfirmDeactivate} 
          buttonText={patientToModify?.isActive ? "DESACTIVAR" : "ACTIVAR"} 
      />
    </View>
  );
}

// ==========================================================
// EXPORTACIONES Y ESTILOS
// ==========================================================

// 1. Componente Wrapper para Pacientes Activos (la pantalla original)
export function PacientesActivosScreen({ navigation }) {
    return <PacientesList navigation={navigation} filterActive={true} />;
}

// 2. Exportación por defecto
export default PacientesActivosScreen; 


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
  pacienteCardGlowActive: { 
    borderLeftWidth: 6,
    borderLeftColor: '#1595a6', // Verde Agua para activo
    borderRadius: 12, 
    overflow: 'hidden', 
  },
  pacienteCardGlowInactive: { 
    borderLeftWidth: 6,
    borderLeftColor: '#ff6b6b', // Rojo para inactivo
    borderRadius: 12, 
    overflow: 'hidden', 
    opacity: 0.9, 
  },
  pacienteEstadoActive: {
    fontSize: 12,
    color: '#1595a6',
    fontWeight: 'bold',
  },
  pacienteEstadoInactive: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  menuItemActive: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  menuItemTextActive: { 
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  
  photoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, 
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
    backgroundColor: '#3b82f6', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  pacienteNombre: {
    fontSize: 16, 
    fontWeight: 'bold',
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
  buttonFullWidth: { 
    width: '100%',
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
  },
  refreshingOverlay: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    height: 50, // Pequeño indicador en la parte superior
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Fondo semitransparente
    zIndex: 10,
  },
});