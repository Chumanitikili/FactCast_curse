import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { FactCheckCard } from "./FactCheckCard";
import { useFactCheck } from "./useFactCheck";

export default function App() {
  const [input, setInput] = useState("");
  const { loading, result, checkFact } = useFactCheck();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FactCast 🕵️‍♂️</Text>
      <Text style={styles.subtitle}>Type a claim or press mic to speak.</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Enter a claim..."
        placeholderTextColor="#888"
        multiline
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => checkFact(input)}
        disabled={loading || !input}
      >
        <Text style={styles.buttonText}>{loading ? "Checking..." : "Check Fact"}</Text>
      </TouchableOpacity>
      <ScrollView style={{ width: "100%" }}>
        {result && (
          <FactCheckCard
            claim={result.claim}
            verdict={result.verdict}
            sources={result.sources}
            confidence={result.confidence}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#191414",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "android" ? 50 : 70,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: "#1db954",
    fontFamily: Platform.OS === "ios" ? "San Francisco" : "Roboto",
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    color: "#fff",
    marginBottom: 16,
    fontSize: 16,
  },
  input: {
    backgroundColor: "#232323",
    color: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    fontSize: 18,
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#1db954",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 22,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
});