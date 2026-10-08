package com.sliit.marketstore.pattern.discount;

import java.math.BigDecimal;

/**
 * Strategy interface for promotion discount calculations.
 */
public interface DiscountStrategy {
    String getType();
    BigDecimal calculateDiscount(BigDecimal originalPrice, BigDecimal discountValue);
}
