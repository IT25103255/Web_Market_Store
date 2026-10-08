package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.dto.ProductRequest;
import com.sliit.marketstore.entity.Product;
import com.sliit.marketstore.exception.BadRequestException;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.repository.CategoryRepository;
import com.sliit.marketstore.repository.CompanyRepository;
import com.sliit.marketstore.repository.ProductRepository;
import com.sliit.marketstore.service.ProductService;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {
    private final ProductRepository products;
    private final CategoryRepository categories;
    private final CompanyRepository companies;
    public ProductServiceImpl(ProductRepository products, CategoryRepository categories, CompanyRepository companies) {
        this.products = products; this.categories = categories; this.companies = companies;
    }
    public List<Product> getAll() { return products.findAll(); }
    public Product getById(Integer id) { return products.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id)); }
    public List<Product> search(String query, Integer categoryId) {
        if (categoryId != null) return products.findByCategoryId(categoryId);
        if (query != null && !query.isBlank()) return products.findByNameContainingIgnoreCase(query.trim());
        return products.findAll();
    }
    public Product create(ProductRequest request) { return products.save(fromRequest(new Product(), request)); }
    public Product update(Integer id, ProductRequest request) { return products.save(fromRequest(getById(id), request)); }
    public void delete(Integer id) { products.delete(getById(id)); }
    private Product fromRequest(Product p, ProductRequest r) {
        if (r.getName() == null || r.getName().isBlank()) throw new BadRequestException("Product name is required.");
        if (r.getPrice() == null || r.getPrice().compareTo(BigDecimal.ZERO) <= 0) throw new BadRequestException("Price must be greater than zero.");
        p.setName(r.getName().trim());
        p.setCategory(categories.findById(r.getCategoryId()).orElseThrow(() -> new BadRequestException("Select a valid category.")));
        p.setCompany(companies.findById(r.getCompanyId()).orElseThrow(() -> new BadRequestException("Select a valid company.")));
        p.setPrice(r.getPrice());
        p.setDescription(r.getDescription());
        return p;
    }
}
