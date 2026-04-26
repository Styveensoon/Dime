import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function TestPHQ9() {
    const router = useRouter();
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});

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