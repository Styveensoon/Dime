import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  SafeAreaView, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  View, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';

// Definición de colores institucionales sugeridos
const IMSS_COLORS = {
  green: '#1F4529', // Verde institucional oscuro
  lightGreen: '#2E5A35',
  gold: '#B38E5D', // Oro institucional
  gray: '#6F7271',
  lightGray: '#F4F4F4',
};

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      Alert.alert('Atención', 'Por favor ingresa tu correo electrónico institucional o personal registrado.');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulación
      setEmailSent(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la solicitud en este momento.');
    } finally {
      setLoading(false);
    }
  };

  const SuccessView = () => (
    <View style={styles.successContainer}>
      <View style={styles.iconCircle}>
        <ThemedText style={styles.checkIcon}>✓</ThemedText>
      </View>
      <ThemedText type="title" style={[styles.title, { color: IMSS_COLORS.green }]}>
        Instrucciones Enviadas
      </ThemedText>
      <ThemedText style={styles.successMessage}>
        Hemos enviado un enlace de recuperación a <ThemedText style={{fontWeight: 'bold'}}>{email}</ThemedText>. 
        Por favor, verifica también tu carpeta de correo no deseado.
      </ThemedText>
      <Link href="/login" asChild>
        <TouchableOpacity style={styles.primaryButton}>
          <ThemedText style={styles.buttonText}>Entendido</ThemedText>
        </TouchableOpacity>
      </Link>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ThemedView style={styles.content}>
          {!emailSent && (
            <Link href="/login" asChild>
              <TouchableOpacity style={styles.backButton}>
                <ThemedText style={{ color: IMSS_COLORS.green, fontWeight: '600' }}>
                  ← Regresar al inicio
                </ThemedText>
              </TouchableOpacity>
            </Link>
          )}

          {emailSent ? <SuccessView /> : (
            <View style={styles.innerContent}>
              <View style={styles.header}>
                <ThemedText type="title" style={[styles.title, { color: IMSS_COLORS.green }]}>
                  Recuperar Contraseña
                </ThemedText>
                <View style={styles.divider} />
                <ThemedText style={styles.subtitle}>
                  Para restablecer tu acceso, ingresa el correo electrónico asociado a tu cuenta.
                </ThemedText>
              </View>

              <View style={styles.form}>
                <View>
                  <ThemedText style={styles.label}>Correo Electrónico</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }
                    ]}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && { opacity: 0.8 }]}
                  onPress={handleSendEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.buttonText}>Enviar solicitud</ThemedText>
                  )}
                </TouchableOpacity>

                <View style={styles.footerContainer}>
                  <ThemedText style={styles.footerText}>¿Aún tienes problemas?</ThemedText>
                  <TouchableOpacity>
                    <ThemedText style={styles.supportLink}>Contactar a soporte técnico</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  innerContent: { width: '100%' },
  header: { marginBottom: 30 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 10, textAlign: 'left' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#555' },
  divider: { height: 4, width: 40, backgroundColor: IMSS_COLORS.gold, marginBottom: 15, borderRadius: 2 },
  backButton: { position: 'absolute', top: 0, left: 0, paddingVertical: 20 },
  form: { gap: 20 },
  label: { fontSize: 13, fontWeight: '700', color: IMSS_COLORS.gray, marginBottom: 8, textTransform: 'uppercase' },
  input: {
    height: 55,
    borderRadius: 4, // Bordes menos redondeados para seriedad
    paddingHorizontal: 15,
    fontSize: 16,
    borderBottomWidth: 2,
    borderBottomColor: IMSS_COLORS.gold, // Acento en el borde inferior
  },
  primaryButton: {
    backgroundColor: IMSS_COLORS.green,
    height: 55,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 10,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footerContainer: { marginTop: 25, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#666' },
  supportLink: { color: IMSS_COLORS.lightGreen, fontWeight: '700', marginTop: 5, textDecorationLine: 'underline' },
  // Estilos de Éxito
  successContainer: { alignItems: 'center', padding: 20 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: IMSS_COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkIcon: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  successMessage: { textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 30, color: '#444' },
});