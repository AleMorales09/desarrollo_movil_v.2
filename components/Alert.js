import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";

// 💡 CORRECCIÓN CLAVE: Agregamos 'onClose' y la usamos como acción de cierre por defecto.
const Alert = ({ 
  visible, 
  type, 
  title, 
  message, 
  onClose, // Propiedad legacy (si existe)
  // Si no se pasan onCancel/onConfirm, usamos onClose como fallback.
  onCancel = onClose || (() => {}), // Si no se pasa onCancel, usa onClose o una función vacía.
  // Si no se pasa onConfirm, por defecto usa onCancel (que será la función de cierre).
  onConfirm = onCancel, 
  buttonText = "Aceptar", 
  showCancel = false 
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { icon: "check-circle", color: "#05f7c2", iconColor: "#00d9a6" };
      case "error":
        return { icon: "exclamation-circle", color: "#ff6b6b", iconColor: "#ff5252" };
      default:
        return { icon: "info-circle", color: "#64bae8", iconColor: "#4a9ed9" }; 
    }
  };

  const { icon, color, iconColor } = getIconAndColor();

  const handleConfirm = () => {
    // Llama a la función de acción principal (que ahora por defecto es el cierre si es simple)
    onConfirm(); 
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel} // onRequestClose usa la función de Cancelar
    >
      <View style={styles.alertOverlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#ffffff", "#f8f9fa"]}
            style={styles.alertContent}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: color + "20" }]}>
              <FontAwesome name={icon} size={40} color={iconColor} />
            </View>
            <Text style={styles.alertTitle}>{title}</Text>
            <Text style={styles.alertMessage}>{message}</Text>
            
            {/* 💡 CONTENEDOR DE BOTONES FLEXIBLE */}
            <View style={styles.buttonContainer}>
              {/* 💡 BOTÓN DE CANCELAR (si es necesario) */}
              {showCancel && (
                <TouchableOpacity
                  style={[styles.alertButton, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}

              {/* 💡 BOTÓN PRINCIPAL (Aceptar/Confirmar/Cerrar Sesión) */}
              <TouchableOpacity
                style={[
                  styles.alertButton, 
                  styles.mainButton, 
                  { backgroundColor: color },
                  // Si no hay botón de cancelar, aplica el estilo para botón único
                  !showCancel && styles.singleButton 
                ]}
                onPress={handleConfirm} 
              >
                <Text style={styles.alertButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: "85%",
    maxWidth: 350,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  alertContent: {
    padding: 25,
    alignItems: "center",
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  // 💡 ESTILOS DE BOTONES
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    width: '100%',
    paddingHorizontal: 0, 
  },
  alertButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    flex: 1, // Asegura que los dos botones ocupen el espacio equitativamente
    marginHorizontal: 5,
    minWidth: '45%', 
  },
  // 💡 ESTILO PARA EL CASO DE UN SOLO BOTÓN (para que se centre y ocupe el ancho)
  singleButton: {
    width: '100%', 
    maxWidth: '100%', 
    flex: 0, 
    marginHorizontal: 0,
    marginTop: 5,
  },
  mainButton: {
    // Estilo para el botón principal 
  },
  cancelButton: {
    backgroundColor: '#ccc', // Color gris para cancelar
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  }
});

export default Alert;