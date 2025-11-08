import React, { useState, useMemo, useEffect, useCallback } from "react"; 
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    Image, 
    ActivityIndicator, 
    Modal, 
    // Alert, ya no es necesario importarlo si usas CustomAlert
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
    AuthErrorCodes,
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
const CLOUDINARY_CLOUD_NAME = 'dcambilud'; 
const CLOUDINARY_UPLOAD_PRESET = 'consultorio_foto'; 
const CLOUDINARY_API_KEY = '452396411417448';
const DEFAULT_AVATAR = 'https://res.cloudinary.com/demo/image/upload/v1607552554/avatar_placeholder.png';

// ==========================================================
// FUNCIONES AUXILIARES
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

const cleanAndBuildDisplayName = (firstName, lastName) => {
    const rawDisplayName = `${firstName.trim()} ${lastName.trim()}`;
    return rawDisplayName.replace(/\s+/g, ' ').trim();
};

const cleanAddress = (text) => {
    return text.replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s,.-]/g, ''); 
};

const cleanPhone = (text) => {
    return text.replace(/\D/g, ''); 
};

const validateName = (text) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    return nameRegex.test(text);
};

const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
};


// ==========================================================
// COMPONENTES MODULARES
// ==========================================================

// Auxiliar: Validación de Contraseña
const PasswordRequirementCheck = React.memo(({ meets, text }) => (
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
));

// Auxiliar: Coincidencia de Contraseña
const PasswordMatchInfo = React.memo(({ meets }) => (
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
));


// Componente de botón de acción modular
const ActionButton = React.memo(({ isEditing, onEdit, onCancel, onSave, saveText, disabled, icon, text }) => {
    const primaryColor = "#64bae8"; 
    const cancelColor = "#ff6b6b"; 
    const saveColor = "#05f7c2";

    // Si NO está editando, solo muestra el botón de EDITAR (modo compacto)
    if (!isEditing) {
        return (
            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: primaryColor, width: '100%', marginTop: 15 }]}
                onPress={onEdit}
                disabled={disabled}
            >
                <FontAwesome 
                    name={icon} 
                    size={18} 
                    color={"#fff"} 
                    style={{ marginRight: 8 }}
                />
                <Text style={styles.actionButtonText}>
                    {text}
                </Text>
            </TouchableOpacity>
        );
    }

    // Si SÍ está editando, muestra los botones de GUARDAR y CANCELAR
    return (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: saveColor, width: '48%', marginTop: 0 }]} 
                onPress={onSave}
                disabled={disabled}
            >
                <Text style={[styles.saveButtonText, { color: '#000' }]}>{saveText}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: cancelColor, width: '48%', marginTop: 0 }]}
                onPress={onCancel}
                disabled={disabled}
            >
                <FontAwesome 
                    name={"times"} 
                    size={18} 
                    color={"#fff"} 
                    style={{ marginRight: 8 }}
                />
                <Text style={styles.actionButtonText}>
                    CANCELAR
                </Text>
            </TouchableOpacity>
        </View>
    );
});


