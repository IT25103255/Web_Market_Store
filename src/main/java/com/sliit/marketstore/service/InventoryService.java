package com.sliit.marketstore.service;
import com.sliit.marketstore.dto.InventoryRequest;
import com.sliit.marketstore.entity.Inventory;
import java.util.List;
public interface InventoryService {
    List<Inventory> getAll();
    Inventory getById(Integer id);
    Inventory getByProductId(Integer productId);
    Inventory save(InventoryRequest request);
    Inventory update(Integer id, InventoryRequest request);
    void delete(Integer id);
    String calculateStatus(int quantity);
    void consumeStock(Integer productId, int quantity);
}
