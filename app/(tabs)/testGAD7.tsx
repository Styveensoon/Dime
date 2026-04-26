import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
// 1. Importamos useRouter para la navegación
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";

const ImageTest = require('@/assets/images/Ubuntu.jpg');

type Responses = { [key: number]: number };

export default function TestGAD7() {
    const router = useRouter();
    const [answers, setAnswers] = useState<Responses>({});
    const [followUp, setFollowUp] = useState<number | null>(null);

    const options = [
        "Nunca",
        "Varios días",
        "Más de la mitad de los días",
        "Casi todos los días",
    ];

    const questions = [
        { id: 1, text: "Poco interés o placer en hacer las cosas" },
        { id: 2, text: "Se ha sentido decaído(a), deprimido(a) o sin esperanzas" },
        { id: 3, text: "Dificultad para dormir o permanecer dormido(a), o duerme demasiado" },
        { id: 4, text: "Se siente cansado(a) o tiene poca energía" },
        { id: 5, text: "Poco apetito o come en exceso" },
        { id: 6, text: "Se siente mal consigo mismo(a) — o siente que es un fracaso o que ha decepcionado a su familia o a sí mismo(a)" },
        { id: 7, text: "Dificultad para concentrarse en las cosas, tal como leer el periódico o ver la televisión" },
        { id: 8, text: "Se mueve o habla tan lentamente que los demás pueden haberlo notado. O lo contrario: está tan inquieto(a) o agitado(a)" },
        { id: 9, text: "Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera" },
    ];

    const handleSelect = (questionId: number, index: number) => {
        setAnswers({ ...answers, [questionId]: index });
    };

    const handleFinish = () => {
        // Aquí iría la lógica para guardar en BD/Contexto en el futuro
        console.log("Respuestas guardadas:", answers);
        
        // 3. Volver a la pantalla anterior
        router.back();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
                    Test PHQ-9
                </ThemedText>

                <ThemedText style={styles.subtitle}>
                    Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado cada uno de los siguientes problemas?
                </ThemedText>
            </ThemedView>

            {questions.map((q) => (
                <ThemedView key={q.id} style={styles.questionCard}>
                    <Image 
                        source={ImageTest} 
                        style={styles.questionImage} 
                        resizeMode="cover"
                    />

                    <ThemedText style={styles.questionText}>
                        {q.id}. {q.text}
                    </ThemedText>
                
                    <ThemedView style={styles.optionsContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                styles.optionButton,
                                answers[q.id] === index && styles.optionSelected,
                                ]}
                                onPress={() => handleSelect(q.id, index)}
                            >
                                <ThemedText style={answers[q.id] === index ? styles.textSelected : {}}>
                                    {option}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ThemedView>
                </ThemedView>
            ))}

            {/* Pregunta de Seguimiento */}
            <ThemedView style={styles.questionCard}>
                <ThemedText style={[styles.questionText, { color: '#666' }]}>
                    ¿Qué tanta dificultad le han dado estos problemas para cumplir con su trabajo, atender las tareas del hogar o llevarse bien con otras personas?
                </ThemedText>

                <ThemedView style={styles.optionsContainer}>
                    {["Ninguna", "Algo", "Mucha", "Extrema"].map((opt, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.optionButton, followUp === idx && styles.optionSelected]}
                            onPress={() => setFollowUp(idx)}
                        >
                            <ThemedText style={followUp === idx ? styles.textSelected : {}}>{opt}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ThemedView>
            </ThemedView>

            {/* 4. Botón Finalizar */}
            <TouchableOpacity 
                style={styles.finishButton} 
                onPress={handleFinish}
                activeOpacity={0.7}
            >
                <ThemedText style={styles.finishButtonText}>Finalizar</ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    titleContainer: {
        marginBottom: 24,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        marginTop: 8,
    },
    questionCard: {
        marginBottom: 24,
        padding: 12,
        borderRadius: 12,
    },
    questionImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    questionText: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
    },
    optionsContainer: {
        gap: 8,
    },
    optionButton: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    optionSelected: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    textSelected: {
        color: "#fff",
        fontWeight: "bold",
    },
    // Estilos para el nuevo botón
    finishButton: {
        backgroundColor: "#28a745", // Un verde para indicar éxito
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    finishButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: Fonts.rounded,
    },
});