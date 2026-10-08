package com.sliit.marketstore.controller;

import com.sliit.marketstore.dto.DeliveryRequest;
import com.sliit.marketstore.dto.OrderCreateRequest;
import com.sliit.marketstore.entity.Inventory;
import com.sliit.marketstore.entity.Product;
import com.sliit.marketstore.entity.Promotion;
import com.sliit.marketstore.service.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/store")
public class StoreController {
    private final ProductService products;
    private final CategoryService categories;
    private final InventoryService inventory;
    private final PromotionService promotions;
    private final OrderService orders;
    private final DeliveryService deliveries;

    public StoreController(ProductService products, CategoryService categories, InventoryService inventory,
                           PromotionService promotions, OrderService orders, DeliveryService deliveries) {
        this.products = products; this.categories = categories; this.inventory = inventory;
        this.promotions = promotions; this.orders = orders; this.deliveries = deliveries;
    }

    @GetMapping("/categories") public Object categories() { return categories.getAll(); }

    @GetMapping("/products")
    public List<Map<String,Object>> products(@RequestParam(required=false) String q, @RequestParam(required=false) Integer categoryId) {
        return products.search(q, categoryId).stream().map(this::storeProduct).toList();
    }

    @GetMapping("/products/{id}") public Map<String,Object> product(@PathVariable Integer id) { return storeProduct(products.getById(id)); }

    @GetMapping("/offers")
    public List<Map<String,Object>> offers() {
        LinkedHashMap<Integer, Map<String,Object>> unique = new LinkedHashMap<>();
        for (Promotion p : promotions.getCurrentOffers()) unique.put(p.getProduct().getId(), storeProduct(p.getProduct()));
        return new ArrayList<>(unique.values());
    }

    @PostMapping("/checkout")
    public Map<String,Object> checkout(@RequestBody OrderCreateRequest request) {
        var order = orders.create(request);
        if (request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank()) {
            DeliveryRequest d = new DeliveryRequest(); d.setOrderId(order.getId()); d.setDeliveryAddress(request.getDeliveryAddress()); d.setDeliveryStatus("Preparing"); deliveries.save(d);
        }
        Map<String,Object> result = new LinkedHashMap<>(); result.put("order", order); result.put("items", orders.getItems(order.getId())); result.put("delivery", deliveries.getByOrderId(order.getId())); return result;
    }

    private Map<String,Object> storeProduct(Product p) {
        Map<String,Object> m = new LinkedHashMap<>();
        Inventory inv = inventory.getByProductId(p.getId());
        Promotion promo = promotions.getActivePromotion(p.getId());
        BigDecimal effective = promotions.getEffectivePrice(p.getId());
        m.put("id", p.getId()); m.put("name", p.getName()); m.put("description", p.getDescription());
        m.put("price", p.getPrice()); m.put("effectivePrice", effective);
        m.put("category", p.getCategory()); m.put("company", p.getCompany());
        m.put("quantity", inv == null ? 0 : inv.getQuantity()); m.put("stockStatus", inv == null ? "Out of Stock" : inv.getStatus());
        m.put("promotion", promo); m.put("onPromotion", promo != null);
        m.put("discountType", promo == null ? null : promo.getDiscountType());
        m.put("discountValue", promo == null ? BigDecimal.ZERO : promo.getDiscountValue());
        m.put("discountLabel", promo == null ? "" : promo.getDiscountLabel());
        m.put("discountPercentage", promo == null || !"PERCENTAGE".equals(promo.getDiscountType()) ? BigDecimal.ZERO : promo.getDiscountValue());
        return m;
    }
}
