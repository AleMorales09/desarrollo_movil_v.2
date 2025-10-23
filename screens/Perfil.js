import React, { useState, useMemo, useEffect } from "react"; 
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    Image, 
    ActivityIndicator, 
    Modal, 
} from "react-native";
import * as ImagePicker from 'expo-image-picker'; 
import CustomAlert from '../components/Alert'; 
import { 
    auth, 
    db 
} from "../src/config/firebaseConfig"; 
import { 
    updateEmail, 
    updateProfile, 
    updatePassword, 
    reauthenticateWithCredential, 
    EmailAuthProvider, 
} from "firebase/auth";
import { 
    doc, 
    getDoc, 
    updateDoc, 
    setDoc 
} from 'firebase/firestore'; 
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// ==========================================================
// CONFIGURACIÓN DE CLOUDINARY (¡DEBES CAMBIAR ESTOS VALORES!)
// ==========================================================
// ⚠️ ¡IMPORTANTE! Revisa que estos valores sean correctos para tu cuenta de Cloudinary.
const CLOUDINARY_CLOUD_NAME = 'dcambilud'; 
const CLOUDINARY_UPLOAD_PRESET = 'consultorio_foto'; 
const CLOUDINARY_API_KEY = '452396411417448';
const DEFAULT_AVATAR = 'https://res.cloudinary.com/demo/image/upload/v1607552554/avatar_placeholder.png';

// ==========================================================
// FUNCIÓN AUXILIAR PARA PARSEAR EL NOMBRE COMPLETO
// ==========================================================
const parseDisplayName = (displayName) => {
    if (!displayName) return ['', ''];
    const cleanedName = displayName.trim().replace(/\s+/g, ' '); 
    const parts = cleanedName.split(' ').filter(p => p.length > 0); 

    if (parts.length === 0) return ['', ''];
    
    const firstName = parts[0]; 
    const lastName = parts.slice(1).join(' '); 
    
    return [firstName, lastName];
};

// ==========================================================
// FUNCIÓN AUXILIAR: Limpieza y Construcción de DisplayName
// ==========================================================
const cleanAndBuildDisplayName = (firstName, lastName) => {
    const rawDisplayName = `${firstName.trim()} ${lastName.trim()}`;
    return rawDisplayName.replace(/\s+/g, ' ').trim();
};

// ==========================================================
// FUNCIONES DE LIMPIEZA DE DIRECCIÓN Y TELÉFONO
// ==========================================================

const cleanAddress = (text) => {
    return text.replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]/g, '');
};

const cleanPhone = (text) => {
    return text.replace(/\D/g, '');
};


