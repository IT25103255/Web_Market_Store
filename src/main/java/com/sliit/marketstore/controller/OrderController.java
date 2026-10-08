package com.sliit.marketstore.controller;

import com.sliit.marketstore.dto.OrderCreateRequest;
import com.sliit.marketstore.entity.Order;
import com.sliit.marketstore.service.DeliveryService;
import com.sliit.marketstore.service.OrderService;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/orders")
public class OrderController {
    private final OrderService service;
    private final DeliveryService deliveries;
    public OrderController(OrderService service, DeliveryService deliveries) { this.service = service; this.deliveries = deliveries; }
    @GetMapping public List<Order> all(@RequestParam(required=false) String customerName) { return customerName == null ? service.getAll() : service.getByCustomerName(customerName); }
    @GetMapping("/{id}") public Map<String,Object> one(@PathVariable Integer id) {
        Map<String,Object> result = new LinkedHashMap<>(); result.put("order", service.getById(id)); result.put("items", service.getItems(id)); result.put("delivery", deliveries.getByOrderId(id)); return result;
    }
    @PostMapping public Order create(@RequestBody OrderCreateRequest r) { return service.create(r); }
    @PutMapping("/{id}/status") public Order status(@PathVariable Integer id, @RequestBody Map<String,String> body) { return service.updateStatus(id, body.get("status")); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
