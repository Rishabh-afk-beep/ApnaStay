import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { getPropertyDetail, getPropertyReviews, submitInquiry, addShortlist } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Colors, FontSize, Spacing, BorderRadius } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function PropertyDetailScreen({ route, navigation }: any) {
  const { propertyId } = route.params;
  const { profile } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryName, setInquiryName] = useState(profile?.name || "");
  const [inquiryPhone, setInquiryPhone] = useState(profile?.phone || "");
  const [inquiryMessage, setInquiryMessage] = useState("");

  const detailQuery = useQuery({
    queryKey: ["property-detail", propertyId],
    queryFn: () => getPropertyDetail(propertyId),
  });

  const reviewsQuery = useQuery({
    queryKey: ["property-reviews", propertyId],
    queryFn: () => getPropertyReviews(propertyId),
  });

  const shortlistMutation = useMutation({
    mutationFn: () => addShortlist(propertyId),
    onSuccess: () => Alert.alert("Saved!", "Property added to your shortlist"),
    onError: () => Alert.alert("Error", "Could not save. Please log in first."),
  });

  const inquiryMutation = useMutation({
    mutationFn: () =>
      submitInquiry(propertyId, {
        name: inquiryName,
        phone: inquiryPhone,
        message: inquiryMessage,
      }),
    onSuccess: () => {
      setShowInquiryModal(false);
      Alert.alert("Sent!", "Your inquiry has been sent to the owner.");
    },
    onError: () => Alert.alert("Error", "Could not send inquiry."),
  });

  if (detailQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const property = detailQuery.data;
  if (!property) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.error }}>Property not found</Text>
      </View>
    );
  }

  const images = property.image_urls.length > 0 ? property.image_urls : [property.cover_image_url].filter(Boolean);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={images}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} />
            )}
          />
          {/* Dots */}
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          {/* Shortlist button */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => shortlistMutation.mutate()}
          >
            <Ionicons name="heart-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Title + Type */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{property.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={Colors.primary} />
                <Text style={styles.address}>{property.address_text}</Text>
              </View>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {property.property_type.replace("_", " ")}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Monthly Rent</Text>
            <Text style={styles.price}>
              ₹{property.rent_min.toLocaleString()}
              {property.rent_min !== property.rent_max &&
                ` – ₹${property.rent_max.toLocaleString()}`}
            </Text>
            <Text style={styles.depositText}>
              Security Deposit: ₹{property.security_deposit.toLocaleString()}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingMain}>
              <Ionicons name="star" size={20} color={Colors.primary} />
              <Text style={styles.ratingValue}>{property.rating_avg.toFixed(1)}</Text>
            </View>
            <Text style={styles.ratingCount}>
              {property.review_count} reviews
            </Text>
          </View>

          {/* Description */}
          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descText}>{property.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((a) => (
                  <View key={a} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Room Options */}
          {property.room_options && property.room_options.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Room Options</Text>
              {property.room_options.map((room) => (
                <View key={room.option_id} style={styles.roomRow}>
                  <Text style={styles.roomLabel}>{room.label}</Text>
                  <Text style={styles.roomPrice}>₹{room.price.toLocaleString()}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          room.status === "available"
                            ? Colors.successContainer
                            : Colors.surfaceContainer,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            room.status === "available"
                              ? Colors.success
                              : Colors.outline,
                        },
                      ]}
                    >
                      {room.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Food Menu */}
          {property.food_menu && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🍽️ Food Menu</Text>
              <Text style={styles.descText}>{property.food_menu}</Text>
            </View>
          )}

          {/* Rules */}
          {property.rules && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 House Rules</Text>
              <Text style={styles.descText}>{property.rules}</Text>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviewsQuery.data?.length === 0 && (
              <Text style={styles.descText}>No reviews yet</Text>
            )}
            {reviewsQuery.data?.slice(0, 5).map((r) => (
              <View key={r.review_id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{r.user_name || "Verified Student"}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= r.rating ? "star" : "star-outline"}
                        size={14}
                        color={Colors.primary}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewComment}>{r.comment}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.inquireBtn}
          onPress={() => setShowInquiryModal(true)}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
          <Text style={styles.inquireBtnText}>Contact Owner</Text>
        </TouchableOpacity>
      </View>

      {/* Inquiry Modal */}
      <Modal visible={showInquiryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Send Inquiry</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your name"
              placeholderTextColor={Colors.outline}
              value={inquiryName}
              onChangeText={setInquiryName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone number"
              placeholderTextColor={Colors.outline}
              keyboardType="phone-pad"
              value={inquiryPhone}
              onChangeText={setInquiryPhone}
            />
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
              placeholder="Your message..."
              placeholderTextColor={Colors.outline}
              multiline
              value={inquiryMessage}
              onChangeText={setInquiryMessage}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowInquiryModal(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => inquiryMutation.mutate()}
                disabled={inquiryMutation.isPending}
              >
                {inquiryMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.sendBtnText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  gallery: { position: "relative" },
  galleryImage: { width: SCREEN_WIDTH, height: 280, backgroundColor: Colors.surfaceContainer },
  dots: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#FFF", width: 20 },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartButton: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: Spacing.xl },
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: "900", color: Colors.onSurface },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  address: { fontSize: FontSize.sm, color: Colors.outline },
  typeBadge: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.primaryDark,
    textTransform: "capitalize",
  },
  priceCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  priceLabel: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.outline, textTransform: "uppercase", letterSpacing: 0.5 },
  price: { fontSize: FontSize.xxl, fontWeight: "900", color: Colors.primaryDark, marginTop: 4 },
  depositText: { fontSize: FontSize.sm, color: Colors.outline, marginTop: 4 },
  ratingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  ratingMain: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingValue: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.onSurface },
  ratingCount: { fontSize: FontSize.sm, color: Colors.outline },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.onSurface, marginBottom: Spacing.md },
  descText: { fontSize: FontSize.base, color: Colors.onSurfaceVariant, lineHeight: 22 },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  amenityText: { fontSize: FontSize.sm, color: Colors.onSurfaceVariant, fontWeight: "600", textTransform: "capitalize" },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  roomLabel: { fontSize: FontSize.base, fontWeight: "700", color: Colors.onSurface, flex: 1 },
  roomPrice: { fontSize: FontSize.lg, fontWeight: "900", color: Colors.primaryDark },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, marginLeft: Spacing.md },
  statusText: { fontSize: FontSize.xs, fontWeight: "700", textTransform: "uppercase" },
  reviewCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  reviewerName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.onSurface },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewComment: { fontSize: FontSize.sm, color: Colors.onSurfaceVariant, lineHeight: 18 },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  inquireBtnText: { color: "#FFF", fontSize: FontSize.base, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.onSurface, marginBottom: Spacing.xl },
  modalInput: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: FontSize.base,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  modalActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceContainer, alignItems: "center" },
  cancelBtnText: { fontWeight: "700", color: Colors.onSurfaceVariant },
  sendBtn: { flex: 1, paddingVertical: 12, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: "center" },
  sendBtnText: { fontWeight: "700", color: "#FFF" },
});