// Tarjeta 1: Perfil Básico (Nombre, Apellido, Foto)
const PerfilCard = React.memo((props) => {
    const { 
        firstName, setFirstName, firstNameError, 
        lastName, setLastName, lastNameError, 
        isEditingProfile, setIsEditingProfile, isLoadingImage,
        isEditingContact, isChangingPassword,
        profileImage, DEFAULT_AVATAR, handleAvatarPress,
        handleFirstNameChange, handleLastNameChange,
        showAlert, handleUpdateProfile, handleCancelEdit,
    } = props;

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Nombre, apellido y foto</Text>
            
            {/* UI FOTO DE PERFIL (Se mantiene visible) */}
            <View style={styles.avatarContainer}>
                {isLoadingImage ? (
                    <View style={[styles.avatar, styles.loadingOverlay]}>
                        <ActivityIndicator size="large" color="#64bae8" />
                        <Text style={styles.loadingText}>Subiendo...</Text>
                    </View>
                ) : (
                    <Image
                        source={{ uri: profileImage || DEFAULT_AVATAR }}
                        style={styles.avatar}
                    />
                )}
                
                <TouchableOpacity
                    style={styles.avatarEditButton}
                    onPress={handleAvatarPress} 
                    disabled={isLoadingImage || isEditingProfile || isEditingContact || isChangingPassword}
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
            
            {/* INICIO CONTENIDO CONDICIONAL: Solo visible al editar */}
            {isEditingProfile && (
                <>
                    {/* NOMBRE */}
                    <Text style={styles.label}>Nombre(s)</Text>
                    <View style={[styles.inputGroup, firstNameError && styles.inputGroupError]}>
                        <TextInput
                        key={'profile-name-edit'}
                        style={styles.input}
                        value={firstName}
                        onChangeText={handleFirstNameChange}
                        editable={isEditingProfile}
                        placeholder="Ingrese su nombre"
                        placeholderTextColor="#888"
                        maxLength={30}
                        />
                    </View>
                    {firstNameError && (
                        <Text style={styles.errorText}>El nombre solo debe contener letras</Text>
                    )}
                    
                    {/* APELLIDO */}
                    <Text style={styles.label}>Apellido(s)</Text>
                    <View style={[styles.inputGroup, lastNameError && styles.inputGroupError]}>
                        <TextInput
                        key={'profile-last-edit'}
                        style={styles.input}
                        value={lastName}
                        onChangeText={handleLastNameChange}
                        editable={isEditingProfile}
                        placeholder="Ingrese su apellido"
                        placeholderTextColor="#888"
                        maxLength={30}
                        />
                    </View>
                    {lastNameError && (
                        <Text style={styles.errorText}>El apellido solo debe contener letras</Text>
                    )}
                </>
            )}
            {/* FIN CONTENIDO CONDICIONAL */}

            {/* BOTÓN EDITAR/GUARDAR/CANCELAR */}
            <ActionButton 
                isEditing={isEditingProfile}
                onEdit={() => {
                    if(isEditingContact || isChangingPassword) {
                        showAlert("info", "Edición en Curso", "Termina o cancela la edición en otra sección primero.");
                        return;
                    }
                    setIsEditingProfile(true);
                }}
                onCancel={() => handleCancelEdit('profile')}
                onSave={handleUpdateProfile}
                saveText="GUARDAR"
                disabled={isLoadingImage || isEditingContact || isChangingPassword}
                icon="pencil"
                text="EDITAR"
            />

        </View>
    );
});


// Tarjeta 2: Información de Contacto (Email, Dirección, Teléfono)
const ContactoCard = React.memo((props) => {
    const {
        email, handleEmailChange, emailError,
        address, setAddress, 
        phone, setPhone,
        isEditingContact, setIsEditingContact,
        isEditingProfile, isChangingPassword,
        showAlert, handleUpdateContact, handleCancelEdit,
    } = props;
    
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Información de Contacto</Text>
            
            {/* INICIO CONTENIDO CONDICIONAL: Solo visible al editar */}
            {isEditingContact && (
                <>
                    {/* CORREO */}
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <View style={[styles.inputGroup, emailError && styles.inputGroupError]}>
                        <TextInput
                        key={'contact-email-edit'}
                        style={styles.input}
                        value={email}
                        onChangeText={handleEmailChange}
                        editable={isEditingContact}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Correo"
                        placeholderTextColor="#888"
                        maxLength={50}
                        />
                    </View>
                    {emailError && (
                        <Text style={styles.errorText}>Formato de correo inválido</Text>
                    )}
                    
                    {/* DIRECCIÓN */}
                    <Text style={styles.label}>Dirección</Text>
                    <View style={styles.inputGroup}>
                        <TextInput
                            key={'contact-address-edit'}
                            style={styles.input}
                            placeholder="Calle, número, ciudad, etc."
                            placeholderTextColor="#888"
                            value={address}
                            onChangeText={text => setAddress(cleanAddress(text))}
                            editable={isEditingContact}
                            maxLength={50}
                        />
                    </View>

                    {/* TELÉFONO */}
                    <Text style={styles.label}>Teléfono</Text>
                    <View style={styles.inputGroup}>
                        <TextInput
                            key={'contact-phone-edit'}
                            style={styles.input}
                            placeholder="Número de teléfono"
                            placeholderTextColor="#888"
                            value={phone}
                            keyboardType="numeric" 
                            onChangeText={text => setPhone(cleanPhone(text))}
                            editable={isEditingContact}
                            maxLength={15}
                        />
                    </View>
                </>
            )}
            {/* FIN CONTENIDO CONDICIONAL (No se muestra nada en modo vista) */}

            {/* BOTÓN EDITAR/GUARDAR/CANCELAR */}
            <ActionButton 
                isEditing={isEditingContact}
                onEdit={() => {
                    if(isEditingProfile || isChangingPassword) {
                        showAlert("info", "Edición en Curso", "Termina o cancela la edición en otra sección primero.");
                        return;
                    }
                    setIsEditingContact(true);
                }}
                onCancel={() => handleCancelEdit('contact')}
                onSave={handleUpdateContact}
                saveText="GUARDAR"
                disabled={isEditingProfile || isChangingPassword}
                icon="envelope"
                text="EDITAR"
            />
        </View>
    );
});


