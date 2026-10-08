package com.sliit.marketstore.pattern.discount;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class DiscountStrategyTest {
    private final DiscountContext context = new DiscountContext();

    @Test
    void percentageStrategyCalculatesEffectivePrice() {
        assertEquals(new BigDecimal("9000.00"),
                context.calculateEffectivePrice(new BigDecimal("10000.00"), "PERCENTAGE", new BigDecimal("10.00")));
    }

    @Test
    void fixedStrategyCalculatesEffectivePrice() {
        assertEquals(new BigDecimal("9500.00"),
                context.calculateEffectivePrice(new BigDecimal("10000.00"), "FIXED", new BigDecimal("500.00")));
    }

    @Test
    void fixedDiscountNeverCreatesNegativePrice() {
        assertEquals(new BigDecimal("0.00"),
                context.calculateEffectivePrice(new BigDecimal("100.00"), "FIXED", new BigDecimal("500.00")));
    }
}
