import React, { useEffect, useState } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Tus colores institucionales
const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
};

export default function MainScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  
  // Estados para el diseño y control (Manteniendo tus variables originales)
  const [username, setUsername] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // 1. Cargamos el nombre guardado en el Login
        const storedName = await AsyncStorage.getItem('username');
        if (storedName) setUsername(storedName);

        // 2. Verificamos si completó el test obligatorio
        const completado = await AsyncStorage.getItem('gad7_completed');
        
        if (completado !== 'true') {
          // Si no ha completado, lo mandamos al test inicial (PHQ9)
          router.replace('/PHQ9');
        } else {
          // Si ya lo hizo, permitimos mostrar el Main
          setIsVerifying(false);
        }
      } catch (e) {
        // Si hay error, liberamos la pantalla para no bloquear al usuario
        setIsVerifying(false);
      }
    };

    checkUserStatus();
  }, []);

  // Loader institucional
  if (isVerifying) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
        <ActivityIndicator size="large" color={IMSS_COLORS.green} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header con estilo institucional */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.welcomeText, { color: IMSS_COLORS.green }]}>
            Hola, {username || 'Usuario'}
          </ThemedText>
          <View style={styles.goldDivider} />
          <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
            Bienvenido a tu salud digital
          </ThemedText>
        </View>

        {/* Grid de botones de menú */}
        <View style={styles.menuGrid}>
          
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => router.push('/tests')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <ThemedText style={styles.icon}>🧘</ThemedText>
            </View>
            <ThemedText style={styles.menuTitle}>Bienestar</ThemedText>
            <ThemedText style={styles.menuDesc}>Tests y Salud</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => router.push('/bitacora')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <ThemedText style={styles.icon}>📝</ThemedText>
            </View>
            <ThemedText style={styles.menuTitle}>Bitácora</ThemedText>
            <ThemedText style={styles.menuDesc}>Tus registros</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => router.push('/retos')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <ThemedText style={styles.icon}>🏆</ThemedText>
            </View>
            <ThemedText style={styles.menuTitle}>Retos</ThemedText>
            <ThemedText style={styles.menuDesc}>Metas diarias</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => router.push('/usuarios')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
              <ThemedText style={styles.icon}>👥</ThemedText>
            </View>
            <ThemedText style={styles.menuTitle}>Usuarios</ThemedText>
            <ThemedText style={styles.menuDesc}>Comunidad</ThemedText>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 25,
  },
  header: {
    marginBottom: 35,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
  },
  goldDivider: {
    height: 4,
    width: 45,
    backgroundColor: IMSS_COLORS.gold,
    marginTop: 10,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: '48%',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'flex-start',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    fontSize: 24,
  },
  menuTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  }
});