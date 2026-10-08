package com.sliit.marketstore.controller;

import com.sliit.marketstore.entity.Category;
import com.sliit.marketstore.service.CategoryService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService service;
    public CategoryController(CategoryService service) { this.service = service; }
    @GetMapping public List<Category> all() { return service.getAll(); }
    @GetMapping("/{id}") public Category one(@PathVariable Integer id) { return service.getById(id); }
    @PostMapping public Category add(@RequestBody Category category) { return service.save(category); }
    @PutMapping("/{id}") public Category update(@PathVariable Integer id, @RequestBody Category category) { return service.update(id, category); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Integer id) { service.delete(id); }
}
