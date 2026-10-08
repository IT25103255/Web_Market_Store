package com.sliit.marketstore.pattern.discount;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class FixedAmountDiscountStrategy implements DiscountStrategy {
    @Override
    public String getType() { return "FIXED"; }

    @Override
    public BigDecimal calculateDiscount(BigDecimal originalPrice, BigDecimal discountValue) {
        if (originalPrice == null || discountValue == null) return BigDecimal.ZERO.setScale(2);
        BigDecimal safe = discountValue.max(BigDecimal.ZERO).min(originalPrice);
        return safe.setScale(2, RoundingMode.HALF_UP);
    }
}