// Tarjeta 3: Cambio de Contraseña (SIN MEMOIZAR para forzar re-renderización del error)
const PasswordCard = (props) => { 
    const {
        isChangingPassword, setIsChangingPassword, isEditingProfile, isEditingContact,
        currentPassword, setCurrentPassword, currentPasswordError, setCurrentPasswordError,
        newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword,
        showCurrentPassword, setShowCurrentPassword, showNewPassword, setShowNewPassword, showConfirmNewPassword, setShowConfirmNewPassword,
        showPasswordInfo, setShowPasswordInfo, showPasswordMatchInfo, setShowPasswordMatchInfo,
        passwordChecks, passwordsMatch,
        showAlert, handleChangePassword, handleCancelEdit,
    } = props;

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Seguridad</Text>

            {/* VISTA DE SOLO LECTURA */}
            {!isChangingPassword ? (
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: "#64bae8", width: '100%', marginTop: 10 }]}
                    onPress={() => {
                        if(isEditingProfile || isEditingContact) {
                            showAlert("info", "Edición en Curso", "Termina o cancela la edición en otra sección primero.");
                            return;
                        }
                        // Limpiamos el error al entrar a cambiar contraseña
                        setCurrentPasswordError(false); 
                        setIsChangingPassword(true);
                    }}
                    disabled={isEditingProfile || isEditingContact}
                >
                    <FontAwesome 
                        name="lock" 
                        size={18} 
                        color={"#fff"} 
                        style={{ marginRight: 8 }}
                    />
                    <Text style={styles.actionButtonText}>
                        CAMBIAR CONTRASEÑA
                    </Text>
                </TouchableOpacity>
            ) : (
                // CONTENIDO DE EDICIÓN DE CONTRASEÑA (Siempre condicionalmente mostrado por isChangingPassword)
                <>
                    {/* CONTRASEÑA ACTUAL */}
                    <Text style={styles.label}>Contraseña Actual</Text>
                    <View style={[styles.inputGroup, currentPasswordError && styles.inputGroupError]}>
                        <TextInput
                            key={'password-current-edit'}
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
                            key={'password-new-edit'}
                            style={styles.input}
                            placeholder="Nueva Contraseña"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            onFocus={() => setShowPasswordInfo(true)}
                            onBlur={() => setShowPasswordInfo(false)}
                            placeholderTextColor="#888"
                            maxLength={12}
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
                            key={'password-confirm-edit'}
                            style={styles.input}
                            placeholder="Confirme la nueva contraseña"
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                            secureTextEntry={!showConfirmNewPassword}
                            onFocus={() => setShowPasswordMatchInfo(true)}
                            onBlur={() => setShowPasswordMatchInfo(false)}
                            placeholderTextColor="#888"
                            maxLength={12}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)} style={styles.eyeButton}>
                            <FontAwesome name={showConfirmNewPassword ? "eye-slash" : "eye"} size={18} color="#555" />
                        </TouchableOpacity>
                    </View>
                    
                    {showPasswordMatchInfo && (confirmNewPassword.length > 0) && (
                        <PasswordMatchInfo meets={passwordsMatch} /> 
                    )}
                    
                    {/* BOTONES DE GUARDAR/CANCELAR CONTRASEÑA */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.saveButton, { backgroundColor: '#05f7c2', width: '48%', marginTop: 15 }]} 
                            onPress={handleChangePassword}
                        >
                            <Text style={[styles.saveButtonText, {color: '#000'}]}>GUARDAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: "#ff6b6b", width: '48%', marginTop: 15 }]}
                            onPress={() => handleCancelEdit('password')}
                        >
                            <FontAwesome 
                                name="times" 
                                size={18} 
                                color={"#fff"} 
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.actionButtonText}>
                                CANCELAR
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
};