// ==========================================================
// PANTALLA PRINCIPAL DE PERFIL CON EDICIÓN
// ==========================================================
export default function Perfil({ navigation }) {
    
    const user = auth.currentUser;
  
    // ==========================================================
    // 1. ESTADOS
    // ==========================================================
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Estados de datos
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [profileImage, setProfileImage] = useState(user?.photoURL || null); 

    // Estado para la carga de la imagen
    const [isLoadingImage, setIsLoadingImage] = useState(false); // <--- NUEVO ESTADO DE CARGA
    
    // Nuevos estados para dirección y teléfono
    const [address, setAddress] = useState(''); 
    const [phone, setPhone] = useState(''); 
    
    // Estado para guardar los datos originales
    const [originalData, setOriginalData] = useState({ 
        firstName: '', 
        lastName: '', 
        email: user?.email || '', 
        photoURL: user?.photoURL || null,
        address: '', 
        phone: '', 
    });
    
    // Estados de la UI
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false); 
    
    const [showImageSourceOptions, setShowImageSourceOptions] = useState(false); 

    // Estados de la contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Estados visuales y de error
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [showPasswordInfo, setShowPasswordInfo] = useState(false);
    const [showPasswordMatchInfo, setShowPasswordMatchInfo] = useState(false);
    const [firstNameError, setFirstNameError] = useState(false);
    const [lastNameError, setLastNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [currentPasswordError, setCurrentPasswordError] = useState(false); 

    // Estado para la alerta personalizada
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        type: "info",
        title: "",
        message: "",
        isConfirmation: false,
    });
    
    // ==========================================================
    // 2. EFECTOS
    // ==========================================================
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) {
                setIsDataLoaded(true); 
                return;
            }

            let loadedFirstName, loadedLastName, loadedEmail, loadedPhotoURL, loadedAddress, loadedPhone;

            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // 1. Datos cargados desde Firestore (prioridad)
                    const data = userDoc.data();
                    loadedFirstName = data.firstName || '';
                    loadedLastName = data.lastName || '';
                    loadedEmail = data.email || user.email; 
                    loadedAddress = data.address || '';
                    loadedPhone = data.phone ? cleanPhone(data.phone) : ''; 
                    
                } else {
                    // 2. Fallback a Auth
                    const [authFirstName, authLastName] = parseDisplayName(user.displayName);
                    loadedFirstName = authFirstName;
                    loadedLastName = authLastName;
                    loadedEmail = user.email;
                    loadedAddress = '';
                    loadedPhone = '';

                    // Opcional: Crear el documento de Firestore para el usuario legado
                    if (loadedFirstName || loadedLastName) {
                        await setDoc(userDocRef, {
                            firstName: loadedFirstName,
                            lastName: loadedLastName,
                            email: loadedEmail,
                            address: loadedAddress, 
                            phone: loadedPhone,     
                        }, { merge: true }); 
                    }
                }
                
                loadedPhotoURL = user.photoURL || null;

                // Establecer estados del formulario
                setFirstName(loadedFirstName);
                setLastName(loadedLastName);
                setEmail(loadedEmail);
                setProfileImage(loadedPhotoURL); 
                setAddress(loadedAddress);
                setPhone(loadedPhone);

                // Establecer datos originales para cancelación/comparación
                setOriginalData({ 
                    firstName: loadedFirstName, 
                    lastName: loadedLastName, 
                    email: loadedEmail, 
                    photoURL: loadedPhotoURL,
                    address: loadedAddress,
                    phone: loadedPhone,
                });

            } catch (error) {
                console.error("Error al cargar datos de Firestore:", error);
                
                const [authFirstName, authLastName] = parseDisplayName(user.displayName);
                loadedFirstName = authFirstName;
                loadedLastName = authLastName;
                
                setFirstName(loadedFirstName);
                setLastName(loadedLastName);
                setEmail(user.email || '');
                setProfileImage(user.photoURL || null);
                setAddress('');
                setPhone('');
                
                setOriginalData({ 
                    firstName: loadedFirstName, 
                    lastName: loadedLastName, 
                    email: user.email || '', 
                    photoURL: user.photoURL || null,
                    address: '',
                    phone: '',
                });
            } finally {
                setIsDataLoaded(true);
            }
        };

        fetchUserData();
    }, [user]); 
    
    // ==========================================================
    // 3. MEMORIZACIÓN (VALIDACIÓN DE CONTRASEÑA)
    // ==========================================================

    const passwordChecks = useMemo(() => ({
        hasCase: /[a-z]/.test(newPassword),
        hasUppercase: /[A-Z]/.test(newPassword),
        hasNumber: /\d/.test(newPassword),
        hasMinLength: newPassword.length >= 6,
    }), [newPassword]);

    const passwordsMatch = useMemo(() => {
        return newPassword.length > 0 && confirmNewPassword.length > 0 && newPassword === confirmNewPassword;
    }, [newPassword, confirmNewPassword]);

    const isPasswordValid = useMemo(() => {
        return Object.values(passwordChecks).every(check => check) && passwordsMatch;
    }, [passwordChecks, passwordsMatch]);

    // ==========================================================
    // 4. FUNCIONES DE MANEJO
    // ==========================================================

    const validateName = (text) => {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
        return nameRegex.test(text);
    };
  
    const validateEmail = (text) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(text);
    };

    const showAlert = (type, title, message, isConfirmation = false) => {
        setAlertConfig({ visible: true, type, title, message, isConfirmation });
    };

    const handleCloseAlert = () => {
        setAlertConfig({ ...alertConfig, visible: false });
    };
    
    const handleAvatarPress = () => {
        // Abre el Modal/Menú de opciones de imagen (Cámara/Galería)
        setShowImageSourceOptions(true);
    };

    /**
     * @description Función para subir la imagen a Cloudinary.
     */
    const uploadImageToCloudinary = async (uri) => {
        // Crear el objeto FormData para el envío
        const data = new FormData();
        // Generar un nombre de archivo único
        data.append('file', { 
            uri, 
            name: `profile_${user.uid}_${Date.now()}.jpg`, 
            type: 'image/jpeg' 
        });
        // Credenciales de Cloudinary
        data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        data.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        
        // Ejecutar la petición POST
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data,
            // Cloudinary no requiere headers para el Content-Type de FormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        return result.secure_url;
    };


    /**
     * @description Función que gestiona la selección y la subida de la imagen.
     */
    const uploadImage = async (uri) => {
        if (!user) {
            showAlert("error", "Error", "No hay usuario autenticado.");
            return;
        }

        setIsLoadingImage(true); // Iniciar la carga

        try {
            // PASO 1: Subir a Cloudinary
            const cloudinaryUrl = await uploadImageToCloudinary(uri);
            
            if (cloudinaryUrl) {
                // PASO 2: Actualizar la URL en Firebase Auth
                await updateProfile(user, { photoURL: cloudinaryUrl });
                
                // PASO 3: Actualizar estados locales y originales
                setProfileImage(cloudinaryUrl);
                setOriginalData(prev => ({ ...prev, photoURL: cloudinaryUrl }));
                
                showAlert("success", "Éxito", "Foto de perfil actualizada correctamente.");
            } else {
                showAlert("error", "Error de Carga", "No se pudo obtener la URL de Cloudinary.");
            }
        } catch (error) {
            console.error("Error al subir imagen:", error);
            
            // Mensaje de error más específico
            const userError = error.message.includes("Cloudinary upload failed") 
                ? "Fallo en la subida a Cloudinary. Revisa tu PRESET y Cloud Name en el código." 
                : "Fallo al subir la imagen de perfil. Inténtalo de nuevo.";
            
            showAlert("error", "Error", userError);
        } finally {
            setIsLoadingImage(false); // Detener la carga
        }
    };
    
    // Lógica para seleccionar la imagen
    const pickImage = async (source) => {
        setShowImageSourceOptions(false); 
        
        let result;
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (source === 'camera') {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
                showAlert("error", "Permiso Requerido", "Necesitamos permiso para acceder a la cámara.");
                return;
            }
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
        } else {
            if (!mediaLibraryPermission.granted) {
                showAlert("error", "Permiso Requerido", "Necesitamos permiso para acceder a la galería.");
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
        }
    
        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };


    const handleUpdateProfile = async () => {
        if (!user) {
            showAlert("error", "Error", "No hay usuario autenticado.");
            return;
        }
        
        if (isChangingPassword) {
            handleChangePassword();
            return;
        }

        let hasError = false;

        // Validación de campos
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

        try {
            const trimmedFirstName = firstName.trim();
            const trimmedLastName = lastName.trim();

            const trimmedAddress = cleanAddress(address);
            const trimmedPhone = cleanPhone(phone);

            const newDisplayName = cleanAndBuildDisplayName(trimmedFirstName, trimmedLastName); 

            let authProfileUpdated = false;
            let firestoreUpdated = false;
            let emailUpdated = false;

            // 2. Actualizar displayName de Auth 
            if (user.displayName !== newDisplayName) {
                await updateProfile(user, { displayName: newDisplayName });
                authProfileUpdated = true;
            }

            // 3. Actualizar email de Auth 
            if (user.email !== email) {
                await updateEmail(user, email); 
                emailUpdated = true;
            }

            // 4. ACTUALIZAR LOS DATOS SEPARADOS EN FIRESTORE
            const userDocRef = doc(db, "users", user.uid);
            
            // Comprobar si hay cambios en los campos de Firestore
            if (originalData.firstName !== trimmedFirstName || 
                originalData.lastName !== trimmedLastName || 
                originalData.email !== email ||
                originalData.address !== trimmedAddress ||
                originalData.phone !== trimmedPhone 
            ) {
                await updateDoc(userDocRef, {
                    firstName: trimmedFirstName,
                    lastName: trimmedLastName,
                    email: email,
                    address: trimmedAddress,
                    phone: trimmedPhone,
                });
                firestoreUpdated = true;
            }
            
            const profileUpdated = authProfileUpdated || emailUpdated || firestoreUpdated;
            
            if (profileUpdated) {
                // Actualizar los datos originales con los nuevos valores
                setOriginalData(prev => ({ 
                    ...prev, 
                    firstName: trimmedFirstName, 
                    lastName: trimmedLastName, 
                    email: email,
                    address: trimmedAddress,
                    phone: trimmedPhone,
                }));
                
                setAddress(trimmedAddress);
                setPhone(trimmedPhone);
                
                showAlert("success", "Éxito", "Perfil actualizado correctamente.");
            } else {
                showAlert("info", "Información", "No se detectaron cambios para guardar.");
            }
            
            setIsEditing(false); 

        } catch (error) {
            let errorMessage = "Hubo un problema al actualizar el perfil.";
            switch (error.code) {
                case 'auth/requires-recent-login':
                    errorMessage = "Esta acción (cambio de email) requiere que inicies sesión nuevamente para verificar tu identidad.";
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = "El nuevo correo electrónico ya está en uso por otra cuenta.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "El nuevo formato de correo electrónico no es válido.";
                    break;
                default:
                    console.error("Firebase update error:", error);
                    if (error.message.includes('slashes')) {
                        errorMessage = "Error de nombre en Auth. Por favor, pulsa 'Guardar Cambios' de nuevo."
                    } else {
                        errorMessage = error.message || errorMessage;
                    }
                    break;
            }
            showAlert("error", "Error", errorMessage);
        }
    };

    const handleCancelEdit = () => {
        setFirstName(originalData.firstName);
        setLastName(originalData.lastName);
        setEmail(originalData.email);
        setProfileImage(originalData.photoURL); 
        setAddress(originalData.address);
        setPhone(originalData.phone);

        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setCurrentPasswordError(false);

        setFirstNameError(false);
        setLastNameError(false);
        setEmailError(false);
        
        setIsChangingPassword(false);
        setIsEditing(false);
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
  
    const handleConfirmLogout = async () => {
        handleCloseAlert();
        try {
            await auth.signOut();
        } catch (error) {
            showAlert("error", "Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.", false);
        }
    };

    const handleLogout = () => {
        showAlert(
            "error", 
            "Cerrar Sesión", 
            "¿Estás seguro de que deseas cerrar tu sesión actual?",
            true 
        );
    };
  
    const handleChangePassword = async () => {
        if (!user) {
            showAlert("error", "Error", "No hay usuario autenticado.");
            return;
        }
        
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showAlert("error", "Error", "Todos los campos de contraseña son obligatorios.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showAlert("error", "Error", "La nueva contraseña y su confirmación no coinciden.");
            return;
        }

        if (currentPassword === newPassword) {
            showAlert("error", "Error", "La nueva contraseña no puede ser igual a la anterior.");
            return;
        }

        if (!isPasswordValid) {
            showAlert(
                "error",
                "Error",
                "La nueva contraseña no cumple con todos los requisitos de seguridad."
            );
            return;
        }
        
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            setCurrentPasswordError(false);
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                setCurrentPasswordError(true);
                showAlert("error", "Error", "La contraseña actual es incorrecta.");
            } else {
                console.error("Re-authentication error:", error);
                showAlert("error", "Error", "Falló la re-autenticación. Inténtalo de nuevo.");
            }
            return;
        }
        
        try {
            await updatePassword(user, newPassword);
            
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setIsChangingPassword(false);
            
            showAlert("success", "Éxito", "¡Contraseña actualizada correctamente!");
            
        } catch (error) {
            let errorMessage = "Hubo un problema al actualizar la contraseña.";
            if (error.code === 'auth/weak-password') {
                errorMessage = "La nueva contraseña es demasiado débil.";
            }
            console.error("Update password error:", error);
            showAlert("error", "Error", errorMessage);
        }
    };

    // ==========================================================
    // 5. RENDERIZADO CONDICIONAL DE CARGA
    // ==========================================================
    
    if (!isDataLoaded) {
        return (
            <LinearGradient colors={["#FFFFFF", "#9FE2CF"]} style={styles.container}>
                <ActivityIndicator size="large" color="#64bae8" />
                <Text style={{marginTop: 10, fontSize: 16, color: '#333'}}>Cargando perfil...</Text>
            </LinearGradient>
        );
    }
    
    // ==========================================================
    // 6. COMPONENTES AUXILIARES Y RENDERIZADO FINAL
    // ==========================================================
    
    const PasswordMatchInfo = ({ meets }) => (
        <View style={styles.passwordMatchContainer}>
        <FontAwesome
            name={meets ? "check" : "times"}
            size={14}
            color={meets ? "#05f7c2" : "#ff6b6b"}
            style={styles.passwordMatchIcon}
        />
        <Text style={[styles.passwordMatchText, { color: meets ? "#05f7c2" : "#ff6b6b" }]}>
            {meets ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
        </Text>
        </View>
    );

    const PasswordRequirementCheck = ({ meets, text }) => (
        <View style={styles.passwordCheckRow}>
            <FontAwesome
                name="check"
                size={14}
                color={meets ? "#05f7c2" : "#ccc"}
                style={styles.passwordCheckIcon}
            />
            <Text style={[
                styles.passwordCheckText,
                meets && styles.passwordCheckTextValid
            ]}>
                {text}
            </Text>
        </View>
    );

    const editButtonColor = isEditing ? "#ff6b6b" : "#64bae8"; 
    const editButtonText = isEditing ? "CANCELAR EDICIÓN" : "EDITAR PERFIL";
    const editIcon = isEditing ? "times-circle" : "pencil";
    const saveButtonText = isChangingPassword ? "GUARDAR CONTRASEÑA" : "GUARDAR CAMBIOS";


    return (
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          enableOnAndroid={true}
          extraScrollHeight={-60}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient colors={["#FFFFFF", "#9FE2CF"]} style={styles.container}>
          <View style={styles.card}>
              <Text style={styles.title}>{isEditing ? "Editar Perfil" : "Mi Perfil"}</Text>
              
              {/* ==================== UI FOTO DE PERFIL ==================== */}
              <View style={styles.avatarContainer}>
                  {isLoadingImage ? (
                      // Indicador de carga mientras sube la imagen
                      <View style={[styles.avatar, styles.loadingOverlay]}>
                          <ActivityIndicator size="large" color="#64bae8" />
                          <Text style={styles.loadingText}>Subiendo...</Text>
                      </View>
                  ) : (
                      // Imagen de perfil normal
                      <Image
                          source={{ uri: profileImage || DEFAULT_AVATAR }}
                          style={styles.avatar}
                      />
                  )}
                  
                  <TouchableOpacity
                      style={styles.avatarEditButton}
                      onPress={handleAvatarPress} 
                      disabled={isLoadingImage} // Deshabilitar durante la carga
                  >
                      <LinearGradient
                          colors={["#64bae8", "#4a90e2"]}
                          style={styles.avatarEditButtonGradient}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                      >
                          <FontAwesome name="camera" size={16} color="#fff" />
                      </LinearGradient>
                  </TouchableOpacity>
              </View>

              {/* ==================== CAMPOS DE INFORMACIÓN/EDICIÓN ==================== */}
              {!isChangingPassword && (
                  <>
                      {/* NOMBRE */}
                      <Text style={styles.label}>Nombre(s)</Text>
                      <View style={[styles.inputGroup, isEditing && firstNameError && styles.inputGroupError]}>
                          <TextInput
                          style={styles.input}
                          value={firstName}
                          onChangeText={handleFirstNameChange}
                          editable={isEditing && !isChangingPassword}
                          placeholder="Ingrese su nombre"
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
                          editable={isEditing && !isChangingPassword}
                          placeholder="Ingrese su apellido"
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
                          editable={isEditing && !isChangingPassword}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          placeholder="Correo"
                          placeholderTextColor="#888"
                          />
                      </View>
                      {isEditing && emailError && (
                          <Text style={styles.errorText}>Formato de correo inválido</Text>
                      )}
                      
                      {/* BOTÓN DE CAMBIAR CONTRASEÑA */}
                      {isEditing && (
                          <TouchableOpacity 
                              style={styles.changePasswordButton} 
                              onPress={() => setIsChangingPassword(true)}
                          >
                              <Text style={styles.changePasswordButtonText}>Cambiar Contraseña</Text>
                          </TouchableOpacity>
                      )}
                  </>
              )}
              
              {/* ==================== NUEVOS CAMPOS (VISIBLES SOLO EN EDICIÓN) ==================== */}
              {isEditing && !isChangingPassword && (
                  <>
                      {/* DIRECCIÓN */}
                      <Text style={styles.label}>Dirección</Text>
                      <View style={styles.inputGroup}>
                          <TextInput
                              style={styles.input}
                              placeholder="Calle, número, ciudad, etc."
                              placeholderTextColor="#888"
                              value={address}
                              onChangeText={text => setAddress(cleanAddress(text))}
                              editable={isEditing}
                          />
                      </View>

                      {/* TELÉFONO */}
                      <Text style={styles.label}>Teléfono</Text>
                      <View style={styles.inputGroup}>
                          <TextInput
                              style={styles.input}
                              placeholder="Número de teléfono"
                              placeholderTextColor="#888"
                              value={phone}
                              keyboardType="numeric" 
                              onChangeText={text => setPhone(cleanPhone(text))}
                              editable={isEditing}
                          />
                      </View>
                  </>
              )}
              {/* ==================== FIN NUEVOS CAMPOS ==================== */}


              {/* ==================== SECCIÓN DE CAMBIO DE CONTRASEÑA ==================== */}
              {isChangingPassword && (
                  <>
                      <Text style={styles.subtitle}>Cambiar Contraseña</Text>

                      {/* CONTRASEÑA ACTUAL */}
                      <Text style={styles.label}>Contraseña Actual</Text>
                      <View style={[styles.inputGroup, currentPasswordError && styles.inputGroupError]}>
                          <TextInput
                              style={styles.input}
                              placeholder="Contraseña Actual"
                              value={currentPassword}
                              onChangeText={setCurrentPassword}
                              secureTextEntry={!showCurrentPassword}
                              placeholderTextColor="#888"
                          />
                          <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeButton}>
                              <FontAwesome name={showCurrentPassword ? "eye-slash" : "eye"} size={18} color="#555" />
                          </TouchableOpacity>
                      </View>
                      {currentPasswordError && (
                          <Text style={styles.errorText}>La contraseña actual no es correcta</Text>
                      )}

                      {/* NUEVA CONTRASEÑA */}
                      <Text style={styles.label}>Nueva Contraseña</Text>
                      <View style={styles.inputGroup}>
                          <TextInput
                              style={styles.input}
                              placeholder="Nueva Contraseña"
                              value={newPassword}
                              onChangeText={setNewPassword}
                              secureTextEntry={!showNewPassword}
                              onFocus={() => setShowPasswordInfo(true)}
                              onBlur={() => setShowPasswordInfo(false)}
                              placeholderTextColor="#888"
                          />
                          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                              <FontAwesome name={showNewPassword ? "eye-slash" : "eye"} size={18} color="#555" />
                          </TouchableOpacity>
                      </View>
                      
                      {showPasswordInfo && (
                          <View style={styles.passwordCard}>
                              <Text style={styles.passwordCardTitle}>Requisitos de la nueva contraseña:</Text>
                              <PasswordRequirementCheck meets={passwordChecks.hasMinLength} text="Mínimo 6 caracteres" />
                              <PasswordRequirementCheck meets={passwordChecks.hasCase} text="Al menos una letra minúscula" />
                              <PasswordRequirementCheck meets={passwordChecks.hasUppercase} text="Al menos una letra mayúscula" />
                              <PasswordRequirementCheck meets={passwordChecks.hasNumber} text="Al menos un número" />
                          </View>
                      )}

                      <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                      <View style={styles.inputGroup}>
                          <TextInput
                              style={styles.input}
                              placeholder="Confirme la nueva contraseña"
                              value={confirmNewPassword}
                              onChangeText={setConfirmNewPassword}
                              secureTextEntry={!showConfirmNewPassword}
                              onFocus={() => setShowPasswordMatchInfo(true)}
                              onBlur={() => setShowPasswordMatchInfo(false)}
                              placeholderTextColor="#888"
                          />
                          <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)} style={styles.eyeButton}>
                              <FontAwesome name={showConfirmNewPassword ? "eye-slash" : "eye"} size={18} color="#555" />
                          </TouchableOpacity>
                      </View>
                      
                      {showPasswordMatchInfo && (confirmNewPassword.length > 0) && (
                          <PasswordMatchInfo meets={passwordsMatch} /> 
                      )}
                      {confirmNewPassword.length === 0 && <View style={{marginBottom: 10}}/>}

                  </>
              )}
              
              {/* ==================== BOTÓN GUARDAR (Común) ==================== */}
              {isEditing && (
                  <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={isChangingPassword ? handleChangePassword : handleUpdateProfile}
                      disabled={isLoadingImage} // Deshabilitar si está subiendo la imagen
                  >
                      <Text style={styles.saveButtonText}>{saveButtonText}</Text>
                  </TouchableOpacity>
              )}

              {/* ==================== BOTÓN EDITAR/CANCELAR EDICIÓN (Común) ==================== */}
              <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: editButtonColor }]}
                  onPress={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                  disabled={isLoadingImage} // Deshabilitar si está subiendo la imagen
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
          
          {/* ==================== MODAL DE SELECCIÓN DE IMAGEN ==================== */}
          <Modal
              animationType="fade"
              transparent={true}
              visible={showImageSourceOptions}
              onRequestClose={() => setShowImageSourceOptions(false)}
          >
              <TouchableOpacity 
                  style={styles.menuOverlay} 
                  activeOpacity={1}
                  onPress={() => setShowImageSourceOptions(false)} 
              >
                  <View style={styles.menuContainer}>
                      <Text style={styles.menuTitle}>Seleccionar Foto</Text>
                      
                      {/* Opción Cámara */}
                      <TouchableOpacity 
                          style={styles.menuOption} 
                          onPress={() => pickImage('camera')}
                      >
                          <FontAwesome name="camera" size={20} color="#64bae8" style={{marginRight: 10}}/>
                          <Text style={styles.menuOptionText}>Usar Cámara</Text>
                      </TouchableOpacity>

                      <View style={styles.menuDivider} />

                      {/* Opción Galería */}
                      <TouchableOpacity 
                          style={styles.menuOption} 
                          onPress={() => pickImage('library')}
                      >
                          <FontAwesome name="image" size={20} color="#64bae8" style={{marginRight: 10}}/>
                          <Text style={styles.menuOptionText}>Elegir de Galería</Text>
                      </TouchableOpacity>
                      
                      {/* Botón de Cancelar */}
                      <TouchableOpacity 
                          style={[styles.menuOption, styles.menuCancel]} 
                          onPress={() => setShowImageSourceOptions(false)}
                      >
                          <Text style={styles.menuCancelText}>Cancelar</Text>
                      </TouchableOpacity>

                  </View>
              </TouchableOpacity>
          </Modal>


          {/* RENDERIZAR EL CUSTOM ALERT */}
          <CustomAlert
              visible={alertConfig.visible}
              type={alertConfig.type}
              title={alertConfig.title}
              message={alertConfig.message}
              
              onCancel={handleCloseAlert}
              onConfirm={alertConfig.isConfirmation ? handleConfirmLogout : handleCloseAlert} 
              
              showCancel={alertConfig.isConfirmation}
              
              buttonText={alertConfig.isConfirmation ? "CERRAR SESIÓN" : "Aceptar"} 
          />
          </LinearGradient>
      </KeyboardAwareScrollView>
    );
}

