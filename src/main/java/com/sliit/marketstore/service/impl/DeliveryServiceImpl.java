package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.dto.DeliveryRequest;
import com.sliit.marketstore.entity.Delivery;
import com.sliit.marketstore.exception.BadRequestException;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.repository.DeliveryRepository;
import com.sliit.marketstore.repository.OrderRepository;
import com.sliit.marketstore.service.DeliveryService;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;

@Service
public class DeliveryServiceImpl implements DeliveryService {
    private static final Set<String> ALLOWED = Set.of("Preparing", "Shipped", "Delivered");
    private final DeliveryRepository deliveries;
    private final OrderRepository orders;
    public DeliveryServiceImpl(DeliveryRepository deliveries, OrderRepository orders) { this.deliveries = deliveries; this.orders = orders; }
    public List<Delivery> getAll() { return deliveries.findAll(); }
    public Delivery getById(Integer id) { return deliveries.findById(id).orElseThrow(() -> new ResourceNotFoundException("Delivery not found: " + id)); }
    public Delivery getByOrderId(Integer orderId) { return deliveries.findByOrderId(orderId).orElse(null); }
    public Delivery save(DeliveryRequest request) {
        if (deliveries.findByOrderId(request.getOrderId()).isPresent()) throw new BadRequestException("This order already has a delivery.");
        return deliveries.save(apply(new Delivery(), request));
    }
    public Delivery update(Integer id, DeliveryRequest request) { return deliveries.save(apply(getById(id), request)); }
    public Delivery updateStatus(Integer id, String status) {
        Delivery d = getById(id); d.setDeliveryStatus(validStatus(status)); return deliveries.save(d);
    }
    public void delete(Integer id) { deliveries.delete(getById(id)); }
    private Delivery apply(Delivery d, DeliveryRequest r) {
        if (r.getOrderId() == null) throw new BadRequestException("Select an order.");
        if (r.getDeliveryAddress() == null || r.getDeliveryAddress().isBlank()) throw new BadRequestException("Delivery address is required.");
        d.setOrder(orders.findById(r.getOrderId()).orElseThrow(() -> new BadRequestException("Select a valid order.")));
        d.setDeliveryAddress(r.getDeliveryAddress().trim());
        d.setDeliveryStatus(validStatus(r.getDeliveryStatus() == null ? "Preparing" : r.getDeliveryStatus()));
        return d;
    }
    private String validStatus(String status) {
        return ALLOWED.stream().filter(s -> s.equalsIgnoreCase(status)).findFirst().orElseThrow(() -> new BadRequestException("Invalid delivery status."));
    }
}
