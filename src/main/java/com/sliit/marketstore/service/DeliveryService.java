package com.sliit.marketstore.service;
import com.sliit.marketstore.dto.DeliveryRequest;
import com.sliit.marketstore.entity.Delivery;
import java.util.List;
public interface DeliveryService {
    List<Delivery> getAll();
    Delivery getById(Integer id);
    Delivery getByOrderId(Integer orderId);
    Delivery save(DeliveryRequest request);
    Delivery update(Integer id, DeliveryRequest request);
    Delivery updateStatus(Integer id, String status);
    void delete(Integer id);
}
