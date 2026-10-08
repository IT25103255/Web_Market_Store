package com.sliit.marketstore.repository;

import com.sliit.marketstore.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    List<Promotion> findByProductIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Integer productId, LocalDate startDate, LocalDate endDate);

    List<Promotion> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDate startDate, LocalDate endDate);
}
