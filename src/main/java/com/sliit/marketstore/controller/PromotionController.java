package com.sliit.marketstore.controller;

import com.sliit.marketstore.dto.PromotionRequest;
import com.sliit.marketstore.entity.Promotion;
import com.sliit.marketstore.service.PromotionService;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {
    private final PromotionService service;
    public PromotionController(PromotionService service) { this.service = service; }

    @GetMapping public List<Promotion> all() { return service.getAll(); }
    @GetMapping("/{id}") public Promotion one(@PathVariable Integer id) { return service.getById(id); }
    @GetMapping("/active/{productId}") public Promotion active(@PathVariable Integer productId) { return service.getActivePromotion(productId); }
    @GetMapping("/price/{productId}") public BigDecimal effectivePrice(@PathVariable Integer productId) { return service.getEffectivePrice(productId); }
    @GetMapping("/strategy/{productId}") public Map<String, String> strategy(@PathVariable Integer productId) {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("pattern", "Strategy Pattern");
        info.put("strategy", service.getAppliedStrategy(productId));
        return info;
    }
    @PostMapping public Promotion add(@RequestBody PromotionRequest r) { return service.save(r); }
    @PutMapping("/{id}") public Promotion update(@PathVariable Integer id, @RequestBody PromotionRequest r) { return service.update(id, r); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
