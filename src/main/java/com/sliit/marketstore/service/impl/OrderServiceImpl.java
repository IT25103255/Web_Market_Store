package com.sliit.marketstore.service.impl;

import com.sliit.marketstore.dto.OrderCreateRequest;
import com.sliit.marketstore.dto.OrderItemRequest;
import com.sliit.marketstore.entity.Order;
import com.sliit.marketstore.entity.OrderItem;
import com.sliit.marketstore.entity.Product;
import com.sliit.marketstore.exception.BadRequestException;
import com.sliit.marketstore.exception.ResourceNotFoundException;
import com.sliit.marketstore.repository.DeliveryRepository;
import com.sliit.marketstore.repository.OrderItemRepository;
import com.sliit.marketstore.repository.OrderRepository;
import com.sliit.marketstore.repository.ProductRepository;
import com.sliit.marketstore.service.InventoryService;
import com.sliit.marketstore.service.OrderService;
import com.sliit.marketstore.service.PromotionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class OrderServiceImpl implements OrderService {
    private static final Set<String> ALLOWED_STATUS = Set.of("Pending", "Confirmed", "Completed", "Cancelled");
    private final OrderRepository orders;
    private final OrderItemRepository items;
    private final ProductRepository products;
    private final PromotionService promotions;
    private final InventoryService inventory;
    private final DeliveryRepository deliveries;

    public OrderServiceImpl(OrderRepository orders, OrderItemRepository items, ProductRepository products,
                            PromotionService promotions, InventoryService inventory, DeliveryRepository deliveries) {
        this.orders = orders; this.items = items; this.products = products; this.promotions = promotions; this.inventory = inventory; this.deliveries = deliveries;
    }

    public List<Order> getAll() { return orders.findAll(); }
    public Order getById(Integer id) { return orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id)); }
    public List<OrderItem> getItems(Integer orderId) { getById(orderId); return items.findByOrderId(orderId); }
    public List<Order> getByCustomerName(String customerName) { return orders.findByCustomerNameIgnoreCaseOrderByOrderDateDesc(customerName); }

    @Transactional
    public Order create(OrderCreateRequest request) {
        if (request.getCustomerName() == null || request.getCustomerName().isBlank()) throw new BadRequestException("Customer name is required.");
        if (request.getItems() == null || request.getItems().isEmpty()) throw new BadRequestException("Add at least one product to the order.");

        Order order = new Order();
        order.setCustomerName(request.getCustomerName().trim());
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("Pending");
        order.setTotalAmount(BigDecimal.ZERO);
        order = orders.save(order);

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest r : request.getItems()) {
            if (r.getProductId() == null || r.getQuantity() == null || r.getQuantity() <= 0) throw new BadRequestException("Each item needs a valid product and quantity.");
            Product p = products.findById(r.getProductId()).orElseThrow(() -> new BadRequestException("Product not found: " + r.getProductId()));
            inventory.consumeStock(p.getId(), r.getQuantity());
            BigDecimal unitPrice = promotions.getEffectivePrice(p.getId());
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(r.getQuantity()));
            OrderItem item = new OrderItem(); item.setOrder(order); item.setProduct(p); item.setQuantity(r.getQuantity()); item.setUnitPrice(unitPrice); item.setSubtotal(subtotal);
            items.save(item); total = total.add(subtotal);
        }
        order.setTotalAmount(total);
        return orders.save(order);
    }

    public Order updateStatus(Integer id, String status) {
        if (status == null) throw new BadRequestException("Status is required.");
        String normalized = ALLOWED_STATUS.stream().filter(s -> s.equalsIgnoreCase(status)).findFirst().orElseThrow(() -> new BadRequestException("Invalid order status."));
        Order order = getById(id); order.setStatus(normalized); return orders.save(order);
    }

    @Transactional
    public void delete(Integer id) {
        Order order = getById(id);
        if (deliveries.existsByOrderId(id)) throw new BadRequestException("Delete the linked delivery first.");
        items.deleteByOrderId(id);
        orders.delete(order);
    }
}
