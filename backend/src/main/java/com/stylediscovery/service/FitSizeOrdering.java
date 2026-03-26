package com.stylediscovery.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Stable ordering of size labels for grading steps (smaller index = smaller garment in ladder).
 */
public final class FitSizeOrdering {

    private static final Map<String, Integer> LABEL_ORDER = Map.ofEntries(
            Map.entry("XXXS", -40),
            Map.entry("XXS", -30),
            Map.entry("XS", -20),
            Map.entry("S", -10),
            Map.entry("M", 0),
            Map.entry("L", 10),
            Map.entry("XL", 20),
            Map.entry("XXL", 30),
            Map.entry("2XL", 30),
            Map.entry("3XL", 40),
            Map.entry("4XL", 50),
            Map.entry("5XL", 60)
    );

    private FitSizeOrdering() {}

    public static String normalizeKey(String size) {
        if (size == null) return "";
        return size.trim().toUpperCase(Locale.ROOT);
    }

    /**
     * Ordinal rank for sorting (smaller = smaller size in typical ladder).
     */
    public static int rank(String size) {
        String key = normalizeKey(size);
        if (key.isEmpty()) return Integer.MAX_VALUE;
        Integer label = LABEL_ORDER.get(key);
        if (label != null) return label;
        try {
            double n = Double.parseDouble(key.replace(",", "."));
            return (int) Math.round(n * 10);
        } catch (NumberFormatException e) {
            return 1_000_000 + Math.floorMod(key.hashCode(), 10_000);
        }
    }

    public static List<String> sortedCopy(List<String> sizes) {
        return sizes.stream()
                .distinct()
                .sorted(Comparator.comparingInt(FitSizeOrdering::rank))
                .collect(Collectors.toList());
    }

    public static int indexInLadder(List<String> sortedSizes, String size) {
        String key = normalizeKey(size);
        for (int i = 0; i < sortedSizes.size(); i++) {
            if (normalizeKey(sortedSizes.get(i)).equals(key)) {
                return i;
            }
        }
        return sortedSizes.size() / 2;
    }
}
