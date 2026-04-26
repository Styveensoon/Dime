import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para el flujo de inicio
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";

const IMSS_GREEN = '#1F4529';
const IMSS_GOLD = '#B38E5D';

const imgTest1 = require('@/assets/images/testGAD7/Exercise1.png');
const imgTest2 = require('@/assets/images/testGAD7/Exercise2.png');
const imgTest3 = require('@/assets/images/testGAD7/Exercise3.png');
const imgTest4 = require('@/assets/images/testGAD7/Exercise4.png');
const imgTest5 = require('@/assets/images/testGAD7/Exercise5.png');
const imgTest6 = require('@/assets/images/testGAD7/Exercise6.png');
const imgTest7 = require('@/assets/images/testGAD7/Exercise7.png');

type Responses = { [key: number]: number };

export default function TestGAD7() {
    const router = useRouter();
    const [answers, setAnswers] = useState<Responses>({});
    // const [followUp, setFollowUp] = useState<number | null>(null);

    const options = ["Nunca", "Varios días", "Más de la mitad", "Casi todos los días"];

    const questions = [
        { id: 1, text: "Poco interés o placer en hacer las cosas", imageSource: imgTest1 },
        { id: 2, text: "Se ha sentido decaído(a), deprimido(a) o sin esperanzas", imageSource: imgTest2 },
        { id: 3, text: "Dificultad para dormir o permanecer dormido(a), o duerme demasiado", imageSource: imgTest3 },
        { id: 4, text: "Se siente cansado(a) o tiene poca energía", imageSource: imgTest4 },
        { id: 5, text: "Poco apetito o come en exceso", imageSource: imgTest5 },
        { id: 6, text: "Se siente mal consigo mismo(a) — o siente que es un fracaso", imageSource: imgTest6 },
        { id: 7, text: "Dificultad para concentrarse en las cosas", imageSource: imgTest7 }
    ];

    const handleSelect = (questionId: number, index: number) => {
        setAnswers({ ...answers, [questionId]: index });
    };

    const handleFinish = async () => {
        await AsyncStorage.setItem('gad7_completed', 'true');
        router.replace("/testMMSE"); 
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title" style={{ fontFamily: Fonts.rounded, color: IMSS_GREEN }}>Cuestionario de Ansiedad Generalizada</ThemedText>
                <ThemedText style={styles.text}>Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?</ThemedText>
            </ThemedView>

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
                                onPress={() => handleSelect(q.id, index)}
                            >
                                <ThemedText style={answers[q.id] === index ? styles.textSelected : {}}>{option}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ThemedView>
                </ThemedView>
            ))}

            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                <ThemedText style={styles.finishButtonText}>Continuar al siguiente test</ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    titleContainer: { marginBottom: 24, marginTop: 20 },
    subtitle: { fontSize: 16, opacity: 0.7, marginTop: 8 },
    questionCard: { marginBottom: 24, padding: 12, borderRadius: 12 },
    questionImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
    questionText: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
    optionsContainer: { gap: 8 },
    optionButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc" },
    optionSelected: { backgroundColor: IMSS_GOLD, borderColor: IMSS_GOLD },
    textSelected: { color: "#fff", fontWeight: "bold" },
    finishButton: { backgroundColor: IMSS_GREEN, padding: 18, borderRadius: 12, alignItems: "center", marginBottom: 20 },
    finishButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
    text:{fontSize: 16, marginBottom: 12 }
});