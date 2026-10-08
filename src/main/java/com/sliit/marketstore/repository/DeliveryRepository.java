package com.sliit.marketstore.repository;

import com.sliit.marketstore.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, Integer> {
    Optional<Delivery> findByOrderId(Integer orderId);
    boolean existsByOrderId(Integer orderId);
}
