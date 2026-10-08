package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.dto.PromotionRequest;
import com.sliit.marketstore.entity.Product;
import com.sliit.marketstore.entity.Promotion;
import com.sliit.marketstore.exception.BadRequestException;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.pattern.discount.DiscountContext;
import com.sliit.marketstore.repository.ProductRepository;
import com.sliit.marketstore.repository.PromotionRepository;
import com.sliit.marketstore.service.PromotionService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class PromotionServiceImpl implements PromotionService {
    private static final BigDecimal MAX_LEGACY_FIXED_VALUE = new BigDecimal("999.99");

    private final PromotionRepository promotions;
    private final ProductRepository products;
    private final DiscountContext discountContext = new DiscountContext();

    public PromotionServiceImpl(PromotionRepository promotions, ProductRepository products) {
        this.promotions = promotions;
        this.products = products;
    }

    public List<Promotion> getAll() { return promotions.findAll(); }

    public Promotion getById(Integer id) {
        return promotions.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found: " + id));
    }

    public Promotion save(PromotionRequest request) {
        return promotions.save(apply(new Promotion(), request));
    }

    public Promotion update(Integer id, PromotionRequest request) {
        return promotions.save(apply(getById(id), request));
    }

    public void delete(Integer id) { promotions.delete(getById(id)); }

    public Promotion getActivePromotion(Integer productId) {
        Product product = products.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        LocalDate now = LocalDate.now();
        return promotions.findByProductIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(productId, now, now)
                .stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .min(Comparator.comparing(p -> calculateEffectivePrice(product, p)))
                .orElse(null);
    }

    public BigDecimal getEffectivePrice(Integer productId) {
        Product product = products.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        Promotion promotion = getActivePromotion(productId);
        return promotion == null
                ? product.getPrice().setScale(2, RoundingMode.HALF_UP)
                : calculateEffectivePrice(product, promotion);
    }

    public List<Promotion> getCurrentOffers() {
        LocalDate now = LocalDate.now();
        return promotions.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(now, now)
                .stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .toList();
    }

    public String getAppliedStrategy(Integer productId) {
        Promotion promotion = getActivePromotion(productId);
        return promotion == null ? "NoDiscountStrategy" : discountContext.strategyName(promotion.getDiscountType());
    }

    private BigDecimal calculateEffectivePrice(Product product, Promotion promotion) {
        return discountContext.calculateEffectivePrice(
                product.getPrice(),
                promotion.getDiscountType(),
                promotion.getDiscountValue());
    }

    private Promotion apply(Promotion promotion, PromotionRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Promotion name is required.");
        }
        if (request.getProductId() == null) {
            throw new BadRequestException("Select a valid product.");
        }
        Product product = products.findById(request.getProductId())
                .orElseThrow(() -> new BadRequestException("Select a valid product."));

        String requestedType = request.getDiscountType();
        String type = requestedType == null || requestedType.isBlank()
                ? promotion.getDiscountType()
                : normalizeType(requestedType);

        BigDecimal value = request.getDiscountValue() != null
                ? request.getDiscountValue()
                : request.getDiscountPercentage();
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Discount value must be greater than zero.");
        }

        if ("PERCENTAGE".equals(type) && value.compareTo(new BigDecimal("100")) > 0) {
            throw new BadRequestException("Percentage discount must be between 0 and 100.");
        }
        if ("FIXED".equals(type)) {
            if (value.compareTo(MAX_LEGACY_FIXED_VALUE) > 0) {
                throw new BadRequestException("Fixed discount must be Rs. 999.99 or less with the current project database schema.");
            }
            if (value.compareTo(product.getPrice()) > 0) {
                throw new BadRequestException("Fixed discount cannot be greater than the product price.");
            }
        }

        if (request.getStartDate() == null || request.getEndDate() == null || request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Enter a valid promotion date range.");
        }
        String status = request.getStatus() == null ? "Inactive" : request.getStatus();
        if (!status.equalsIgnoreCase("Active") && !status.equalsIgnoreCase("Inactive")) {
            throw new BadRequestException("Status must be Active or Inactive.");
        }

        promotion.setName(request.getName().trim());
        promotion.setProduct(product);
        promotion.setDiscountValue(value.setScale(2, RoundingMode.HALF_UP));
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setStatus(status.equalsIgnoreCase("Active") ? "Active" : "Inactive");
        promotion.setDiscountType(type);
        return promotion;
    }

    private String normalizeType(String type) {
        try {
            return discountContext.normalizeType(type);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Discount type must be PERCENTAGE or FIXED.");
        }
    }
}
