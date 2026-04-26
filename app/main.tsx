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
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
};

export default function MainScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  
  // VARIABLES ORIGINALES RESPETADAS
  const [username, setUsername] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  // FUNCIÓN ORIGINAL RESPETADA
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const storedName = await AsyncStorage.getItem('username');
        if (storedName) setUsername(storedName);

        const completado = await AsyncStorage.getItem('gad7_completed');
        
        if (completado !== 'true') {
          router.replace('/PHQ9'); // Mantiene ruta de test obligatorio
        } else {
          setIsVerifying(false);
        }
      } catch (e) {
        setIsVerifying(false);
      }
    };
    checkUserStatus();
  }, []);

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
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* NUEVO: Header con Círculo de Perfil */}
        <View style={styles.topBar}>
          <View style={styles.welcomeContainer}>
            <ThemedText type="title" style={[styles.welcomeText, { color: IMSS_COLORS.green }]}>
              Hola, {username || 'Usuario'}
            </ThemedText>
            <View style={styles.goldDivider} />
          </View>
          
          <TouchableOpacity 
            style={[styles.profileCircle, { backgroundColor: IMSS_COLORS.green }]}
            onPress={() => router.push('/perfil')} // Ruta para ver perfil
          >
            <ThemedText style={styles.profileInitial}>
              {(username || 'U').charAt(0).toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={[styles.subtitle, { color: IMSS_COLORS.gray }]}>
          Bienvenido a tu salud digital
        </ThemedText>

        {/* GRID DE BOTONES MEJORADO */}
        <View style={styles.menuGrid}>
          
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => router.push('/tests')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <ThemedText style={styles.icon}>🧘</ThemedText>
            </View>
            <ThemedText style={styles.menuTitle}>Bienestar</ThemedText>
            <ThemedText style={styles.menuDesc}>Tests y salud mental</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => router.push('/bitacora')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <ThemedText style={styles.icon}>📝</ThemedText>
            </View>
            <ThemedText style={styles.menuTitle}>Bitácora</ThemedText>
            <ThemedText style={styles.menuDesc}>Tus registros diarios</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            onPress={() => router.push('/resources')} // Conectado a Resources
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <ThemedText style={styles.icon}>📞</ThemedText>
            </View>
            <ThemedText style={styles.menuTitle}>Contactos</ThemedText>
            <ThemedText style={styles.menuDesc}>Recursos de apoyo</ThemedText>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 25 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 20 },
  welcomeContainer: { flex: 1 },
  welcomeText: { fontSize: 26, fontWeight: '800' },
  goldDivider: { height: 4, width: 40, backgroundColor: IMSS_COLORS.gold, marginTop: 8, borderRadius: 2 },
  profileCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  profileInitial: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 16, marginTop: 10, marginBottom: 35, fontWeight: '500' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuButton: {
    width: '48%',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'flex-start',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  icon: { fontSize: 24 },
  menuTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  menuDesc: { fontSize: 11, color: '#999', fontWeight: '500' }
});