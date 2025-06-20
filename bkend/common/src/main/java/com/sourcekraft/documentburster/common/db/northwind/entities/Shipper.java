package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Represents a shipping company in the Northwind database. Shippers are
 * responsible for delivering orders to customers.
 */
@Entity
@Table(name = "\"Shippers\"")
public class Shipper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"ShipperID\"")
    private Integer shipperId;

    @Column(name = "\"CompanyName\"", length = 40, nullable = false)
    private String companyName;

    @Column(name = "\"Phone\"", length = 24)
    private String phone;

    @OneToMany(mappedBy = "shipper", fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    /**
     * Default constructor required by JPA
     */
    public Shipper() {
    }

    /**
     * Create a shipper with company name and phone
     */
    public Shipper(String companyName, String phone) {
        this.companyName = companyName;
        this.phone = phone;
    }

    // Getters and setters
    public Integer getShipperId() {
        return shipperId;
    }

    public void setShipperId(Integer shipperId) {
        this.shipperId = shipperId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public List<Order> getOrders() {
        return orders;
    }

    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }

    /**
     * Add an order to this shipper
     */
    public void addOrder(Order order) {
        orders.add(order);
        order.setShipper(this);
    }

    /**
     * Remove an order from this shipper
     */
    public void removeOrder(Order order) {
        orders.remove(order);
        order.setShipper(null);
    }

    /**
     * Count the number of orders handled by this shipper
     */
    public int getOrderCount() {
        return orders.size();
    }

    /**
     * Count the number of shipped orders
     */
    public int getShippedOrderCount() {
        return (int) orders.stream().filter(Order::isShipped).count();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Shipper shipper = (Shipper) o;
        return Objects.equals(shipperId, shipper.shipperId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(shipperId);
    }

    @Override
    public String toString() {
        return "Shipper{" + "shipperId=" + shipperId + ", companyName='" + companyName + '\'' + ", phone='" + phone
                + '\'' + ", orderCount=" + getOrderCount() + '}';
    }
}