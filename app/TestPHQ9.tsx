import React, { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FB_API_KEY, FB_BASE_URL } from '../constants';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const IMSS_GREEN = '#1F4529';
const IMSS_GOLD = '#B38E5D';

const imgTest1 = require('@/assets/images/testPHQ9/Exercise1.png');
const imgTest2 = require('@/assets/images/testPHQ9/Exercise2.png');
const imgTest3 = require('@/assets/images/testPHQ9/Exercise3.png');
const imgTest4 = require('@/assets/images/testPHQ9/Exercise4.png');
const imgTest5 = require('@/assets/images/testPHQ9/Exercise5.png');
const imgTest6 = require('@/assets/images/testPHQ9/Exercise6.png');
const imgTest7 = require('@/assets/images/testPHQ9/Exercise7.png');
const imgTest8 = require('@/assets/images/testPHQ9/Exercise8.png');


// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────
const toFirestoreFields = (obj: Record<string, any>): Record<string, any> => {
  const fields: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined)  fields[key] = { nullValue: null }
    else if (typeof val === 'boolean')       fields[key] = { booleanValue: val }
    else if (typeof val === 'number')        fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val }
    else if (typeof val === 'string')        fields[key] = { stringValue: val }
    else if (Array.isArray(val))             fields[key] = { arrayValue: { values: val.map(v => typeof v === 'string' ? { stringValue: v } : { doubleValue: Number(v) }) } }
    else if (typeof val === 'object')        fields[key] = { mapValue: { fields: toFirestoreFields(val) } }
  }
  return fields
}

const guardarEnColeccion = async (
  coleccion: string,
  docId: string,
  data: Record<string, any>,
  fbBaseUrl: string,
  fbApiKey: string,
): Promise<void> => {
  const url  = `${fbBaseUrl}/${coleccion}/${docId}?key=${fbApiKey}`
  const body = { fields: toFirestoreFields(data) }
  const res  = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.text(); throw new Error(`Firestore ${coleccion} ${res.status}: ${e}`) }
  console.log(`[Firebase/${coleccion}] guardado: ${docId}`)
}

export default function TestPHQ9() {
    const router = useRouter();
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [userEmail, setUserEmail]   = useState<string>('anonimo@app.com');
    const [userName,  setUserName]    = useState<string>('Anónimo');

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
        const total = Object.values(answers).reduce((a, b) => a + b, 0);
        const nivel =
            total <= 4  ? 'Mínimo'   :
            total <= 9  ? 'Leve'     :
            total <= 14 ? 'Moderado' :
            total <= 19 ? 'Moderado-Severo' : 'Severo';
        const docId = `${userEmail}_phq9_${Date.now()}`.replace(/[^a-zA-Z0-9_@.-]/g, '_');
        try {
            await guardarEnColeccion('testphq9', docId, {
                email:      userEmail,
                userName:   userName,
                timestamp:  new Date().toISOString(),
                respuestas: answers,
                puntuacion: total,
                nivel,
            }, FB_BASE_URL, FB_API_KEY);
        } catch (e) { console.warn('[testphq9] Error al guardar:', e); }
        await AsyncStorage.setItem('phq9_completed', 'true');
        router.replace("/testMMSE");
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title" style={{ color: IMSS_GREEN }}>Test de Salud del Paciente</ThemedText>
            </ThemedView>

            <ThemedText style={styles.text}>Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado cada uno de los siguientes problemas?</ThemedText>

            {questions.map((q) => (
                <ThemedView key={q.id} style={styles.questionCard}>
                    {q.imageSource && (
                        <Image source={q.imageSource} style={styles.questionImage} resizeMode="cover" />
                    )}

                    <ThemedText style={styles.questionText}>{q.id}. {q.text}</ThemedText>
                    <ThemedView style={styles.optionsContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.optionButton, answers[q.id] === index && styles.optionSelected]}
                                onPress={() => setAnswers({ ...answers, [q.id]: index })}
                            >
                                <ThemedText style={answers[q.id] === index ? styles.textSelected : {}}>{option}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ThemedView>
                </ThemedView>
            ))}

            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                <ThemedText style={styles.finishButtonText}>Siguiente: Evaluación Cognitiva</ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    titleContainer: { marginBottom: 24, marginTop: 20 },
    questionCard: { marginBottom: 24, padding: 12, borderRadius: 12 },
    questionImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
    questionText: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
    optionsContainer: { gap: 8 },
    optionButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc" },
    optionSelected: { backgroundColor: IMSS_GOLD, borderColor: IMSS_GOLD },
    textSelected: { color: "#fff", fontWeight: "bold" },
    finishButton: { backgroundColor: IMSS_GREEN, padding: 18, borderRadius: 12, alignItems: "center" },
    finishButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
    text:{fontSize: 16, marginBottom: 12 }
});