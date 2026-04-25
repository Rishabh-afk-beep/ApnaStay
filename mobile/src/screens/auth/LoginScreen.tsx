import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../auth/AuthContext";
import { Colors, FontSize, Spacing, BorderRadius } from "../../theme/colors";

type Step = "role" | "credentials";

export function LoginScreen({ navigation }: any) {
  const { login, signUp, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<"student" | "owner">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        navigation.navigate("Register", { role: selectedRole });
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      if (msg.includes("user-not-found") || msg.includes("invalid-credential")) {
        Alert.alert("Error", "No account found. Try signing up instead.");
      } else if (msg.includes("email-already-in-use")) {
        Alert.alert("Error", "Account already exists. Try logging in instead.");
      } else if (msg.includes("weak-password")) {
        Alert.alert("Error", "Password should be at least 6 characters.");
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email above to reset your password");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert("Success", "Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("user-not-found")) {
        Alert.alert("Error", "No account found for this email");
      } else if (msg.includes("invalid-email")) {
        Alert.alert("Error", "Invalid email format");
      } else {
        Alert.alert("Error", "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "role") {
    return (
      <LinearGradient colors={["#FEF3C7", "#FAFAF5"]} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>C</Text>
            </View>
            <Text style={styles.brandName}>ApnaStay</Text>
          </View>

          <Text style={styles.heading}>Find your perfect stay</Text>
          <Text style={styles.subheading}>
            Discover PGs, hostels, and rooms near your college. Select your role
            to get started.
          </Text>

          <View style={styles.roleCards}>
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === "student" && styles.roleCardActive,
              ]}
              onPress={() => setSelectedRole("student")}
            >
              <Ionicons
                name="school"
                size={32}
                color={selectedRole === "student" ? Colors.primary : Colors.outline}
              />
              <Text
                style={[
                  styles.roleTitle,
                  selectedRole === "student" && styles.roleTitleActive,
                ]}
              >
                Student
              </Text>
              <Text style={styles.roleDesc}>
                Browse listings, compare prices, and shortlist your favourites
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === "owner" && styles.roleCardActive,
              ]}
              onPress={() => setSelectedRole("owner")}
            >
              <Ionicons
                name="business"
                size={32}
                color={selectedRole === "owner" ? Colors.primary : Colors.outline}
              />
              <Text
                style={[
                  styles.roleTitle,
                  selectedRole === "owner" && styles.roleTitleActive,
                ]}
              >
                Property Owner
              </Text>
              <Text style={styles.roleDesc}>
                Publish and manage your listings to reach student tenants
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep("credentials")}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Credentials step
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => setStep("role")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.brandName}>ApnaStay</Text>
        </View>

        <Text style={styles.heading}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>
        <Text style={styles.subheading}>
          {isSignUp
            ? `Sign up as ${selectedRole === "student" ? "a Student" : "a Property Owner"}`
            : "Log in to your account"}
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={18} color={Colors.outline} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={Colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.outline} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.outline}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {!isSignUp && (
            <TouchableOpacity onPress={handleResetPassword} disabled={loading} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {isSignUp ? "Sign Up" : "Log In"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.switchBtn}
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? "Already have an account? Log In"
                : "Don't have an account? Sign Up"}
            </Text>
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
  backBtn: { marginBottom: Spacing.lg },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xxl },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#FFF", fontSize: FontSize.xl, fontWeight: "900" },
  brandName: {
    marginLeft: Spacing.md,
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  heading: {
    fontSize: FontSize.xxxl,
    fontWeight: "900",
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: FontSize.base,
    color: Colors.outline,
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },
  roleCards: { gap: Spacing.lg, marginBottom: Spacing.xxxl },
  roleCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.divider,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFixed,
  },
  roleTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: Spacing.md,
  },
  roleTitleActive: { color: Colors.primaryDark },
  roleDesc: {
    fontSize: FontSize.sm,
    color: Colors.outline,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: FontSize.base,
    fontWeight: "700",
  },
  form: { gap: Spacing.lg },
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
  forgotBtn: { alignSelf: "flex-end", marginTop: -8 },
  forgotText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: "600" },
  switchBtn: { alignItems: "center", paddingVertical: Spacing.md },
  switchText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: "600" },
});
