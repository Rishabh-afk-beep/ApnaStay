import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../auth/AuthContext";
import { Colors, FontSize, Spacing, BorderRadius } from "../theme/colors";

export function ProfileScreen() {
  const { profile, user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const roleBadge = {
    student: { label: "Student", color: Colors.primaryDark, bg: Colors.primaryFixed, icon: "school" },
    owner: { label: "Property Owner", color: "#065F46", bg: "#D1FAE5", icon: "business" },
    admin: { label: "Admin", color: "#1E293B", bg: "#E2E8F0", icon: "shield" },
  }[profile?.role || "student"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.name || user?.email || "?")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{profile?.name || "User"}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
          <Ionicons name={roleBadge.icon as any} size={14} color={roleBadge.color} />
          <Text style={[styles.roleText, { color: roleBadge.color }]}>
            {roleBadge.label}
          </Text>
        </View>
      </View>

      {/* Info cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.outline} />
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || "Not set"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={Colors.outline} />
            <View>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile?.phone || "Not set"}</Text>
            </View>
          </View>
        </View>

        {profile?.college_id && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={18} color={Colors.outline} />
              <View>
                <Text style={styles.infoLabel}>College</Text>
                <Text style={styles.infoValue}>{profile.college_id}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.outline} />
            <View>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "Recently joined"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>ApnaStay v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },
  avatarSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: Spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: FontSize.xxxl, fontWeight: "900", color: "#FFF" },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.outline,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  roleText: { fontSize: FontSize.sm, fontWeight: "700" },
  infoSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  infoLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.outline,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.onSurface,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.errorContainer,
  },
  logoutText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.error,
  },
  version: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.outline,
    marginTop: Spacing.xxl,
  },
});
