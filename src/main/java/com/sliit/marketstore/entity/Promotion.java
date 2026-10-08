package com.sliit.marketstore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;

@Entity
@Table(name = "Promotions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Promotion {
    private static final String META_SEPARATOR = "|";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PromotionID")
    private Integer id;

    @NotBlank
    @Column(name = "PromotionName", nullable = false, length = 100)
    private String name;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "ProductID")
    private Product product;

    /**
     * Legacy database column retained for full compatibility with the submitted schema.
     * It stores the numeric discount value. The Strategy Pattern decides whether the
     * value is interpreted as a percentage or a fixed LKR amount.
     */
    @DecimalMin("0.01")
    @Column(name = "DiscountPercentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "StartDate")
    private LocalDate startDate;
    @Column(name = "EndDate")
    private LocalDate endDate;

    /**
     * Backward-compatible metadata storage. Existing rows containing only Active/Inactive
     * are treated as percentage promotions. New rows are stored as Active|PERCENTAGE or
     * Active|FIXED while the public getStatus() still returns only Active/Inactive.
     * This avoids any database ALTER TABLE requirement on presentation laptops.
     */
    @Column(name = "Status", length = 30)
    private String statusMetadata;

    public Promotion() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    /** Legacy JSON property retained for the old frontend/API. */
    public BigDecimal getDiscountPercentage() {
        return "PERCENTAGE".equals(getDiscountType()) ? discountValue : null;
    }
    public void setDiscountPercentage(BigDecimal discountPercentage) { this.discountValue = discountPercentage; }

    @Transient
    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }

    @Transient
    public String getDiscountType() {
        if (statusMetadata == null) return "PERCENTAGE";
        int split = statusMetadata.indexOf(META_SEPARATOR);
        if (split < 0 || split == statusMetadata.length() - 1) return "PERCENTAGE";
        String type = statusMetadata.substring(split + 1).trim().toUpperCase(Locale.ROOT);
        return type.equals("FIXED") ? "FIXED" : "PERCENTAGE";
    }

    public void setDiscountType(String discountType) {
        String normalized = discountType != null && discountType.equalsIgnoreCase("FIXED") ? "FIXED" : "PERCENTAGE";
        String baseStatus = getStatus();
        if (baseStatus == null || baseStatus.isBlank()) baseStatus = "Inactive";
        this.statusMetadata = baseStatus + META_SEPARATOR + normalized;
    }

    @Transient
    public String getDiscountLabel() {
        if (discountValue == null) return "";
        if ("FIXED".equals(getDiscountType())) {
            return "Rs. " + discountValue.stripTrailingZeros().toPlainString() + " OFF";
        }
        return discountValue.stripTrailingZeros().toPlainString() + "% OFF";
    }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() {
        if (statusMetadata == null) return null;
        int split = statusMetadata.indexOf(META_SEPARATOR);
        return split < 0 ? statusMetadata : statusMetadata.substring(0, split);
    }

    public void setStatus(String status) {
        String type = getDiscountType();
        String baseStatus = status == null ? null : status.trim();
        this.statusMetadata = baseStatus == null ? null : baseStatus + META_SEPARATOR + type;
    }
}
