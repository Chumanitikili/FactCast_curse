import React from "react";
import { View, Text, StyleSheet, Linking, Platform } from "react-native";

const getColor = (verdict: string) => {
  if (verdict === "Uncertain") return "#ffd600";
  if (verdict === "False") return "#e22134";
  return "#1db954";
};

export function FactCheckCard({ claim, verdict, sources, confidence }) {
  return (
    <View style={styles.card}>
      <Text style={styles.claim}>{claim}</Text>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: getColor(verdict) }]} />
        <Text style={styles.verdict}>{verdict}</Text>
        <Text style={styles.confidence}>({confidence}%)</Text>
      </View>
      <View>
        {sources.map((src: any) => (
          <Text
            style={styles.link}
            key={src.url}
            onPress={() => Linking.openURL(src.url)}
          >
            {src.name || src.url}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#212121",
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  claim: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 7,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  verdict: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 6,
  },
  confidence: {
    color: "#fff",
    fontSize: 14,
  },
  link: {
    color: "#1db954",
    textDecorationLine: "underline",
    fontSize: 14,
    marginBottom: 2,
  },
});