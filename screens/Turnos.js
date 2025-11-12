import React, { useState, useEffect, useCallback } from 'react'; 
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    StatusBar, 
    ActivityIndicator,
    Modal, 
    TextInput,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 
import { db } from '../src/config/firebaseConfig'; 
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'; 
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
    { name: 'Tratamientos', screen: 'Tratamientos', isStack: false, icon: 'bandage-outline' }, // Icono Ionicons
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
        // 💡 CLAVE: Navegar a la ruta del Stack (Personal, Tratamientos, Pacientes, Turnos)
        navigation.navigate(option.screen);
    }
  };

  const getIconComponent = (option) => {
    // 💡 CORRECCIÓN: Solo 'Personal' usa MaterialCommunityIcons (account-group)
    if (option.name === 'Personal') {
        return <MaterialCommunityIcons name={option.icon} size={24} color="#3b82f6" />;
    }
    // Tratamientos, Pacientes, Home, Turnos, Perfil usan Ionicons (por defecto)
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
// Componente de la Tarjeta de Turno (Mínima)
// ==========================================================
const TurnoCard = ({ turno, onDetail, isToday }) => {
    const cardStyle = isToday ? styles.turnoCardToday : styles.turnoCard;

    return (
        <TouchableOpacity style={cardStyle} onPress={() => onDetail(turno)}>
            <View style={styles.cardHeader}>
                <Text style={styles.turnoTime}>{turno.time}</Text>
                <Text style={styles.turnoDate}>{turno.date}</Text>
            </View>
            <Text style={styles.pacienteName}>{turno.pacienteName}</Text>
            <Text style={styles.tratamientoName}>{turno.tratamientoName}</Text>
        </TouchableOpacity>
    );
};

// ==========================================================
// Función Principal de Turnos
// ==========================================================
export default function Turnos({ navigation }) {
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [turnos, setTurnos] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredTurnos, setFilteredTurnos] = useState([]);
    
    // CLAVE: Obtener el nombre de la ruta actual
    const currentRouteName = navigation.getState().routes[navigation.getState().index].name;


    // Placeholder para la carga de datos (deberías usar tu lógica Firestore real aquí)
    const fetchTurnos = useCallback(async () => {
        setIsLoading(true);
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const dummyData = [
            { id: '1', date: '12/11/2025', time: '10:00', pacienteName: 'GÓMEZ, Ana', tratamientoName: 'Fisioterapia', isToday: true },
            { id: '2', date: '12/11/2025', time: '11:00', pacienteName: 'PEREZ, Luis', tratamientoName: 'Masaje', isToday: true },
            { id: '3', date: '13/11/2025', time: '09:00', pacienteName: 'RODRÍGUEZ, Carla', tratamientoName: 'Acupuntura', isToday: false },
        ];

        setTurnos(dummyData);
        setFilteredTurnos(dummyData);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchTurnos();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTurnos();
        });
        return unsubscribe;
    }, [fetchTurnos, navigation]);

    const handleSearch = (text) => {
        setSearchText(text);
        if (text) {
            const lowercasedText = text.toLowerCase();
            const filtered = turnos.filter(turno => 
                turno.pacienteName.toLowerCase().includes(lowercasedText) ||
                turno.tratamientoName.toLowerCase().includes(lowercasedText)
            );
            setFilteredTurnos(filtered);
        } else {
            setFilteredTurnos(turnos);
        }
    };
    
    const renderEmptyList = () => (
        <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>No hay turnos agendados.</Text>
            <Text style={styles.emptyListSubText}>Presiona el "+" para crear uno nuevo.</Text>
        </View>
    );

    return (
        <View style={styles.contenedorHeader}>
            <StatusBar barStyle="light-content" backgroundColor="#20d3c4ff" />

            {/* Header Superior */}
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Agenda de Turnos</Text>
                <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => setIsMenuVisible(true)}
                >
                    <Ionicons name="menu-outline" size={30} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Contenido */}
            <View style={styles.contentContainer}>
                <View style={styles.turnosHeader}>
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar turno (Paciente o Tratamiento)" 
                        placeholderTextColor="#666"
                        value={searchText} 
                        onChangeText={handleSearch} 
                        autoCapitalize="none" 
                        autoCorrect={false} 
                    />
                </View>
                
                <LinearGradient colors={['#9FE2CF', '#FFFFFF']} style={styles.gradientTurnosList}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 50}}/>
                    ) : (
                        <FlatList
                            data={filteredTurnos} 
                            renderItem={({ item }) => (
                                <TurnoCard 
                                    turno={item} 
                                    onDetail={() => { /* Implementar navegación a detalle */ }} 
                                    isToday={item.isToday}
                                />
                            )}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.turnosList}
                            showsVerticalScrollIndicator={false} 
                            ListEmptyComponent={renderEmptyList}
                        />
                    )}
                </LinearGradient>
            </View>

            {/* Botón Flotante para Agregar Nuevo Turno */}
            {/* <TouchableOpacity
                style={styles.fabButton}
                onPress={() => navigation.navigate('NuevoTurno')
                    
                } 
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity> */}

            {/* Menú Modal */}
            <MenuModal 
                visible={isMenuVisible} 
                onClose={() => setIsMenuVisible(false)} 
                navigation={navigation}
                currentRouteName={currentRouteName} 
            />
        </View>
    );
}

// ==========================================================
// ESTILOS
// ==========================================================

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
        paddingHorizontal: '2%', // <-- Reducimos el padding horizontal
        paddingBottom: 20, 
        width: '100%',
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
    turnoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 25, // <-- Aumentamos el padding interno
        marginTop: 10,
        marginBottom: 10, // <-- Aumentamos el margen vertical
        shadowColor: '#000',
        // 💡 Ajustamos la sombra para que sea más notable (similar a pacientes)
        shadowOffset: { width: 0, height: 5 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 6,
        elevation: 8, // <-- Aumentamos la elevación
        width: "95%", // <-- Aumentamos el ancho
        alignSelf: 'center',
        borderLeftWidth: 6, // <-- Aumentamos el grosor del borde
        borderLeftColor: '#3b82f6', 
    },
    turnoCardToday: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 25, // <-- Aumentamos el padding interno
        marginTop: 10,
        marginBottom: 10, // <-- Aumentamos el margen vertical
        shadowColor: '#000',
        // 💡 Ajustamos la sombra para que sea más notable
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 12, // <-- Aumentamos la elevación
        width: "95%", // <-- Aumentamos el ancho
        borderLeftWidth: 6, // <-- Aumentamos el grosor del borde
        borderLeftColor: '#ff9800',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
        marginBottom: 8,
    },
    turnoTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    turnoDate: {
        fontSize: 16,
        color: '#777',
    },
    pacienteName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    tratamientoName: {
        fontSize: 14,
        color: '#555',
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
    
    // ESTILOS DEL MENÚ (Remarcado)
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
    // ESTILOS NUEVOS PARA REMARCADO
    menuItemActive: {
        backgroundColor: '#e6f7ff', // Fondo azul claro para remarcar
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    menuItemTextActive: { 
        fontWeight: 'bold',
        color: '#3b82f6', // Usar el color del borde para el texto activo
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