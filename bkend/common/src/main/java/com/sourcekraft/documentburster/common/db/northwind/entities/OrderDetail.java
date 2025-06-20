package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.math.BigDecimal;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;


/**
 * Represents an order line item in the Northwind database. Each OrderDetail
 * represents a single product within an order.
 */
@Entity
@Table(name = "\"Order Details\"")
@IdClass(OrderDetailId.class)
public class OrderDetail {

    @Id
    @Column(name = "\"OrderID\"", nullable = false)
    private Integer orderId;

    @Id
    @Column(name = "\"ProductID\"", nullable = false)
    private Integer productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"OrderID\"", insertable = false, updatable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"ProductID\"", insertable = false, updatable = false)
    private Product product;

    @Column(name = "\"UnitPrice\"", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "\"Quantity\"", nullable = false)
    private Short quantity;

    @Column(name = "\"Discount\"", nullable = false, precision = 8, scale = 4)
    private BigDecimal discount;

    /**
     * Default constructor required by JPA
     */
    public OrderDetail() {
        this.quantity = 1;
        this.discount = BigDecimal.ZERO;
    }

    /**
     * Create an order detail with essential information
     */
    public OrderDetail(Order order, Product product, BigDecimal unitPrice, Short quantity) {
        this.order = order;
        this.product = product;
        this.orderId = order.getOrderId();
        this.productId = product.getProductId();
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.discount = BigDecimal.ZERO;
    }

    // Getters and setters
    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
        if (order != null) {
            this.orderId = order.getOrderId();
        }
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
        if (product != null) {
            this.productId = product.getProductId();
        }
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Short getQuantity() {
        return quantity;
    }

    public void setQuantity(Short quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    /**
     * Calculate the line total (unit price * quantity - discount)
     * 
     * @return Total cost for this line item
     */
    public BigDecimal getLineTotal() {
        BigDecimal total = unitPrice.multiply(new BigDecimal(quantity));
        BigDecimal discountAmount = total.multiply(discount);
        return total.subtract(discountAmount);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        OrderDetail that = (OrderDetail) o;
        return Objects.equals(orderId, that.orderId) && Objects.equals(productId, that.productId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(orderId, productId);
    }

    @Override
    public String toString() {
        return "OrderDetail{" + "orderId=" + orderId + ", productId=" + productId + ", product="
                + (product != null ? product.getProductName() : null) + ", quantity=" + quantity + ", unitPrice="
                + unitPrice + '}';
    }
}

/**
 * Composite primary key class for OrderDetail
 */
class OrderDetailId implements java.io.Serializable {
    /**
     * 
     */
    private static final long serialVersionUID = 4736898711378422778L;
    private Integer orderId;
    private Integer productId;

    public OrderDetailId() {
    }

    public OrderDetailId(Integer orderId, Integer productId) {
        this.orderId = orderId;
        this.productId = productId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        OrderDetailId that = (OrderDetailId) o;
        return Objects.equals(orderId, that.orderId) && Objects.equals(productId, that.productId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(orderId, productId);
    }
}