import React, { useState, useRef, useEffect } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    Alert as RNAlert 
} from "react-native";
// Importamos el componente CustomAlert que soporta confirmación (doble botón)
import CustomAlert from '../components/Alert'; 
import { auth, firebaseApp } from "../src/config/firebaseConfig"; 
import { updateEmail, updateProfile } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";


// ==========================================================
// FUNCIÓN AUXILIAR PARA PARSEAR EL NOMBRE COMPLETO (VERSIÓN SIMPLE)
// ==========================================================
// Lógica simple: La primera palabra es el Nombre, el resto es el Apellido.
const parseDisplayName = (displayName) => {
    if (!displayName) return ['', ''];
    
    // 1. Limpieza y división
    const cleanedName = displayName.trim().replace(/\s+/g, ' '); 
    const parts = cleanedName.split(' ').filter(p => p.length > 0); 

    if (parts.length === 0) return ['', ''];
    
    // La primera parte es el nombre (Ej: "Juan")
    const firstName = parts[0]; 
    
    // El resto de las partes son los apellidos (Ej: "David Pérez García")
    const lastName = parts.slice(1).join(' '); 
    
    return [firstName, lastName];
};


// ==========================================================
// PANTALLA PRINCIPAL DE PERFIL CON EDICIÓN
// ==========================================================
export default function Perfil({ navigation }) {
  const user = auth.currentUser;
  
  // 💡 USAR LA LÓGICA DE PARSEO INICIAL SIMPLE
  const [initialFirstName, initialLastName] = parseDisplayName(user?.displayName);

  const [isEditing, setIsEditing] = useState(false);
  
  // Usamos las variables iniciales para el estado
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(user?.email || '');

  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  // Estado para la alerta personalizada
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    isConfirmation: false, // Indica si se necesita doble botón (Confirmación/Cancelación)
  });

  const showAlert = (type, title, message, isConfirmation = false) => {
    setAlertConfig({ visible: true, type, title, message, isConfirmation });
  };

  // Función para CERRAR el modal de alerta (Cancelar acción o Aceptar alerta simple)
  const handleCloseAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  // Función para CONFIRMAR la acción (Cerrar sesión)
  const handleConfirmLogout = async () => {
    handleCloseAlert();
    try {
        await auth.signOut();
    } catch (error) {
        showAlert("error", "Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.", false);
    }
  };
  
  // ----------------------------------------------------------------
  // Funciones de validación
  // ----------------------------------------------------------------
  const validateName = (text) => {
    // Permite letras y espacios (para nombres/apellidos compuestos)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    return nameRegex.test(text);
  };
  
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };
  
  const handleFirstNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
    setFirstName(filteredText);
    setFirstNameError(filteredText && !validateName(filteredText));
  };

  const handleLastNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
    setLastName(filteredText);
    setLastNameError(filteredText && !validateName(filteredText));
  };
  
  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError(text && !validateEmail(text));
  };
  // ----------------------------------------------------------------


  const handleUpdateProfile = async () => {
    if (!user) {
        showAlert("error", "Error", "No hay usuario autenticado.");
        return;
    }
    
    // --- 1. Validaciones Síncronas ---
    let hasError = false;

    if (!firstName.trim() || !lastName.trim()) {
        showAlert("error", "Error", "El nombre y apellido son obligatorios.");
        hasError = true;
    }
    if (firstNameError || lastNameError) {
        showAlert("error", "Error", "El nombre o apellido contienen caracteres no válidos.");
        hasError = true;
    }
    if (!validateEmail(email)) {
        setEmailError(true);
        showAlert("error", "Error", "El formato del correo electrónico no es válido.");
        hasError = true;
    } else {
        setEmailError(false);
    }
    
    if (hasError) return;

    // --- 2. Actualización Asíncrona en Firebase ---
    try {
        // Unimos el nombre y el apellido para guardarlos como un solo DisplayName en Firebase
        const newDisplayName = `${firstName.trim()} ${lastName.trim()}`;
        
        let profileUpdated = false;
        if (user.displayName !== newDisplayName) {
            await updateProfile(user, { displayName: newDisplayName });
            profileUpdated = true;
        }

        let emailUpdated = false;
        if (user.email !== email) {
            await updateEmail(user, email); 
            emailUpdated = true;
        }
        
        if (profileUpdated || emailUpdated) {
             showAlert("success", "Éxito", "Perfil actualizado correctamente.");
        } else {
             // Si no hubo cambios, solo cerramos la edición
             showAlert("info", "Información", "No se detectaron cambios para guardar.");
        }
       
        setIsEditing(false); 

    } catch (error) {
        let errorMessage = "Hubo un problema al actualizar el perfil.";
        switch (error.code) {
             case 'auth/requires-recent-login':
                errorMessage = "Esta acción requiere que inicies sesión nuevamente para verificar tu identidad. Por favor, cierra sesión y vuelve a entrar.";
                break;
            case 'auth/email-already-in-use':
                errorMessage = "El nuevo correo electrónico ya está en uso por otra cuenta.";
                break;
            case 'auth/invalid-email':
                errorMessage = "El nuevo formato de correo electrónico no es válido.";
                break;
            default:
                console.error("Firebase update error:", error);
                break;
        }
        showAlert("error", "Error", errorMessage);
    }
  };

  /**
   * Muestra la alerta personalizada para confirmar el cierre de sesión.
   */
  const handleLogout = () => {
      showAlert(
          "error", 
          "Cerrar Sesión", 
          "¿Estás seguro de que deseas cerrar tu sesión actual?",
          true 
      );
  };
  
  /**
   * Reestablece los campos a los valores que están actualmente en Firebase (después de cualquier posible actualización).
   */
  const handleCancelEdit = () => {
      // 💡 CLAVE: Volvemos a parsear el valor actual de Firebase para restablecer.
      // USAMOS EL parseDisplayName SIMPLE
      const [currentFirstName, currentLastName] = parseDisplayName(auth.currentUser?.displayName);
      
      setFirstName(currentFirstName);
      setLastName(currentLastName);
      setEmail(auth.currentUser?.email || '');
      
      // Limpiamos los errores visuales
      setFirstNameError(false);
      setLastNameError(false);
      setEmailError(false);
      
      setIsEditing(false);
  };

  // Determinar los estilos del botón de edición/cancelación
  const editButtonColor = isEditing ? "#ff6b6b" : "#64bae8"; 
  const editButtonText = isEditing ? "CANCELAR EDICIÓN" : "EDITAR PERFIL";
  const editIcon = isEditing ? "times-circle" : "pencil";


  return (
    <LinearGradient colors={["#FFFFFF", "#9FE2CF"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isEditing ? "Editar Perfil" : "Mi Perfil"}</Text>
        
        {/* ==================== CAMPOS DE INFORMACIÓN/EDICIÓN ==================== */}
        
        {/* NOMBRE */}
        <Text style={styles.label}>Nombre(s)</Text>
        <View style={[styles.inputGroup, isEditing && firstNameError && styles.inputGroupError]}>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={handleFirstNameChange}
              editable={isEditing}
              placeholder="Ej: Juan" 
              placeholderTextColor="#888"
            />
        </View>
        {isEditing && firstNameError && (
            <Text style={styles.errorText}>El nombre solo debe contener letras</Text>
        )}
        
        {/* APELLIDO */}
        <Text style={styles.label}>Apellido(s)</Text>
        <View style={[styles.inputGroup, isEditing && lastNameError && styles.inputGroupError]}>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={handleLastNameChange}
              editable={isEditing}
              placeholder="Ej: Pérez García (incluir ambos apellidos)"
              placeholderTextColor="#888"
            />
        </View>
        {isEditing && lastNameError && (
            <Text style={styles.errorText}>El apellido solo debe contener letras</Text>
        )}

        {/* CORREO */}
        <Text style={styles.label}>Correo</Text>
        <View style={[styles.inputGroup, isEditing && emailError && styles.inputGroupError]}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={handleEmailChange}
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Correo"
              placeholderTextColor="#888"
            />
        </View>
        {isEditing && emailError && (
            <Text style={styles.errorText}>Formato de correo inválido (ej: usuario@dominio.com)</Text>
        )}
        
        {/* BOTÓN DE GUARDAR CAMBIOS */}
        {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>
            </TouchableOpacity>
        )}

        {/* ==================== BOTÓN EDITAR/CANCELAR EDICIÓN ==================== */}
        <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: editButtonColor }]}
            onPress={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
        >
            <FontAwesome 
                name={editIcon} 
                size={18} 
                color={"#fff"} 
                style={{ marginRight: 8 }}
            />
            <Text style={styles.actionButtonText}>
                {editButtonText}
            </Text>
        </TouchableOpacity>


        {/* BOTÓN DE CERRAR SESIÓN */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
      
      {/* RENDERIZAR EL CUSTOM ALERT */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        
        // Mapea las acciones según si es una alerta de confirmación o simple
        onCancel={handleCloseAlert}
        onConfirm={alertConfig.isConfirmation ? handleConfirmLogout : handleCloseAlert} 
        
        showCancel={alertConfig.isConfirmation}
        
        buttonText={alertConfig.isConfirmation ? "CERRAR SESIÓN" : "Aceptar"} 
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    justifyContent: 'center',
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
    textAlign: "center",
  },
  
  // --- ESTILOS DE PERFIL ---
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputGroupError: {
    borderColor: "#ff6b6b", // Color de error de SignUp
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 14,
    color: "#333",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -3,
  },

  // Botón Guardar Cambios 
  saveButton: {
    backgroundColor: "#05f7c2", // Verde similar a la confirmación de SignUp
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    width: '60%',
    alignSelf: "center",
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Estilo unificado para botones de acción (Editar/Cancelar)
  actionButton: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 10, 
    width: '60%',
    alignSelf: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Botón Cerrar Sesión (Mantenido)
  logoutButton: {
    backgroundColor: "#ff6b6b", 
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});