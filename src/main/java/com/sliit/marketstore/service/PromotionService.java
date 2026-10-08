package com.sliit.marketstore.service;

import com.sliit.marketstore.dto.PromotionRequest;
import com.sliit.marketstore.entity.Promotion;
import java.math.BigDecimal;
import java.util.List;

public interface PromotionService {
    List<Promotion> getAll();
    Promotion getById(Integer id);
    Promotion save(PromotionRequest request);
    Promotion update(Integer id, PromotionRequest request);
    void delete(Integer id);
    Promotion getActivePromotion(Integer productId);
    BigDecimal getEffectivePrice(Integer productId);
    List<Promotion> getCurrentOffers();
    String getAppliedStrategy(Integer productId);
}
