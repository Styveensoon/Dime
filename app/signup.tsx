import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';

// Paleta Institucional
const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
};

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Atención', 'Por favor completa todos los campos para continuar.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulación de registro
      // Registro exitoso: navegación inmediata a la primera prueba del orden solicitado
      router.replace('/TestPHQ9'); // Redirige a testPHQ9, luego testGAD7 y testMSE en sus respectivas pantallas
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cuenta en este momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.white }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Seccion */}
          <View style={styles.headerSection}>
            <ThemedText type="title" style={[styles.title, { color: IMSS_COLORS.green }]}>
              Nueva Cuenta
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
              Regístrate para comenzar tu seguimiento institucional.
            </ThemedText>
          </View>

          {/* Formulario */}
          <View style={styles.formSection}>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nombre de Usuario</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="Ej. JuanPerez88"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Correo Electrónico</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Contraseña</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirmar Contraseña</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: IMSS_COLORS.green }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Crear Cuenta Segura</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <ThemedText style={{ color: IMSS_COLORS.gray }}>
                ¿Ya tienes una cuenta registrada?
              </ThemedText>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <ThemedText style={[styles.loginLink, { color: IMSS_COLORS.green }]}>
                    Inicia Sesión
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  headerSection: {
    marginBottom: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  divider: {
    height: 4,
    width: 40,
    backgroundColor: IMSS_COLORS.gold,
    marginBottom: 15,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  formSection: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: IMSS_COLORS.gray,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    borderRadius: 4,
    paddingHorizontal: 15,
    fontSize: 16,
    borderBottomWidth: 2,
    borderBottomColor: IMSS_COLORS.gold,
  },
  button: {
    height: 55,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  loginContainer: {
    marginTop: 25,
    alignItems: 'center',
    gap: 5,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});