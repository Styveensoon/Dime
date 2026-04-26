import { guardarEjercicio, leerEjercicios } from '@/app/utils/firebase';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EJERCICIOS = [
  {
    id: 'respiracion-basica',
    titulo: 'Respiración Diafragmática',
    tipo: 'respiracion',
    icon: '🌬️',
    duracion: 5,
    descripcion: 'Técnica de respiración profunda para calmar el estrés',
    pasos: [
      'Encuentra una posición cómoda',
      'Respira profundamente por la nariz durante 4 segundos',
      'Sostén la respiración durante 4 segundos',
      'Exhala lentamente durante 4 segundos',
      'Repite 10 veces',
    ],
  },
  {
    id: 'meditacion-guiada',
    titulo: 'Meditación Mindfulness',
    tipo: 'meditacion',
    icon: '🧘',
    duracion: 10,
    descripcion: 'Práctica de atención plena para mejorar enfoque y calma',
    pasos: [
      'Siéntate en una posición cómoda',
      'Cierra los ojos suavemente',
      'Observa tu respiración natural',
      'Cuando tu mente se distraiga, trae suavemente tu atención al respirar',
      'Continúa durante 10 minutos',
    ],
  },
  {
    id: 'ejercicio-movimiento',
    titulo: 'Movimiento Consciente',
    tipo: 'ejercicio-fisico',
    icon: '🏃',
    duracion: 15,
    descripcion: 'Actividad física suave para liberar tensión',
    pasos: [
      'Levántate y estira todos los grupos de músculos',
      'Camina lentamente prestando atención a cada paso',
      'Realiza movimientos circulares con brazos y cuello',
      'Siente cómo se relaja tu cuerpo',
      'Continúa durante 15 minutos',
    ],
  },
  {
    id: 'gratitud-diaria',
    titulo: 'Práctica de Gratitud',
    tipo: 'reflexion',
    icon: '🙏',
    duracion: 5,
    descripcion: 'Reflexionar sobre cosas por las que estamos agradecidos',
    pasos: [
      'Encuentra un lugar tranquilo',
      'Piensa en 3 cosas por las que estés agradecido hoy',
      'Para cada una, reflexiona sobre por qué es importante',
      'Escribe o memoriza estas reflexiones',
      'Siente la gratitud en tu cuerpo',
    ],
  },
];

export default function ExercisesScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<typeof EJERCICIOS[0] | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        setUserId(id);
        try {
          const ejercicios = await leerEjercicios(id);
          setExercises(ejercicios);
        } catch (error) {
          console.error('Error cargando ejercicios:', error);
        }
      }
    };
    cargarDatos();
  }, []);

  const handleStartExercise = async (ejercicio: typeof EJERCICIOS[0]) => {
    setSelectedExercise(ejercicio);
    setShowSteps(true);
  };

  const handleCompleteExercise = async () => {
    if (!selectedExercise || !userId) return;

    setLoading(true);
    try {
      const resultado = {
        id: `${selectedExercise.id}_${Date.now()}`,
        ejercicioId: selectedExercise.id,
        titulo: selectedExercise.titulo,
        tipo: selectedExercise.tipo,
        duracion: selectedExercise.duracion,
        completado: true,
        fecha: new Date().toISOString(),
        puntuacion: Math.floor(Math.random() * 40) + 60, // 60-100
      };

      await guardarEjercicio(userId, resultado);

      Alert.alert(
        '¡Felicidades!',
        `Completaste ${selectedExercise.titulo}. ¡Sigue adelante!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowSteps(false);
              setSelectedExercise(null);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121212' : '#F5F5F5' },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ headerShown: false }} />

      {!showSteps ? (
        <>
          <View style={[styles.header, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ThemedText style={{ color: '#1F4529', fontWeight: 'bold' }}>
                ← Volver
              </ThemedText>
            </TouchableOpacity>
            <ThemedText
              type="title"
              style={[styles.headerTitle, { color: '#1F4529' }]}
            >
              Ejercicios
            </ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoBanner}>
              <ThemedText style={styles.bannerText}>
                Realiza ejercicios para mejorar tu bienestar emocional y físico.
              </ThemedText>
            </View>

            {EJERCICIOS.map((ejercicio) => (
              <TouchableOpacity
                key={ejercicio.id}
                style={[
                  styles.ejercicioCard,
                  { backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
                ]}
                onPress={() => handleStartExercise(ejercicio)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <ThemedText style={styles.icon}>{ejercicio.icon}</ThemedText>
                </View>
                <View style={styles.infoContainer}>
                  <ThemedText
                    style={[
                      styles.ejercicioTitle,
                      { color: isDark ? '#FFF' : '#1F4529' },
                    ]}
                  >
                    {ejercicio.titulo}
                  </ThemedText>
                  <ThemedText style={styles.duracion}>
                    ⏱️ {ejercicio.duracion} minutos
                  </ThemedText>
                  <ThemedText style={styles.descripcion}>
                    {ejercicio.descripcion}
                  </ThemedText>
                </View>
                <View style={styles.arrowContainer}>
                  <ThemedText style={styles.arrow}>→</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        // Pantalla de pasos del ejercicio
        <View
          style={[
            styles.stepsContainer,
            { backgroundColor: isDark ? '#121212' : '#F5F5F5' },
          ]}
        >
          <View style={[styles.stepsHeader, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}>
            <TouchableOpacity
              onPress={() => setShowSteps(false)}
              style={styles.closeButton}
            >
              <ThemedText style={{ color: '#1F4529', fontWeight: 'bold' }}>
                ← Volver
              </ThemedText>
            </TouchableOpacity>
            <ThemedText
              style={[styles.exerciseName, { color: '#1F4529' }]}
              numberOfLines={1}
            >
              {selectedExercise?.titulo}
            </ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.stepsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconBig}>
              <ThemedText style={{ fontSize: 80 }}>
                {selectedExercise?.icon}
              </ThemedText>
            </View>

            <ThemedText
              style={[
                styles.stepsTitle,
                { color: isDark ? '#FFF' : '#1F4529' },
              ]}
            >
              Pasos a seguir
            </ThemedText>

            {selectedExercise?.pasos.map((paso, index) => (
              <View key={index} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: '#1F4529' },
                  ]}
                >
                  <ThemedText style={styles.stepNumberText}>
                    {index + 1}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.stepText,
                    { color: isDark ? '#FFF' : '#333' },
                  ]}
                >
                  {paso}
                </ThemedText>
              </View>
            ))}

            <View style={styles.spacer} />
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.completeButton,
              { opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handleCompleteExercise}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.completeButtonText}>
                ✓ Marcar como Completado
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingHorizontal: 8,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoBanner: {
    backgroundColor: '#E8F5E1',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  bannerText: {
    color: '#1F4529',
    fontSize: 14,
    fontWeight: '500',
  },
  ejercicioCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
  },
  ejercicioTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  duracion: {
    color: '#B38E5D',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  descripcion: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
  },
  arrowContainer: {
    padding: 8,
  },
  arrow: {
    fontSize: 20,
    color: '#B38E5D',
  },
  stepsContainer: {
    flex: 1,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    paddingHorizontal: 8,
  },
  exerciseName: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  stepsContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  iconBig: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  spacer: {
    height: 100,
  },
  completeButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1F4529',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
