import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../auth/AuthContext";
import { Colors, FontSize, Spacing, BorderRadius } from "../../theme/colors";

export function RegisterScreen({ route }: any) {
  const { register } = useAuth();
  const role = route?.params?.role || "student";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    setLoading(true);
    try {
      await register(role, name.trim(), {
        phone: phone.trim() || undefined,
      });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.detail?.message || err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const isStudent = role === "student";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.badge, { backgroundColor: isStudent ? Colors.primaryFixed : "#D1FAE5" }]}>
          <Ionicons
            name={isStudent ? "school" : "business"}
            size={20}
            color={isStudent ? Colors.primaryDark : "#065F46"}
          />
          <Text style={[styles.badgeText, { color: isStudent ? Colors.primaryDark : "#065F46" }]}>
            {isStudent ? "Student" : "Property Owner"}
          </Text>
        </View>

        <Text style={styles.heading}>Complete Your Profile</Text>
        <Text style={styles.subheading}>
          Just a few details to get you started on ApnaStay.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={18} color={Colors.outline} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.outline}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="call-outline" size={18} color={Colors.outline} />
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={Colors.outline}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Create Account</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xxl,
  },
  badgeText: { fontSize: FontSize.sm, fontWeight: "700" },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: FontSize.base,
    color: Colors.outline,
    marginBottom: Spacing.xxxl,
  },
  form: { gap: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.onSurface,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: FontSize.base,
    fontWeight: "700",
  },
});