// ==========================================================
// PANTALLA PRINCIPAL DE PERFIL CON EDICIÓN
// ==========================================================
export default function Perfil({ navigation }) {
    
    const user = auth.currentUser;
  
    // 1. ESTADOS
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Estados de datos
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [profileImage, setProfileImage] = useState(user?.photoURL || null); 
    const [address, setAddress] = useState(''); 
    const [phone, setPhone] = useState(''); 
    
    // Estado para la carga de la imagen
    const [isLoadingImage, setIsLoadingImage] = useState(false); 
    
    // Estado para guardar los datos originales (para cancelación)
    const [originalData, setOriginalData] = useState({ 
        firstName: '', 
        lastName: '', 
        email: user?.email || '', 
        photoURL: user?.photoURL || null,
        address: '', 
        phone: '', 
    });
    
    // ESTADOS DE EDICIÓN MODULAR
    const [isEditingProfile, setIsEditingProfile] = useState(false); 
    const [isEditingContact, setIsEditingContact] = useState(false); 
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
    
    // 2. EFECTOS (CARGA INICIAL DE DATOS)
    const fetchUserData = useCallback(async () => {
        if (!user) {
            setIsDataLoaded(true); 
            return;
        }

        let loadedFirstName, loadedLastName, loadedEmail, loadedPhotoURL, loadedAddress, loadedPhone;

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                loadedFirstName = data.firstName || '';
                loadedLastName = data.lastName || '';
                loadedEmail = data.email || user.email; 
                loadedAddress = data.address || '';
                loadedPhone = data.phone ? cleanPhone(data.phone) : ''; 
                
            } else {
                const [authFirstName, authLastName] = parseDisplayName(user.displayName);
                loadedFirstName = authFirstName;
                loadedLastName = authLastName;
                loadedEmail = user.email;
                loadedAddress = '';
                loadedPhone = '';

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

            setFirstName(loadedFirstName);
            setLastName(loadedLastName);
            setEmail(loadedEmail);
            setProfileImage(loadedPhotoURL); 
            setAddress(loadedAddress);
            setPhone(loadedPhone);

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
    }, [user]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]); 
    
    // 3. MEMORIZACIÓN (VALIDACIÓN DE CONTRASEÑA)
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

    // 4. FUNCIONES DE MANEJO Y AUXILIARES (USANDO useCALLBACK)

    const showAlert = useCallback((type, title, message, isConfirmation = false) => {
        setAlertConfig({ visible: true, type, title, message, isConfirmation });
    }, []);

    const handleCloseAlert = useCallback(() => {
        setAlertConfig({ ...alertConfig, visible: false });
    }, [alertConfig]);
    
    const handleAvatarPress = useCallback(() => {
        if(isEditingProfile || isEditingContact || isChangingPassword) {
            showAlert("info", "Edición en Curso", "Termina o cancela la edición en curso antes de cambiar la foto.");
            return;
        }
        setShowImageSourceOptions(true);
    }, [isEditingProfile, isEditingContact, isChangingPassword, showAlert]);

    const uploadImageToCloudinary = async (uri) => {
        const data = new FormData();
        data.append('file', { 
            uri, 
            name: `profile_${user.uid}_${Date.now()}.jpg`, 
            type: 'image/jpeg' 
        });
        data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        data.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        return result.secure_url;
    };

    const uploadImage = useCallback(async (uri) => {
        if (!user) {
            showAlert("error", "Error", "No hay usuario autenticado.");
            return;
        }

        setIsLoadingImage(true); 

        try {
            const cloudinaryUrl = await uploadImageToCloudinary(uri);
            
            if (cloudinaryUrl) {
                await updateProfile(user, { photoURL: cloudinaryUrl });
                
                setProfileImage(cloudinaryUrl);
                setOriginalData(prev => ({ ...prev, photoURL: cloudinaryUrl }));
                
                showAlert("success", "Éxito", "Foto de perfil actualizada correctamente.");
            } else {
                showAlert("error", "Error de Carga", "No se pudo obtener la URL de Cloudinary.");
            }
        } catch (error) {
            console.error("Error al subir imagen:", error);
            
            const userError = error.message.includes("Cloudinary upload failed") 
                ? "Fallo en la subida a Cloudinary. Revisa tu PRESET y Cloud Name en el código." 
                : "Fallo al subir la imagen de perfil. Inténtalo de nuevo.";
            
            showAlert("error", "Error", userError);
        } finally {
            setIsLoadingImage(false); 
        }
    }, [user, showAlert]);

    const pickImage = useCallback(async (source) => {
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
    }, [showAlert, uploadImage]);


    const handleFirstNameChange = useCallback((text) => {
        const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
        setFirstName(filteredText);
        setFirstNameError(filteredText.length > 0 && !validateName(filteredText));
    }, []); 

    const handleLastNameChange = useCallback((text) => {
        const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
        setLastName(filteredText);
        setLastNameError(filteredText.length > 0 && !validateName(filteredText));
    }, []);
    
    const handleEmailChange = useCallback((text) => {
        setEmail(text);
        setEmailError(text.length > 0 && !validateEmail(text));
    }, []);


    const handleUpdateProfile = useCallback(async () => {
        if (!user) return showAlert("error", "Error", "No hay usuario autenticado.");
        
        let hasError = false;

        if (!firstName.trim() || !lastName.trim()) {
            showAlert("error", "Error", "El nombre y apellido son obligatorios.");
            hasError = true;
        }
        if (firstNameError || lastNameError) {
            showAlert("error", "Error", "El nombre o apellido contienen caracteres no válidos.");
            hasError = true;
        }
        
        if (firstName.length < 2 || lastName.length < 2) {
            showAlert("error", "Error", "El nombre o apellido son demasiado cortos");
            hasError = true;
        }

        if (hasError) return;

        try {
            const trimmedFirstName = firstName.trim();
            const trimmedLastName = lastName.trim();
            const newDisplayName = cleanAndBuildDisplayName(trimmedFirstName, trimmedLastName); 

            let authProfileUpdated = false;
            let firestoreUpdated = false;
            
            if (user.displayName !== newDisplayName) {
                await updateProfile(user, { displayName: newDisplayName });
                authProfileUpdated = true;
            }

            const userDocRef = doc(db, "users", user.uid);
            
            if (originalData.firstName !== trimmedFirstName || 
                originalData.lastName !== trimmedLastName
            ) {
                await updateDoc(userDocRef, {
                    firstName: trimmedFirstName,
                    lastName: trimmedLastName,
                }, { merge: true });
                firestoreUpdated = true;
            }
            
            const profileUpdated = authProfileUpdated || firestoreUpdated;
            
            if (profileUpdated) {
                setOriginalData(prev => ({ 
                    ...prev, 
                    firstName: trimmedFirstName, 
                    lastName: trimmedLastName, 
                }));
                showAlert("success", "Éxito", "Perfil actualizado correctamente.");
            } else {
                showAlert("info", "Información", "No se detectaron cambios para guardar.");
            }
            
            setIsEditingProfile(false); 

        } catch (error) {
            console.error("Firebase update error (Profile):", error);
            showAlert("error", "Error", "Hubo un problema al actualizar el perfil.");
        }
    }, [user, firstName, lastName, firstNameError, lastNameError, originalData.firstName, originalData.lastName, showAlert]);

    const handleUpdateContact = useCallback(async () => {
        if (!user) return showAlert("error", "Error", "No hay usuario autenticado.");
        
        let hasError = false;
        
        const trimmedAddress = cleanAddress(address);
        const trimmedPhone = cleanPhone(phone);
        
        if (!validateEmail(email)) {
            setEmailError(true);
            showAlert("error", "Error", "El formato del correo electrónico no es válido.");
            hasError = true;
        } else {
            setEmailError(false);
        }
        
        if (hasError) return;

        try {
            let emailUpdated = false;
            let firestoreUpdated = false;
            
            if (user.email !== email) {
                await updateEmail(user, email); 
                emailUpdated = true;
            }

            const userDocRef = doc(db, "users", user.uid);
            
            if (originalData.email !== email ||
                originalData.address !== trimmedAddress ||
                originalData.phone !== trimmedPhone 
            ) {
                await updateDoc(userDocRef, {
                    email: email,
                    address: trimmedAddress,
                    phone: trimmedPhone,
                }, { merge: true });
                firestoreUpdated = true;
            }
            
            const contactUpdated = emailUpdated || firestoreUpdated;
            
            if (contactUpdated) {
                setOriginalData(prev => ({ 
                    ...prev, 
                    email: email,
                    address: trimmedAddress,
                    phone: trimmedPhone,
                }));
                
                setAddress(trimmedAddress);
                setPhone(trimmedPhone);
                
                showAlert("success", "Éxito", "Datos de contacto actualizados correctamente.");
            } else {
                showAlert("info", "Información", "No se detectaron cambios de contacto para guardar.");
            }
            
            setIsEditingContact(false); 

        } catch (error) {
            let errorMessage = "Hubo un problema al actualizar el contacto.";
            switch (error.code) {
                case AuthErrorCodes.REQUIRES_RECENT_LOGIN:
                    errorMessage = "Esta acción (cambio de email) requiere que inicies sesión nuevamente para verificar tu identidad.";
                    break;
                case AuthErrorCodes.EMAIL_ALREADY_IN_USE:
                    errorMessage = "El nuevo correo electrónico ya está en uso por otra cuenta.";
                    break;
                case AuthErrorCodes.INVALID_EMAIL:
                    errorMessage = "El nuevo formato de correo electrónico no es válido.";
                    break;
                default:
                    console.error("Firebase contact update error:", error);
                    errorMessage = error.message || errorMessage;
                    break;
            }
            showAlert("error", "Error", errorMessage);
        }
    }, [user, email, address, phone, originalData.email, originalData.address, originalData.phone, showAlert]);


    const handleCancelEdit = useCallback((cardType) => {
        if (cardType === 'profile') {
            setFirstName(originalData.firstName);
            setLastName(originalData.lastName);
            setFirstNameError(false);
            setLastNameError(false);
            setIsEditingProfile(false);
        } else if (cardType === 'contact') {
            setEmail(originalData.email);
            setAddress(originalData.address);
            setPhone(originalData.phone);
            setEmailError(false);
            setIsEditingContact(false);
        } else if (cardType === 'password') {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setCurrentPasswordError(false);
            setIsChangingPassword(false);
        }
    }, [originalData]);
  
    const handleConfirmLogout = useCallback(async () => {
        handleCloseAlert();
        try {
            await auth.signOut();
            navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }]})
        } catch (error) {
            showAlert("error", "Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.", false);
        }
    }, [handleCloseAlert, showAlert]);

    const handleLogout = useCallback(() => {
        if(isEditingProfile || isEditingContact || isChangingPassword) {
            showAlert("info", "Edición en Curso", "Termina o cancela la edición en curso antes de cerrar sesión.");
            return;
        }

        showAlert(
            "error", 
            "Cerrar Sesión", 
            "¿Estás seguro de que deseas cerrar tu sesión actual?",
            true 
        );
    }, [isEditingProfile, isEditingContact, isChangingPassword, showAlert]);

    /**
     * @description Maneja la actualización de la Tarjeta 3 (Contraseña) - Lógica de error robusta
     */
    const handleChangePassword = useCallback(async () => {
        if (!user) return showAlert("error", "Error", "No hay usuario autenticado.");
        
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
        
        // 1. Reset error state BEFORE any async operation 
        setCurrentPasswordError(false); 

        try {
            // PASO 1: Re-autenticación
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            
        } catch (error) {
            // Manejo del error
            
            // 1. ERROR DE CONTRASEÑA INCORRECTA (CORREGIDO: usa la cadena 'auth/wrong-password')
            if (error.code === 'auth/wrong-password') {
                
                setCurrentPasswordError(true); 
                showAlert("error", "Error", "La contraseña actual es incorrecta.");
                return; 
            } 
            
            // 2. ERROR DE DEMASIADOS INTENTOS (CORREGIDO: usa la cadena 'auth/too-many-requests')
            else if (error.code === 'auth/too-many-requests') { 
                
                setCurrentPasswordError(true); 
                showAlert("error", "Alerta de Seguridad", "Demasiados intentos fallidos. Por favor, espera unos minutos antes de volver a intentar.");
                return; 
            }
            
            // 3. OTROS ERRORES
            else {
                console.error("Re-authentication error:", error);
                showAlert("error", "Error", "Falló la re-autenticación por un motivo desconocido. Inténtalo de nuevo.");
                return; 
            }
        }
        
        // Si llegamos aquí, la re-autenticación fue exitosa
        try {
            // PASO 2: Actualizar contraseña
            await updatePassword(user, newPassword);
            
            // Limpieza y éxito
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setIsChangingPassword(false);
            
            showAlert("success", "Éxito", "¡Contraseña actualizada correctamente!");
            
        } catch (error) {
            let errorMessage = "Hubo un problema al actualizar la contraseña.";
            if (error.code === 'auth/weak-password') { // CORREGIDO: usa la cadena 'auth/weak-password'
                errorMessage = "La nueva contraseña es demasiado débil.";
            }
            console.error("Update password error:", error);
            showAlert("error", "Error", errorMessage);
        }
    }, [user, currentPassword, newPassword, confirmNewPassword, isPasswordValid, showAlert, setIsChangingPassword, setNewPassword, setConfirmNewPassword, setCurrentPassword, setCurrentPasswordError]);

    // 5. RENDERIZADO CONDICIONAL DE CARGA
    if (!isDataLoaded) {
        return (
            <LinearGradient colors={["#FFFFFF", "#9FE2CF"]} style={styles.container}>
                <ActivityIndicator size="large" color="#64bae8" />
                <Text style={{marginTop: 10, fontSize: 16, color: '#333'}}>Cargando perfil...</Text>
            </LinearGradient>
        );
    }
    
    // 6. RENDERIZADO FINAL
    return (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid={true} 
          extraScrollHeight={50} 
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled" 
        >
          <LinearGradient colors={["#FFFFFF", "#67c4aaff"]} 
          style={styles.gradientBackground}>
              <Text style={styles.mainTitle}>Mi Perfil</Text>
              
              <View style={styles.cardContainer}>
                  {/* TARJETA 1: PERFIL BÁSICO */}
                  <PerfilCard 
                    firstName={firstName}
                    setFirstName={setFirstName}
                    firstNameError={firstNameError}
                    lastName={lastName}
                    setLastName={setLastName}
                    lastNameError={lastNameError}
                    isEditingProfile={isEditingProfile}
                    setIsEditingProfile={setIsEditingProfile}
                    isLoadingImage={isLoadingImage}
                    isEditingContact={isEditingContact}
                    isChangingPassword={isChangingPassword}
                    profileImage={profileImage}
                    DEFAULT_AVATAR={DEFAULT_AVATAR}
                    handleAvatarPress={handleAvatarPress}
                    handleFirstNameChange={handleFirstNameChange}
                    handleLastNameChange={handleLastNameChange}
                    showAlert={showAlert}
                    handleUpdateProfile={handleUpdateProfile}
                    handleCancelEdit={handleCancelEdit}
                  />
                  
                  {/* TARJETA 2: CONTACTO */}
                  <ContactoCard 
                    email={email}
                    handleEmailChange={handleEmailChange}
                    emailError={emailError}
                    address={address}
                    setAddress={setAddress}
                    phone={phone}
                    setPhone={setPhone}
                    isEditingContact={isEditingContact}
                    setIsEditingContact={setIsEditingContact}
                    isEditingProfile={isEditingProfile}
                    isChangingPassword={isChangingPassword}
                    showAlert={showAlert}
                    handleUpdateContact={handleUpdateContact}
                    handleCancelEdit={handleCancelEdit}
                  />
                  
                  {/* TARJETA 3: CONTRASEÑA */}
                  <PasswordCard 
                    isChangingPassword={isChangingPassword}
                    setIsChangingPassword={setIsChangingPassword}
                    isEditingProfile={isEditingProfile}
                    isEditingContact={isEditingContact}
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    currentPasswordError={currentPasswordError}
                    setCurrentPasswordError={setCurrentPasswordError}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmNewPassword={confirmNewPassword}
                    setConfirmNewPassword={setConfirmNewPassword}
                    showCurrentPassword={showCurrentPassword}
                    setShowCurrentPassword={setShowCurrentPassword}
                    showNewPassword={showNewPassword}
                    setShowNewPassword={setShowNewPassword}
                    showConfirmNewPassword={showConfirmNewPassword}
                    setShowConfirmNewPassword={setShowConfirmNewPassword}
                    showPasswordInfo={showPasswordInfo}
                    setShowPasswordInfo={setShowPasswordInfo}
                    showPasswordMatchInfo={showPasswordMatchInfo}
                    setShowPasswordMatchInfo={setShowPasswordMatchInfo}
                    passwordChecks={passwordChecks}
                    passwordsMatch={passwordsMatch}
                    showAlert={showAlert}
                    handleChangePassword={handleChangePassword}
                    handleCancelEdit={handleCancelEdit}
                  />
              </View>

              {/* BOTÓN DE CERRAR SESIÓN */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
              </TouchableOpacity>
          </LinearGradient>
          
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
                      
                      <TouchableOpacity 
                          style={styles.menuOption} 
                          onPress={() => pickImage('camera')}
                      >
                          <FontAwesome name="camera" size={20} color="#64bae8" style={{marginRight: 10}}/>
                          <Text style={styles.menuOptionText}>Usar Cámara</Text>
                      </TouchableOpacity>

                      <View style={styles.menuDivider} />

                      <TouchableOpacity 
                          style={styles.menuOption} 
                          onPress={() => pickImage('library')}
                      >
                          <FontAwesome name="image" size={20} color="#64bae8" style={{marginRight: 10}}/>
                          <Text style={styles.menuOptionText}>Elegir de Galería</Text>
                      </TouchableOpacity>
                      
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
      </KeyboardAwareScrollView>
    );
}

