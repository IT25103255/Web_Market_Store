package com.sliit.marketstore.controller;

import com.sliit.marketstore.dto.ProductRequest;
import com.sliit.marketstore.entity.Product;
import com.sliit.marketstore.service.ProductService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service = service; }
    @GetMapping public List<Product> all(@RequestParam(required=false) String q, @RequestParam(required=false) Integer categoryId) { return service.search(q, categoryId); }
    @GetMapping("/{id}") public Product one(@PathVariable Integer id) { return service.getById(id); }
    @PostMapping public Product add(@RequestBody ProductRequest request) { return service.create(request); }
    @PutMapping("/{id}") public Product update(@PathVariable Integer id, @RequestBody ProductRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
