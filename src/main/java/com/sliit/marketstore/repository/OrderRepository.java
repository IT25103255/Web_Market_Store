package com.sliit.marketstore.repository;

import com.sliit.marketstore.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByCustomerNameIgnoreCaseOrderByOrderDateDesc(String customerName);
}
