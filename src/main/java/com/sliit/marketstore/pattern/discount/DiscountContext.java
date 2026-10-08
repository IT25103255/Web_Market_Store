package com.sliit.marketstore.pattern.discount;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Context in the Strategy Pattern. It selects the discount algorithm at runtime
 * and delegates the calculation to the selected strategy.
 */
public class DiscountContext {
    private final Map<String, DiscountStrategy> strategies = new LinkedHashMap<>();

    public DiscountContext() {
        register(new PercentageDiscountStrategy());
        register(new FixedAmountDiscountStrategy());
    }

    private void register(DiscountStrategy strategy) {
        strategies.put(strategy.getType(), strategy);
    }

    public String normalizeType(String type) {
        if (type == null || type.isBlank()) return "PERCENTAGE";
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if (!strategies.containsKey(normalized)) {
            throw new IllegalArgumentException("Unsupported discount type: " + type);
        }
        return normalized;
    }

    public String strategyName(String type) {
        String normalized = normalizeType(type);
        return normalized.equals("FIXED") ? "FixedAmountDiscountStrategy" : "PercentageDiscountStrategy";
    }

    public BigDecimal calculateEffectivePrice(BigDecimal originalPrice, String type, BigDecimal discountValue) {
        if (originalPrice == null) return BigDecimal.ZERO.setScale(2);
        DiscountStrategy strategy = strategies.get(normalizeType(type));
        BigDecimal discount = strategy.calculateDiscount(originalPrice, discountValue);
        BigDecimal effective = originalPrice.subtract(discount);
        if (effective.compareTo(BigDecimal.ZERO) < 0) effective = BigDecimal.ZERO;
        return effective.setScale(2, RoundingMode.HALF_UP);
    }
}
