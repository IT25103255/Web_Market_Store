package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.dto.InventoryRequest;
import com.sliit.marketstore.entity.Inventory;
import com.sliit.marketstore.exception.BadRequestException;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.repository.InventoryRepository;
import com.sliit.marketstore.repository.ProductRepository;
import com.sliit.marketstore.service.InventoryService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class InventoryServiceImpl implements InventoryService {
    private final InventoryRepository inventory;
    private final ProductRepository products;
    public InventoryServiceImpl(InventoryRepository inventory, ProductRepository products) { this.inventory = inventory; this.products = products; }
    public List<Inventory> getAll() { return inventory.findAll(); }
    public Inventory getById(Integer id) { return inventory.findById(id).orElseThrow(() -> new ResourceNotFoundException("Inventory record not found: " + id)); }
    public Inventory getByProductId(Integer productId) { return inventory.findByProductId(productId).orElse(null); }
    public Inventory save(InventoryRequest r) {
        if (r.getQuantity() == null || r.getQuantity() < 0) throw new BadRequestException("Quantity cannot be negative.");
        if (inventory.findByProductId(r.getProductId()).isPresent()) throw new BadRequestException("Inventory already exists for this product. Edit it instead.");
        Inventory i = new Inventory(); return inventory.save(apply(i, r));
    }
    public Inventory update(Integer id, InventoryRequest r) { return inventory.save(apply(getById(id), r)); }
    public void delete(Integer id) { inventory.delete(getById(id)); }
    public String calculateStatus(int q) { if (q == 0) return "Out of Stock"; if (q <= 5) return "Low Stock"; return "In Stock"; }
    public void consumeStock(Integer productId, int qty) {
        Inventory i = inventory.findByProductId(productId).orElseThrow(() -> new BadRequestException("No inventory record for product."));
        if (qty <= 0) throw new BadRequestException("Quantity must be greater than zero.");
        if (i.getQuantity() < qty) throw new BadRequestException("Not enough stock for " + i.getProduct().getName() + ".");
        i.setQuantity(i.getQuantity() - qty); i.setStatus(calculateStatus(i.getQuantity())); inventory.save(i);
    }
    private Inventory apply(Inventory i, InventoryRequest r) {
        if (r.getQuantity() == null || r.getQuantity() < 0) throw new BadRequestException("Quantity cannot be negative.");
        i.setProduct(products.findById(r.getProductId()).orElseThrow(() -> new BadRequestException("Select a valid product.")));
        i.setQuantity(r.getQuantity()); i.setStatus(calculateStatus(r.getQuantity())); return i;
    }
}
