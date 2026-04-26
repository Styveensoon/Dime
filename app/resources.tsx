import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Linking,
  Platform, // <-- 1. Importamos Platform
  StatusBar // <-- 2. Importamos StatusBar
} from 'react-native';

const IMSS_COLORS = {
  green: '#1F4529',
  gold: '#B38E5D',
  gray: '#6F7271',
  lightGray: '#F4F4F4',
  white: '#FFFFFF',
  emergency: '#B71C1C'
};

const CONTACTOS = [
  { id: '1', area: 'Atención Ciudadana IMSS', detalle: 'Consultas y trámites generales', contacto: '800 623 2323', tipo: 'tel' },
  { id: '2', area: 'Emergencias Médicas', detalle: 'Línea de auxilio inmediata (911)', contacto: '911', tipo: 'tel', esEmergencia: true },
  { id: '3', area: 'Orientación Médica Telefónica', detalle: 'Apoyo médico especializado', contacto: '800 2222 668', tipo: 'tel' },
  { id: '4', area: 'Correo Institucional', detalle: 'Atención vía mensaje electrónico', contacto: 'atencion.inicial@imss.gob.mx', tipo: 'email' },
  { id: '5', area: 'Chat IMSS Digital', detalle: 'Soporte oficial en línea', contacto: 'http://www.imss.gob.mx/contacto/chat', tipo: 'link' }
];

export default function ResourcesScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();

  const handleAction = (item: typeof CONTACTOS[0]) => {
    let url = '';
    if (item.tipo === 'tel') url = `tel:${item.contacto.replace(/\s/g, '')}`;
    if (item.tipo === 'email') url = `mailto:${item.contacto}`;
    if (item.tipo === 'link') url = item.contacto;

    Linking.openURL(url).catch(() => alert('No se pudo abrir el enlace'));
  };

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? '#121212' : IMSS_COLORS.lightGray,
          // 3. Agregamos el padding dinámico para Android
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
        }
      ]}
    >
      {/* 4. Configuramos el StatusBar para que sea transparente y fluido */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={true} />

      {/* Esto fuerza a que la ventana tenga título y botón de atrás nativo si es necesario */}
      <Stack.Screen options={{ title: 'Directorio', headerShown: false }} />

      <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : IMSS_COLORS.white }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: IMSS_COLORS.gold, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: IMSS_COLORS.green }]}>
          Directorio IMSS
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.introText}>
          Canales oficiales de comunicación institucional.
        </ThemedText>

        {CONTACTOS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }, item.esEmergencia && styles.emergencyCard]}
            onPress={() => handleAction(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardInfo}>
              <ThemedText style={[styles.areaText, { color: item.esEmergencia ? IMSS_COLORS.emergency : IMSS_COLORS.green }]}>
                {item.area}
              </ThemedText>
              <ThemedText style={styles.detalleText}>{item.detalle}</ThemedText>
              <ThemedText style={[styles.contactoText, { color: IMSS_COLORS.gold }]}>
                {item.contacto}
              </ThemedText>
            </View>
            <View style={[styles.actionBadge, { backgroundColor: item.esEmergencia ? IMSS_COLORS.emergency : IMSS_COLORS.green }]}>
              <ThemedText style={styles.actionBadgeText}>
                {item.tipo === 'tel' ? 'LLAMAR' : 'ABRIR'}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  introText: { fontSize: 14, color: IMSS_COLORS.gray, marginBottom: 20 },
  card: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emergencyCard: { borderWidth: 1, borderColor: IMSS_COLORS.emergency },
  cardInfo: { flex: 1 },
  areaText: { fontSize: 16, fontWeight: '700' },
  detalleText: { fontSize: 12, color: IMSS_COLORS.gray, marginVertical: 4 },
  contactoText: { fontSize: 15, fontWeight: '600' },
  actionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
});