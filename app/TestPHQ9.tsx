import React, { useState, useEffect } from "react";
import { 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    View, 
    SafeAreaView, 
    Platform, 
    StatusBar,
    Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FB_API_KEY, FB_BASE_URL, ANTHROPIC_KEY } from '../constants';

const imgTest1 = require('@/assets/images/testPHQ9/Exercise1.png');
const imgTest2 = require('@/assets/images/testPHQ9/Exercise2.png');
const imgTest3 = require('@/assets/images/testPHQ9/Exercise3.png');
const imgTest4 = require('@/assets/images/testPHQ9/Exercise4.png');
const imgTest5 = require('@/assets/images/testPHQ9/Exercise5.png');
const imgTest6 = require('@/assets/images/testPHQ9/Exercise6.png');
const imgTest7 = require('@/assets/images/testPHQ9/Exercise7.png');
const imgTest8 = require('@/assets/images/testPHQ9/Exercise8.png');

// --- PALETA UNIFICADA ---
const C = {
    bg: '#F0EDE8',
    surface: '#FFFFFF',
    accent: '#B38E5D',
    primary: '#1F4529',
    text: '#0D0D0F',
    textMuted: '#6B6860',
    border: '#2A2A2E',
    surfaceAlt: '#F8F4EF',
};

// ─── ANTHROPIC HELPER ─────────────────────────────────────────────────────────
const generarPrediccionIA = async (
  testNombre: string,
  preguntas: { id: number; text: string }[],
  opciones: string[],
  respuestas: { [key: number]: number },
  puntuacion: number,
  nivelCalculado: string,
): Promise<{ sintesis: string; prediccion: string }> => {
  const detalleRespuestas = preguntas
    .map(q => `  P${q.id}: "${q.text}" → "${opciones[respuestas[q.id]] ?? 'Sin respuesta'}" (${respuestas[q.id] ?? 0} pts)`)
    .join('\n');

  const prompt = `Eres un asistente clínico experto. Analiza los resultados del test ${testNombre} de un paciente y genera:

1. SÍNTESIS CLÍNICA (máx. 120 palabras): Redacción concisa orientada al médico sobre el patrón de respuestas, síntomas predominantes y áreas de mayor afectación. Usa terminología clínica apropiada.

2. PREDICCIÓN (máx. 60 palabras): Basándote SOLO en las respuestas (sin ver el puntaje final), predice el nivel de severidad esperado y su implicación clínica.

Respuestas del paciente:
${detalleRespuestas}

Puntaje total: ${puntuacion}/24
Nivel calculado: ${nivelCalculado}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni backticks:
{"sintesis": "...", "prediccion": "..."}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const texto = data.content?.map((b: any) => b.text || '').join('') ?? '';
  try {
    const clean = texto.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { sintesis: texto, prediccion: 'No disponible' };
  }
};

// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────
const toFirestoreFields = (obj: Record<string, any>): Record<string, any> => {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined)  fields[key] = { nullValue: null };
    else if (typeof val === 'boolean')       fields[key] = { booleanValue: val };
    else if (typeof val === 'number')        fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === 'string')        fields[key] = { stringValue: val };
    else if (Array.isArray(val))             fields[key] = { arrayValue: { values: val.map(v => typeof v === 'string' ? { stringValue: v } : { doubleValue: Number(v) }) } };
    else if (typeof val === 'object')        fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
  }
  return fields;
};

const guardarEnColeccion = async (
  coleccion: string,
  docId: string,
  data: Record<string, any>,
  fbBaseUrl: string,
  fbApiKey: string,
): Promise<void> => {
  const url  = `${fbBaseUrl}/${coleccion}/${docId}?key=${fbApiKey}`;
  const body = { fields: toFirestoreFields(data) };
  const res  = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.text(); throw new Error(`Firestore ${coleccion} ${res.status}: ${e}`); }
  console.log(`[Firebase/${coleccion}] guardado: ${docId}`);
};

export default function TestPHQ9() {
    const router = useRouter();
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    
    // User Data & Loading States
    const [userEmail, setUserEmail] = useState<string>('anonimo@app.com');
    const [userName,  setUserName]  = useState<string>('Anónimo');
    const [cargando,  setCargando]  = useState<boolean>(false);

    // Auth & User Name
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user?.email) setUserEmail(user.email);
            try {
                const n = await AsyncStorage.getItem('@Sime_userName');
                if (n) setUserName(n);
            } catch {}
        });
        return unsub;
    }, []);

    const options = ["Nunca", "Varios días", "Más de la mitad", "Casi todos los días"];

    const questions = [
        { id: 1, text: "Sentirse nervioso(a), ansioso(a) o con los nervios de punta", imageSource: imgTest1 },
        { id: 2, text: "No poder dejar de preocuparse o controlar la preocupación", imageSource: imgTest2 },
        { id: 3, text: "Preocuparse demasiado por diferentes cosas", imageSource: imgTest3 },
        { id: 4, text: "Dificultad para relajarse", imageSource: imgTest4 },
        { id: 5, text: "Estar tan inquieto(a) que es difícil permanecer sentado(a)", imageSource: imgTest5 },
        { id: 6, text: "Molestarse o irritarse fácilmente", imageSource: imgTest6 },
        { id: 7, text: "Sentir miedo como si algo terrible pudiera suceder", imageSource: imgTest7 },
        { id: 8, text: "Sentirse agobiado(a) o abrumado(a)", imageSource: imgTest8 }
    ];

    const handleFinish = async () => {
        // 1. Validamos que no haya respuestas vacías
        if (Object.keys(answers).length < questions.length) {
            Alert.alert(
                "Atención", 
                "Por favor, responde a todas las preguntas antes de continuar."
            );
            return;
        }

        setCargando(true);
        try {
            // 2. Calcular puntuación total y nivel
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            const nivel =
                total <= 4  ? 'Mínimo'          :
                total <= 9  ? 'Leve'            :
                total <= 14 ? 'Moderado'        :
                total <= 19 ? 'Moderado-Severo' : 'Severo';

            // 3. Generar síntesis y predicción con IA
            const { sintesis, prediccion } = await generarPrediccionIA(
                'PHQ-9 (Salud del Paciente / Depresión)',
                questions,
                options,
                answers,
                total,
                nivel,
            );

            // 4. Guardar en Firestore incluyendo IA
            const docId = `${userEmail}_phq9_${Date.now()}`.replace(/[^a-zA-Z0-9_@.-]/g, '_');
            await guardarEnColeccion('testphq9', docId, {
                email:      userEmail,
                userName,
                timestamp:  new Date().toISOString(),
                respuestas: answers,
                puntuacion: total,
                nivel,
                ia_sintesis:   sintesis,
                ia_prediccion: prediccion,
            }, FB_BASE_URL, FB_API_KEY);

        } catch (e) {
            console.warn('[testphq9] Error:', e);
        } finally {
            setCargando(false);
        }

        // 5. Finalizar flujo y redirigir
        await AsyncStorage.setItem('phq9_completed', 'true');
        router.replace("/testMMSE");
    };

    return (
        <SafeAreaView 
            style={[
                styles.container,
                { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
            ]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
            
            {/* Oculta la barra nativa de navegación de Expo Router */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Barra superior con el botón Volver */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={{ color: C.accent, fontWeight: 'bold', fontSize: 16 }}>← Volver</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <ThemedView style={styles.header}>
                    <ThemedText type="title" style={{ color: C.accent, textAlign: 'center' }}>
                        Test PHQ-9
                    </ThemedText>
                    <ThemedText style={styles.progreso}>
                        Salud del Paciente
                    </ThemedText>
                </ThemedView>

                <ThemedText style={styles.introText}>
                    Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado cada uno de los siguientes problemas?
                </ThemedText>

                {questions.map((q) => (
                    <View key={q.id} style={styles.card}>
                        {q.imageSource && (
                            <Image source={q.imageSource} style={styles.questionImage} resizeMode="cover" />
                        )}

                        <ThemedText style={styles.questionText}>{q.id}. {q.text}</ThemedText>
                        
                        <View style={styles.optionsContainer}>
                            {options.map((option, index) => {
                                const isSelected = answers[q.id] === index;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.optionButton, 
                                            isSelected && styles.optionSelected
                                        ]}
                                        onPress={() => setAnswers({ ...answers, [q.id]: index })}
                                        activeOpacity={0.7}
                                    >
                                        <ThemedText style={[
                                            styles.optionText, 
                                            isSelected && styles.textSelected
                                        ]}>
                                            {option}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <TouchableOpacity 
                    style={[styles.nextBtn, cargando && { opacity: 0.6 }]} 
                    onPress={handleFinish}
                    disabled={cargando}
                >
                    <ThemedText style={styles.nextBtnTxt}>
                        {cargando ? 'Analizando y guardando...' : 'Siguiente: Evaluación Cognitiva'}
                    </ThemedText>
                </TouchableOpacity>
                
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: C.bg, 
    },
    topBar: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { 
        paddingVertical: 5, 
        paddingRight: 15 
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 60, 
    },
    header: {
        marginBottom: 25, 
        alignItems: 'center', 
        backgroundColor: 'transparent' 
    },
    progreso: {
        color: C.textMuted, 
        marginTop: 5,
        fontSize: 16,
    },
    introText: {
        fontSize: 16, 
        marginBottom: 30,
        color: C.text,
        textAlign: 'center',
        paddingHorizontal: 10
    },
    card: {
        backgroundColor: C.surface, 
        padding: 25, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: C.border, 
        marginBottom: 20,
        elevation: 2, 
        shadowColor: '#000', 
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    questionImage: { 
        width: '100%', 
        height: 180, 
        borderRadius: 16, 
        marginBottom: 20 
    },
    questionText: { 
        fontSize: 18, 
        fontWeight: "bold", 
        marginBottom: 20,
        color: C.primary,
        letterSpacing: 0.5
    },
    optionsContainer: { 
        gap: 10 
    },
    optionButton: { 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: C.border,
        backgroundColor: C.surfaceAlt,
    },
    optionSelected: { 
        backgroundColor: C.accent, 
        borderColor: C.accent 
    },
    optionText: {
        color: C.text,
        fontSize: 15,
        fontWeight: "500"
    },
    textSelected: { 
        color: C.surface, 
        fontWeight: "bold" 
    },
    nextBtn: {
        marginTop: 20, 
        backgroundColor: C.primary, 
        padding: 20, 
        borderRadius: 15, 
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    nextBtnTxt: { 
        color: C.surface, 
        fontWeight: 'bold', 
        fontSize: 16 
    }
});