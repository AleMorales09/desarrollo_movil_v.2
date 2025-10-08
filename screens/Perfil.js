import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from "react-native";
import { auth } from "../src/config/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";

// Componente de Alerta Personalizada
const CustomAlert = ({ visible, type, title, message, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
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
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: color }]}
              onPress={onClose}
            >
              <Text style={styles.alertButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function Perfil({ navigation }) {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
    if (type === "success") {
      setTimeout(() => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        navigation.navigate("Login");
      }, 2000);
    }
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // showAlert("success", "Sesión cerrada", "Has cerrado sesión correctamente.");
    } catch (error) {
      // showAlert("error", "Error", "No se pudo cerrar la sesión.");
    }
  };

  return (
    <LinearGradient colors={["#ffffffff", "#9fe2cfff"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Perfil</Text>
        {/* Otros datos del perfil aquí */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    elevation: 4,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#05f7c2",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 30,
  },
  logoutButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  // Estilos para la alerta personalizada
  alertOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  alertContent: {
    padding: 24,
    alignItems: "center",
    borderRadius: 16,
  },
  alertIconContainer: {
    borderRadius: 50,
    padding: 10,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2233e6ff",
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  alertButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  alertButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

