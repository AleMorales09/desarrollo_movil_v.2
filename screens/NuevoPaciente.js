import React, { useState, useMemo, useEffect, useCallback } from 'react'; 
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    StatusBar, 
    Image, 
    Alert as RNAlert, 
    Platform, 
    Modal, 
    ActivityIndicator 
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient"; 
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Alert from '../components/Alert';
import { db } from '../src/config/firebaseConfig';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'; 
import { useRoute } from '@react-navigation/native'; 
import * as ImagePicker from 'expo-image-picker'; 

// ==========================================================
// CONFIGURACIÓN DE CLOUDINARY
// ==========================================================
const CLOUDINARY_CLOUD_NAME = 'dcambilud'; 
const CLOUDINARY_UPLOAD_PRESET = 'consultorio_foto';

export default function NuevoPaciente({ navigation }) {
  const route = useRoute(); 
  const patientData = route.params?.patientData || null; 
  const isViewMode = route.params?.isViewMode || false; 

  // --- ESTADOS DE DATOS ---
  const [id, setId] = useState(null); 
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  
  // --- ESTADOS DE ERROR ---
  const [dniError, setDniError] = useState(false); 
  const [telefonoError, setTelefonoError] = useState(false); 
  const [firstNameError, setFirstNameError] = useState(false); 
  const [lastNameError, setLastNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  
  // --- ESTADOS DE FOTO Y MODAL ---
  const [imageUri, setImageUri] = useState(null); 
  const [patientPhotoURL, setPatientPhotoURL] = useState(null); 
  const [uploading, setUploading] = useState(false); 
  const [showImageSourceOptions, setShowImageSourceOptions] = useState(false); 
  const [isImageLoading, setIsImageLoading] = useState(false); 

  // 💡 CLAVE: Estado para guardar los datos originales y de inicialización
  const [originalData, setOriginalData] = useState({}); 
  const [isProcessingInitialData, setIsProcessingInitialData] = useState(true); // <-- ESTADO INICIAL A TRUE

  // --- ESTADO DE ALERTA ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    isConfirmation: false, 
    }
  );

  useEffect(() => {
    // 💡 1. INICIAR PROCESAMIENTO
    setIsProcessingInitialData(true); 

    const dataToLoad = patientData || {};
    
    // Setear los estados
    setId(dataToLoad.id || null);
    setFirstName(dataToLoad.firstName || '');
    setLastName(dataToLoad.lastName || '');
    setEmail(dataToLoad.email || '');
    setDni(dataToLoad.dni || '');
    setTelefono(dataToLoad.telefono || '');
    setDireccion(dataToLoad.direccion || '');
    setPatientPhotoURL(dataToLoad.photoURL || null); 
    setImageUri(null); 

    // Guardar los datos originales
    setOriginalData({
        firstName: dataToLoad.firstName || '',
        lastName: dataToLoad.lastName || '',
        email: dataToLoad.email || '',
        dni: dataToLoad.dni || '',
        telefono: dataToLoad.telefono || '',
        direccion: dataToLoad.direccion || '',
        photoURL: dataToLoad.photoURL || null, 
    });
    
    // Configurar opciones de navegación
    if (isViewMode) {
      navigation.setOptions({ title: 'Detalles del Paciente' });
    } else {
      navigation.setOptions({ title: (dataToLoad.id ? 'Editar Paciente' : 'Nuevo Paciente') });
    }
    
    // 💡 2. FINALIZAR PROCESAMIENTO SÍNCRONICAMENTE
    // Esto resuelve el problema de parpadeo al asegurar que los datos estén en los estados antes del render.
    setIsProcessingInitialData(false); 
    
  }, [patientData, navigation, isViewMode]); 


  // 💡 FUNCIÓN CLAVE: Detección de cambios pendientes
  const hasUnsavedChanges = useMemo(() => {
    if (isViewMode) return false;

    // Si es un nuevo registro y hay datos en algún campo
    if (!id && (firstName || lastName || email || dni || telefono || direccion || imageUri)) {
        return true;
    }
    
    // Comparar campo por campo (solo si los datos originales existen)
    if (firstName !== originalData.firstName) return true;
    if (lastName !== originalData.lastName) return true;
    if (email !== originalData.email) return true;
    if (dni !== originalData.dni) return true;
    if (telefono !== originalData.telefono) return true;
    if (direccion !== originalData.direccion) return true;
    
    // Si se seleccionó una nueva imagen
    if (imageUri !== null) return true;

    return false;
  }, [firstName, lastName, email, dni, telefono, direccion, imageUri, originalData, isViewMode, id]);


  const handleAvatarPress = () => {
    if (isViewMode || uploading || isProcessingInitialData) return; 
    setShowImageSourceOptions(true);
  };
  
  const pickImage = async (source) => {
    setShowImageSourceOptions(false); 

    if (isViewMode || uploading || isProcessingInitialData) return;

    if (Platform.OS !== 'web') {
        let permissionResult;
        
        if (source === 'camera') {
            permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.status !== 'granted') {
                RNAlert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a la cámara.');
                return;
            }
        } else { // library
            permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.status !== 'granted') {
                RNAlert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a la galería de fotos.');
                return;
            }
        }
    }

    let result;
    if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
    } else { // library
        result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
    }

    if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setIsImageLoading(true); 
    }
  };


  const uploadImageToCloudinary = async (uri) => {
    setUploading(true);
    try {
        const formData = new FormData();
        formData.append('file', {
            uri: uri,
            type: 'image/jpeg',
            name: 'patient_photo_' + new Date().getTime() + '.jpg',
        });
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.secure_url) {
            return data.secure_url;
        } else {
            console.error("Cloudinary response error:", data);
            RNAlert.alert("Error de subida", "Cloudinary no devolvió una URL válida.");
            setUploading(false); 
            return null;
        }
    } catch (e) {
        setUploading(false);
        console.error("Error al subir a Cloudinary:", e);
        RNAlert.alert("Error de red", "No se pudo conectar con Cloudinary.");
        return null;
    }
  };
  
  // FUNCIÓN DE CONFIRMACIÓN DE DESCARTE
  const handleConfirmDiscard = () => {
    closeAlert();
    navigation.goBack();
  };

  // FUNCIÓN CLAVE: Muestra el alerta condicional al intentar salir
  const handleCancel = () => {
    
    // Si estamos editando/creando y hay cambios, pedimos confirmación
    if (!isViewMode && hasUnsavedChanges) {
        showAlert(
            "error", 
            "Confirmar Salida",
            "¿Estás seguro que deseas salir? Los cambios realizados se perderán.",
            true 
        );
        return;
    }

    // Si no hay cambios o estamos en modo vista, simplemente salimos
    navigation.goBack();
  };


  const showAlert = (type, title, message, isConfirmation = false) => {
    setAlertConfig({ visible: true, type, title, message, isConfirmation });
    if (type === "success") {
      setTimeout(() => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        navigation.goBack(); 
      }, 3000);
    }
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const validateName = (text) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    return nameRegex.test(text);
  };

  const handleDniChange = (text) => {
    if (!isViewMode && !isProcessingInitialData) {
      const filteredText = text.replace(/\D/g, ''); 
      setDni(filteredText);
      setDniError(false); 
    }
  };

  const handleTelefonoChange = (text) => { 
    if (!isViewMode && !isProcessingInitialData) {
      const filteredText = text.replace(/\D/g, '');
      setTelefono(filteredText);
      setTelefonoError(false); 
    }
  };
    
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleAddressChange = (text) => {
    if (!isViewMode && !isProcessingInitialData) {
      const addressRegex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\/-]/g;
      const filteredText = text.replace(addressRegex, '');
      setDireccion(filteredText); 
    }
  };


  const handleFirstNameBlur = () => {
    if (firstName && !validateName(firstName) && !isViewMode && !isProcessingInitialData) {
      setFirstNameError(true);
    } else {
      setFirstNameError(false);
    }
  };

  const handleLastNameBlur = () => {
    if (lastName && !validateName(lastName) && !isViewMode && !isProcessingInitialData) {
      setLastNameError(true);
    } else {
      setLastNameError(false);
    }
  };


  const handleEmailBlur = () => {
    if (email && !validateEmail(email) && !isViewMode && !isProcessingInitialData) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const handleFirstNameChange = (text) => {
    if (!isViewMode && !isProcessingInitialData) {
      const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
      setFirstName(filteredText);
      if (filteredText && !validateName(filteredText)) {
        setFirstNameError(true);
      } else {
        setFirstNameError(false);
      }
    }
  };

  const handleLastNameChange = (text) => {
    if (!isViewMode && !isProcessingInitialData) {
      const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
      setLastName(filteredText);
      if (filteredText && !validateName(filteredText)) {
        setLastNameError(true);
      } else {
        setLastNameError(false);
      }
    }
  };
    
  const handleNewPaciente = async () => {
    if (isViewMode || uploading || isProcessingInitialData) return; 

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // 1. Validaciones
    if (!trimmedFirstName || !trimmedLastName || !dni || !email || !telefono || !direccion) {
      showAlert("error", "Error", "Todos los campos son obligatorios.");
      return;
    }

    if (!validateName(trimmedFirstName) || trimmedFirstName.length < 2) { 
      setFirstNameError(true);
      showAlert("error", "Error", "El nombre es demasiado corto o contiene caracteres inválidos.");
      return;
    }

    if (!validateName(trimmedLastName) || trimmedLastName.length < 2) { 
      setLastNameError(true);
      showAlert("error", "Error", "El apellido es demasiado corto o contiene caracteres inválidos.");
      return;
    }

    if (!(dni.length === 7 || dni.length === 8)) {
      setDniError(true);
      showAlert("error", "DNI Inválido", "El DNI debe tener 7 u 8 dígitos.");
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError(true);
      showAlert("error", "Error", "El formato del correo electrónico no es válido.");
      return;
    }
    if (telefono.length < 7) {
      setTelefonoError(true);
      showAlert("error", "Teléfono Inválido", "El teléfono debe tener al menos 7 dígitos.");
      return;
    }
    
    // 2. Verificación de DNI duplicado
    try {
        const pacientesRef = collection(db, "pacientes");
        const q = query(pacientesRef, where("dni", "==", dni));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            let dniConflict = false;
            querySnapshot.forEach(doc => {
                if (doc.id !== id) {
                    dniConflict = true;
                }
            });
            
            if (dniConflict) {
                setDniError(true);
                showAlert("error", "DNI Duplicado", "Ya existe otro paciente registrado con este número de DNI.");
                return;
            }
        }
    } catch (error) {
        console.error("Error al verificar DNI:", error);
        showAlert("error", "Error de Base de Datos", "Ocurrió un error al verificar la existencia del DNI. Inténtalo de nuevo.");
        return;
    }

    // 3. Proceso de Subida de Imagen
    let finalPhotoURL = patientPhotoURL; 
    
    if (imageUri) {
        const uploadedURL = await uploadImageToCloudinary(imageUri);
        if (uploadedURL) {
            finalPhotoURL = uploadedURL;
            setIsImageLoading(true);
        } else {
            return; 
        }
    }

    // 4. Proceso de Guardado o Actualización
    try {
      const patientDataToSave = {
        firstName: trimmedFirstName, 
        lastName: trimmedLastName, 
        dni: dni,
        email: email,
        telefono: telefono,
        direccion: direccion,
        photoURL: finalPhotoURL, 
      };

      if (id) {
        const patientRef = doc(db, "pacientes", id);
        await updateDoc(patientRef, patientDataToSave);

        showAlert("success", "Paciente Actualizado", "El paciente ha sido actualizado correctamente.");
      } else {
        const newPatient = {
            ...patientDataToSave,
            fechaCreacion: new Date(),
        };
        await addDoc(collection(db, "pacientes"), newPatient);

        showAlert("success", "Paciente Registrado", "El paciente ha sido guardado correctamente.");
      }
      
      // 💡 CORRECCIÓN CLAVE: No limpiamos los estados para evitar el parpadeo.
      setIsImageLoading(false); 
      setUploading(false); 

    } catch (error) {
      console.error("Error al guardar/actualizar el paciente:", error);
      showAlert("error", "Error al Guardar", "No se pudo guardar/actualizar el paciente. Inténtalo de nuevo.");
    }
  };

  const titleText = isViewMode ? "Detalles del paciente" : (id ? "Editar paciente" : "Registrar nuevo paciente");
  const buttonText = id ? "ACTUALIZAR" : "GUARDAR"; 
  
  const inputGroupStyle = (error) => ([
      styles.inputGroup, 
      error && styles.inputGroupError,
      isViewMode && styles.readOnlyInputGroup,
  ]);
  
  const displayImageUri = imageUri || patientPhotoURL;

  return (
    <>
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={50}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.root}>
          <LinearGradient
            colors={["#FFFFFF", "#9FE2CF"]}
            style={styles.gradient}
          >
            <View style={styles.card}>
              
              {/* 💡 OVERLAY DE CARGA QUE APARECE SOBRE EL FORMULARIO (para edición/vista) */}
              {isProcessingInitialData && (
                  <View style={styles.fullOverlay}>
                      <ActivityIndicator size="large" color="#3b82f6" />
                      <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>
                          Cargando datos...
                      </Text>
                  </View>
              )}
              
              {/* Botón Cerrar (X) - Usa handleCancel */}
              <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={handleCancel} 
                  // Deshabilitar si está procesando la carga inicial
                  disabled={uploading || isImageLoading || isProcessingInitialData} 
              >
                  <Ionicons name="close-circle" size={35} color="#ff6b6b" /> 
              </TouchableOpacity>

              <Text style={styles.title}>{titleText}</Text>
              
              {/* CONTENEDOR PRINCIPAL DE LA FOTO */}
              <View style={styles.photoWrapper}> 
                  
                  {/* Área de la foto */}
                  <TouchableOpacity 
                      style={styles.photoContainer} 
                      onPress={handleAvatarPress} 
                      disabled={isViewMode || uploading || isImageLoading} 
                  >
                      {displayImageUri ? (
                          <Image 
                              source={{ uri: displayImageUri }} 
                              style={[
                                styles.profileImage, 
                                isImageLoading ? { opacity: 0 } : { opacity: 1 }
                              ]}
                              onLoad={() => {
                                  setIsImageLoading(false);
                                  setUploading(false);      
                              }}
                              onError={() => {
                                  setIsImageLoading(false); 
                                  setUploading(false);
                                  setPatientPhotoURL(null); 
                                  setImageUri(null);
                                  RNAlert.alert("Error de Carga", "No se pudo cargar la imagen. Inténtalo de nuevo.");
                              }}
                          />
                      ) : (
                          <View style={styles.photoPlaceholder}>
                              <Ionicons name="person-outline" size={50} color="#ccc" />
                              <Text style={styles.photoText}>
                                  {"Añadir foto"}
                              </Text>
                          </View>
                      )}

                      {/* Indicador de Carga */}
                      {(uploading || isImageLoading) && ( 
                          <View style={styles.uploadingOverlay}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.uploadingText}>
                                {uploading ? "Subiendo..." : "Cargando..."}
                            </Text>
                          </View>
                      )}
                  </TouchableOpacity>
                  
                  {/* BOTÓN DE CÁMARA - Se oculta en modo vista */}
                  {!isViewMode && (
                      <TouchableOpacity
                          style={styles.avatarEditButton}
                          onPress={handleAvatarPress} 
                          disabled={uploading || isImageLoading}
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
                  )}

              </View>


              <Text style={styles.label}>Nombre</Text>
              <View style={inputGroupStyle(firstNameError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el nombre"
                  value={firstName}
                  onChangeText={handleFirstNameChange}
                  onBlur={handleFirstNameBlur}
                  placeholderTextColor="#888"
                  maxLength={30}
                  editable={!isViewMode}
                />
              </View>
              {firstNameError && !isViewMode && (
                <Text style={styles.errorText}>El nombre es demasiado corto</Text>
              )}

              <Text style={styles.label}>Apellido</Text>
              <View style={inputGroupStyle(lastNameError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el apellido"
                  value={lastName}
                  onChangeText={handleLastNameChange}
                  onBlur={handleLastNameBlur}
                  placeholderTextColor="#888"
                  maxLength={30}
                  editable={!isViewMode}
                />
              </View>
              {lastNameError && !isViewMode && (
                <Text style={styles.errorText}>El apellido es demasiado corto</Text>
              )}

              <Text style={styles.label}>DNI</Text>
              <View style={inputGroupStyle(dniError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el DNI"
                  value={dni}
                  onChangeText={handleDniChange}
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={8}
                  editable={!id && !isViewMode}
                />
              </View>

              <Text style={styles.label}>Correo</Text>
              <View style={inputGroupStyle(emailError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su correo"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                  maxLength={50}
                  editable={!isViewMode}
                />
              </View>
              {emailError && !isViewMode && (
                <Text style={styles.errorText}>Formato de correo inválido (ej: usuario@dominio.com)</Text>
              )}

              <Text style={styles.label}>Teléfono</Text>
              <View style={inputGroupStyle(telefonoError)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el teléfono"
                  value={telefono}
                  onChangeText={handleTelefonoChange}
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={15}
                  editable={!isViewMode}
                />
              </View>
    

              <Text style={styles.label}>Dirección</Text>
              <View style={inputGroupStyle(false)}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese la dirección"
                  value={direccion}
                  onChangeText={handleAddressChange}
                  placeholderTextColor="#888"
                  maxLength={30}
                  editable={!isViewMode}
                />
              </View>
              
              {/* Muestra botones solo en modo edición/registro */}
              {!isViewMode && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={uploading || isImageLoading}>
                        <Text style={styles.buttonText}>CANCELAR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, (uploading || isImageLoading) && styles.buttonDisabled]} 
                        onPress={handleNewPaciente}
                        disabled={uploading || isImageLoading}
                    >
                        <Text style={styles.buttonText}>{uploading ? "SUBIENDO FOTO..." : buttonText}</Text>
                    </TouchableOpacity>
                </View>
              )}

            </View>
          </LinearGradient>
        </View>
      </KeyboardAwareScrollView>
      
      {/* MODAL DE SELECCIÓN DE IMAGEN */}
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
                  <TouchableOpacity style={styles.menuOption} onPress={() => pickImage('camera')} >
                      <FontAwesome name="camera" size={20} color="#64bae8" style={{marginRight: 10}}/>
                      <Text style={styles.menuOptionText}>Usar Cámara</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity style={styles.menuOption} onPress={() => pickImage('library')} >
                      <FontAwesome name="image" size={20} color="#64bae8" style={{marginRight: 10}}/>
                      <Text style={styles.menuOptionText}>Elegir de Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.menuOption, styles.menuCancel]} onPress={() => setShowImageSourceOptions(false)} >
                      <Text style={styles.menuCancelText}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

      {/* Alerta de Confirmación de Salida */}
      <Alert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.isConfirmation ? handleConfirmDiscard : closeAlert} 
        onClose={closeAlert} 
        showCancel={alertConfig.isConfirmation} 
        buttonText={alertConfig.isConfirmation ? "PERDER CAMBIOS" : "Aceptar"}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradient: {
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
    position: 'relative', 
  },
  // 💡 ESTILO CLAVE para el overlay
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    zIndex: 20, 
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
    textAlign: "center",
  },
  photoWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative', 
    width: 120, 
    height: 120, 
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#05f7c2',
    overflow: 'hidden',
    position: 'relative',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    position: 'absolute', 
    top: 0,
    left: 0,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, 
  },
  uploadingText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 2, 
    right: 2, 
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
  
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    marginTop: 5,
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
  readOnlyInputGroup: {
    backgroundColor: '#f0f0f0', 
    borderColor: '#ccc',
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -3,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 14,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    width: '100%',
  },
  button: {
    backgroundColor: "#05f7c2", 
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    width: '48%', 
    marginTop: 0, 
    alignSelf: "auto", 
  },
  buttonDisabled: { 
    backgroundColor: '#ccc',
  },
  cancelButton: {
    backgroundColor: "#ff6b6b", 
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    width: '48%',
  },
  buttonContainerOnlyOne: { 
    marginTop: 25,
    alignItems: 'center',
    width: '100%',
  },
  buttonBack: { 
    backgroundColor: '#05f7c2', 
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    width: '80%', 
  },
  buttonText: {
    color: "#fff", 
    fontSize: 16,
    fontWeight: "bold",
  },
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuOptionText: {
    fontSize: 16,
    color: '#333',
  },
  menuDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  menuCancel: {
    marginTop: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
});