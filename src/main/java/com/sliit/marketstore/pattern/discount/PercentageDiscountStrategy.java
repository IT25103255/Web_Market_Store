package com.sliit.marketstore.pattern.discount;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PercentageDiscountStrategy implements DiscountStrategy {
    @Override
    public String getType() { return "PERCENTAGE"; }

    @Override
    public BigDecimal calculateDiscount(BigDecimal originalPrice, BigDecimal discountValue) {
        if (originalPrice == null || discountValue == null) return BigDecimal.ZERO.setScale(2);
        return originalPrice.multiply(discountValue)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }
}