// ==========================================================
// ESTILOS (ACTUALIZADOS CON COMPACTACIÓN Y BORDES VERDE AGUA)
// ==========================================================
const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
    },
    gradientBackground: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: "center",
        height: '100%'
    },
    mainTitle: {
        //backgroundColor: "#05f7c2",
        fontSize: 28,
        fontWeight: "bold",
        color: "#222",
        marginBottom: 20,
        marginTop: 0,
        textAlign: "center",
        width: "100%",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        //margin: '-4%',
        borderWidth: 1.5, // Borde nuevo
        borderColor: '#05f7c2', // Color verde agua

    },
    cardContainer: {
        width: "100%",
        
    },
    // TARJETA: Con borde verde agua
    card: {
      width: "100%",
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: '3%',
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      marginBottom: '7%',
      borderWidth: 1.5, // Borde nuevo
      borderColor: '#05f7c2', // Color verde agua
    },
    // TÍTULO: Con línea verde agua
    cardTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#444",
      marginBottom: 10,
      borderBottomWidth: 3, // Aumento de grosor
      borderBottomColor: '#05f7c2', // Color verde agua
      paddingBottom: 1,
    },
    
    // --- ESTILOS DE FOTO DE PERFIL (sin cambios) ---
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 2,
      marginTop: 2,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#f0f0f0',
      borderWidth: 3,
      borderColor: '#05f7c2',
    },
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
      right: "70%", 
      transform: [{ translateX: '100%' }],
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
  
    // VALOR EN MODO VISTA (el viewValueMini ya no se usa, pero lo mantengo por si acaso)
    viewValue: {
        fontSize: 16,
        color: "#333",
        paddingVertical: 10,
        paddingHorizontal: 5,
        marginBottom: 5,
        fontWeight: '500', 
    },
    // Valor en modo vista MINIMALISTA (solo para tarjetas totalmente ocultas)
    viewValueMini: {
        fontSize: 14,
        color: "#888",
        paddingVertical: 5,
        paddingHorizontal: 5,
        marginBottom: 0,
        fontWeight: '400', 
        textAlign: 'center',
    },

    // --- ESTILOS DE PERFIL Y BOTONES ---
    label: {
      fontSize: 14, 
      fontWeight: "600",
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
      height: 45,
    },
    inputGroupError: {
      borderColor: "#ff6b6b", 
      borderWidth: 2,
      backgroundColor: '#fffafa', 
    },
    input: {
      flex: 1,
      height: '100%',
      fontSize: 15,
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

    // Contenedor para botones en modo edición
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
  
    // Botón Guardar Cambios (Para las tarjetas 1 y 2 en modo edición)
    saveButton: {
      backgroundColor: "#05f7c2", 
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 20,
      marginBottom: 10,
    },
    saveButtonText: {
      color: "#000",
      fontSize: 15,
      fontWeight: "bold",
    },
    
    // Estilo unificado para botones de acción (Editar/Cancelar/Cambiar Contraseña)
    actionButton: {
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 25,
      marginTop: 20,
      marginBottom: 10, 
    },
    actionButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "bold",
    },
  
    // Botón Cerrar Sesión (Reposicionado)
    logoutButton: {
      backgroundColor: "#ff6b6b", 
      paddingVertical: 8, 
      borderRadius: 25,
      alignItems: "center",
      marginTop: '4%', 
      marginBottom: '0%', 
      width: '80%',
      elevation: 4,
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
      marginTop: 5, 
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
      marginBottom: 10, 
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