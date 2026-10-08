package com.sliit.marketstore.service;
import com.sliit.marketstore.dto.OrderCreateRequest;
import com.sliit.marketstore.entity.Order;
import com.sliit.marketstore.entity.OrderItem;
import java.util.List;
public interface OrderService {
    List<Order> getAll();
    Order getById(Integer id);
    List<OrderItem> getItems(Integer orderId);
    List<Order> getByCustomerName(String customerName);
    Order create(OrderCreateRequest request);
    Order updateStatus(Integer id, String status);
    void delete(Integer id);
}
