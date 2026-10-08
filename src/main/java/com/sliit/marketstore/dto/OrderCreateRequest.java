package com.sliit.marketstore.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderCreateRequest {
    private String customerName;
    private String deliveryAddress;
    private List<OrderItemRequest> items = new ArrayList<>();

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
