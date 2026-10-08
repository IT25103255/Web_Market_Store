package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.entity.Category;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.repository.CategoryRepository;
import com.sliit.marketstore.service.CategoryService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository repository;
    public CategoryServiceImpl(CategoryRepository repository) { this.repository = repository; }
    public List<Category> getAll() { return repository.findAll(); }
    public Category getById(Integer id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id)); }
    public Category save(Category category) { category.setId(null); return repository.save(category); }
    public Category update(Integer id, Category category) { Category existing = getById(id); existing.setName(category.getName()); return repository.save(existing); }
    public void delete(Integer id) { repository.delete(getById(id)); }
}
