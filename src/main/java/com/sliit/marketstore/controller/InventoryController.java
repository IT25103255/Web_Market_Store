package com.sliit.marketstore.controller;

import com.sliit.marketstore.dto.InventoryRequest;
import com.sliit.marketstore.entity.Inventory;
import com.sliit.marketstore.service.InventoryService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService service;
    public InventoryController(InventoryService service) { this.service = service; }
    @GetMapping public List<Inventory> all() { return service.getAll(); }
    @GetMapping("/{id}") public Inventory one(@PathVariable Integer id) { return service.getById(id); }
    @GetMapping("/product/{productId}") public Inventory byProduct(@PathVariable Integer productId) { return service.getByProductId(productId); }
    @PostMapping public Inventory add(@RequestBody InventoryRequest r) { return service.save(r); }
    @PutMapping("/{id}") public Inventory update(@PathVariable Integer id, @RequestBody InventoryRequest r) { return service.update(id, r); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
