import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { listShortlists, removeShortlist, getPropertyDetail } from "../api/client";
import { Colors, FontSize, Spacing, BorderRadius } from "../theme/colors";
import type { ShortlistOut } from "../types";

function ShortlistItem({
  item,
  onRemove,
  onPress,
}: {
  item: ShortlistOut;
  onRemove: () => void;
  onPress: () => void;
}) {
  const detailQuery = useQuery({
    queryKey: ["property-detail", item.property_id],
    queryFn: () => getPropertyDetail(item.property_id),
  });

  const property = detailQuery.data;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {property?.title || item.property_id}
          </Text>
          {property?.address_text && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={Colors.outline} />
              <Text style={styles.locationText} numberOfLines={1}>
                {property.address_text}
              </Text>
            </View>
          )}
          {property && (
            <Text style={styles.priceText}>
              ₹{property.rent_min.toLocaleString()}
              {property.rent_min !== property.rent_max &&
                ` – ₹${property.rent_max.toLocaleString()}`}
              /mo
            </Text>
          )}
          <Text style={styles.dateText}>
            Saved on {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="heart-dislike-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function ShortlistsScreen({ navigation }: any) {
  const queryClient = useQueryClient();

  const shortlistsQuery = useQuery({
    queryKey: ["shortlists"],
    queryFn: listShortlists,
  });

  const removeMutation = useMutation({
    mutationFn: removeShortlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortlists"] });
    },
    onError: () => Alert.alert("Error", "Could not remove from shortlist."),
  });

  const handleRemove = (propertyId: string) => {
    Alert.alert("Remove?", "Remove this property from your shortlist?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeMutation.mutate(propertyId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Shortlist</Text>
        <Text style={styles.count}>
          {shortlistsQuery.data?.length ?? 0} saved
        </Text>
      </View>

      {shortlistsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={shortlistsQuery.data ?? []}
          keyExtractor={(item) => item.shortlist_id || item.property_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ShortlistItem
              item={item}
              onRemove={() => handleRemove(item.property_id)}
              onPress={() =>
                navigation.navigate("PropertyDetail", {
                  propertyId: item.property_id,
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={52} color={Colors.outline} />
              <Text style={styles.emptyTitle}>No saved properties</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart icon on a property to save it here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  heading: { fontSize: FontSize.xxl, fontWeight: "900", color: Colors.onSurface },
  count: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.onSurface },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: FontSize.sm, color: Colors.outline },
  priceText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginTop: 6,
  },
  dateText: { fontSize: FontSize.xs, color: Colors.outline, marginTop: 4 },
  removeBtn: { padding: Spacing.md },
  emptyContainer: { alignItems: "center", paddingTop: 100, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.onSurface },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.outline, textAlign: "center", paddingHorizontal: 40 },
});
