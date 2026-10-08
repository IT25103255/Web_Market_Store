package com.sliit.marketstore.controller;

import com.sliit.marketstore.repository.*;
import com.sliit.marketstore.service.PromotionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminSummaryController {
    private final CategoryRepository categories;
    private final CompanyRepository companies;
    private final ProductRepository products;
    private final InventoryRepository inventory;
    private final PromotionService promotions;
    private final OrderRepository orders;
    private final DeliveryRepository deliveries;
    private final UserRepository users;

    public AdminSummaryController(CategoryRepository categories, CompanyRepository companies, ProductRepository products,
                                  InventoryRepository inventory, PromotionService promotions, OrderRepository orders,
                                  DeliveryRepository deliveries, UserRepository users) {
        this.categories = categories;
        this.companies = companies;
        this.products = products;
        this.inventory = inventory;
        this.promotions = promotions;
        this.orders = orders;
        this.deliveries = deliveries;
        this.users = users;
    }

    @GetMapping("/summary")
    public Map<String, Long> summary() {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put("categories", categories.count());
        m.put("companies", companies.count());
        m.put("products", products.count());
        m.put("inventory", inventory.count());
        m.put("activePromotions", (long) promotions.getCurrentOffers().size());
        m.put("orders", orders.count());
        m.put("deliveries", deliveries.count());
        m.put("users", users.count());
        return m;
    }
}
