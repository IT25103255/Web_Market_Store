package com.sliit.marketstore.controller;

import com.sliit.marketstore.dto.DeliveryRequest;
import com.sliit.marketstore.entity.Delivery;
import com.sliit.marketstore.service.DeliveryService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/deliveries")
public class DeliveryController {
    private final DeliveryService service;
    public DeliveryController(DeliveryService service) { this.service = service; }
    @GetMapping public List<Delivery> all() { return service.getAll(); }
    @GetMapping("/{id}") public Delivery one(@PathVariable Integer id) { return service.getById(id); }
    @GetMapping("/order/{orderId}") public Delivery byOrder(@PathVariable Integer orderId) { return service.getByOrderId(orderId); }
    @PostMapping public Delivery add(@RequestBody DeliveryRequest r) { return service.save(r); }
    @PutMapping("/{id}") public Delivery update(@PathVariable Integer id, @RequestBody DeliveryRequest r) { return service.update(id, r); }
    @PutMapping("/{id}/status") public Delivery status(@PathVariable Integer id, @RequestBody Map<String,String> body) { return service.updateStatus(id, body.get("status")); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