// ==========================================================
// ESTILOS
// ==========================================================
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
    subtitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#64bae8",
      marginBottom: 10,
      marginTop: 20,
      textAlign: "center",
    },
    
    // --- ESTILOS DE FOTO DE PERFIL ---
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 5,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#e0e0e0',
      borderWidth: 3,
      borderColor: '#05f7c2',
    },
    // Estilos para el indicador de carga
    loadingOverlay: { 
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#64bae8',
        marginTop: 5,
        fontSize: 12,
        fontWeight: 'bold',
        position: 'absolute',
        bottom: 5,
    },
    avatarEditButton: {
      position: 'absolute',
      bottom: 0,
      right: "60%", 
      elevation: 5,
    },
    avatarEditButtonGradient: {
      width: 35,
      height: 35,
      borderRadius: 17.5,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    // --- FIN ESTILOS DE FOTO DE PERFIL ---
  
  
    // --- ESTILOS DE PERFIL Y BOTONES ---
    label: {
      fontSize: 14, 
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
      borderColor: "#ff6b6b", 
      borderWidth: 2,
    },
    input: {
      flex: 1,
      height: 40,
      fontSize: 14,
      color: "#333",
    },
    eyeButton: {
      padding: 5,
    },
    errorText: {
      color: "#ff6b6b",
      fontSize: 12,
      marginBottom: 8,
      marginTop: -3,
    },
    changePasswordButton: {
      alignSelf: 'flex-start',
      marginTop: 10,
      marginBottom: 5,
      paddingVertical: 5,
    },
    changePasswordButtonText: {
      color: "#64bae8",
      fontSize: 14,
      fontWeight: 'bold',
      textDecorationLine: 'underline',
    },
  
    // Botón Guardar Cambios 
    saveButton: {
      backgroundColor: "#05f7c2", 
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
  
    // Botón Cerrar Sesión
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
  
    // --- ESTILOS DE REQUISITOS Y COINCIDENCIA DE CONTRASEÑA ---
    passwordCard: {
      backgroundColor: "#f8f9fa",
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
      marginTop: -5,
      width: "100%",
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    passwordCardTitle: {
      fontWeight: "bold",
      fontSize: 14,
      marginBottom: 8,
      color: "#333",
    },
    passwordCheckRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    passwordCheckIcon: {
      marginRight: 8,
    },
    passwordCheckText: {
      color: "#888",
      fontSize: 13,
    },
    passwordCheckTextValid: {
      color: "#05f7c2",
      fontWeight: "bold",
    },
    passwordMatchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12, 
      marginTop: 5, 
      paddingHorizontal: 5, 
    },
    passwordMatchIcon: {
      marginRight: 8,
    },
    passwordMatchText: {
      fontSize: 13,
      fontWeight: 'bold',
    },
    
    // --- ESTILOS DEL MENÚ DE OPCIONES DE IMAGEN ---
    menuOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end", 
    },
    menuContainer: {
      backgroundColor: "#fff",
      width: "100%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 30,
      alignItems: 'center',
    },
    menuTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 15,
    },
    menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      paddingVertical: 15,
      paddingHorizontal: 10,
    },
    menuOptionText: {
      fontSize: 16,
      color: "#333",
    },
    menuDivider: {
      height: 1,
      backgroundColor: '#eee',
      width: '90%',
      marginVertical: 0,
    },
    menuCancel: {
      marginTop: 15,
      backgroundColor: '#f8f8f8',
      borderRadius: 10,
      justifyContent: 'center',
    },
    menuCancelText: {
      fontSize: 16,
      color: "#ff6b6b",
      fontWeight: 'bold',
    },
});
