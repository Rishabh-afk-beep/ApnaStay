import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

export function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Alerts</Text>
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No alerts configured yet.</Text>
        <Text style={styles.subText}>Use the web portal to set up alerts.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: "900", color: Colors.onSurface, marginBottom: 16, marginTop: 40 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: Colors.onSurface, fontSize: 16, fontWeight: "bold" },
  subText: { color: Colors.outline, fontSize: 14, marginTop: 8 },
});
