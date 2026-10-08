package com.sliit.marketstore.service;
import com.sliit.marketstore.dto.ProductRequest;
import com.sliit.marketstore.entity.Product;
import java.util.List;
public interface ProductService {
    List<Product> getAll();
    Product getById(Integer id);
    List<Product> search(String query, Integer categoryId);
    Product create(ProductRequest request);
    Product update(Integer id, ProductRequest request);
    void delete(Integer id);
}
