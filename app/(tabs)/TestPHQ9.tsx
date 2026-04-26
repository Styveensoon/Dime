import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";


type Responses = { [key: number]: number };

export default function TestPHQ9() {
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

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
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
});