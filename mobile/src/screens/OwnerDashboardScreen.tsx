import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

export function OwnerDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Dashboard</Text>
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Welcome to your dashboard.</Text>
        <Text style={styles.subText}>Please manage your properties on the web portal for now.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: "900", color: Colors.onSurface, marginBottom: 16, marginTop: 40 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: Colors.onSurface, fontSize: 16, fontWeight: "bold" },
  subText: { color: Colors.outline, fontSize: 14, marginTop: 8, textAlign: "center" },
});
