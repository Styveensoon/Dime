import { leerPerfil } from '@/app/utils/firebase';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Buffer } from 'buffer';

// Colores institucionales
const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
};

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor completa tus credenciales de acceso.');
      return;
    }

    setLoading(true);
    try {
      // Usar email como ID de usuario (en base64)
      const userId = Buffer.from(email).toString('base64');
      
      // Verificar que el usuario existe en Firebase
      const perfil = await leerPerfil(userId);
      
      if (!perfil) {
        Alert.alert('Error', 'Usuario no encontrado. Por favor regístrate primero.');
        setLoading(false);
        return;
      }

      // Guardar sesión localmente
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('username', perfil.username || '');

      Alert.alert('Éxito', `¡Bienvenido ${perfil.username}!`);
      router.push('/main');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión. Verifique sus datos.');
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header Institucional */}
          <View style={styles.headerSection}>
            <View style={styles.logoPlaceholder}>
              <ThemedText style={styles.logoText}>IMSS</ThemedText>
            </View>
            <ThemedText type="title" style={[styles.title, { color: IMSS_COLORS.green }]}>
              Bienvenido
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
              Identifícate para acceder a tus servicios
            </ThemedText>
          </View>

          {/* Formulario */}
          <View style={styles.formSection}>
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

            <View>
              <ThemedText style={styles.label}>Contraseña</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: isDark ? '#222' : IMSS_COLORS.lightGray }
                ]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <Link href="/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotContainer}>
                <ThemedText style={[styles.forgotLink, { color: IMSS_COLORS.green }]}>
                  ¿Olvidaste tu contraseña?
                </ThemedText>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: IMSS_COLORS.green }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
              )}
            </TouchableOpacity>

            {/* Footer de Registro */}
            <View style={styles.signupContainer}>
              <ThemedText style={{ color: IMSS_COLORS.gray }}>
                ¿No tienes una cuenta aún?
              </ThemedText>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <ThemedText style={[styles.signupLink, { color: IMSS_COLORS.green }]}>
                    Regístrate aquí
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
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: IMSS_COLORS.green,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
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
    gap: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: IMSS_COLORS.gray,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    height: 55,
    borderRadius: 4,
    paddingHorizontal: 15,
    fontSize: 16,
    borderBottomWidth: 2,
    borderBottomColor: IMSS_COLORS.gold,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
  },
  forgotLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    height: 55,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  signupContainer: {
    marginTop: 30,
    alignItems: 'center',
    gap: 5,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});