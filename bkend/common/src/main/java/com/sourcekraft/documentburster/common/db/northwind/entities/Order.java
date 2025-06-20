package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Represents a customer order in the Northwind database. Orders contain
 * products purchased by customers.
 */
@Entity
@Table(name = "\"Orders\"")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"OrderID\"")
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"CustomerID\"")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"EmployeeID\"")
    private Employee employee;

    @Column(name = "\"OrderDate\"")
    private LocalDateTime orderDate;

    @Column(name = "\"RequiredDate\"")
    private LocalDateTime requiredDate;

    @Column(name = "\"ShippedDate\"")
    private LocalDateTime shippedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"ShipVia\"")
    private Shipper shipper;

    @Column(name = "\"Freight\"", precision = 19, scale = 4)
    private BigDecimal freight;

    @Column(name = "\"ShipName\"", length = 40)
    private String shipName;

    @Column(name = "\"ShipAddress\"", length = 60)
    private String shipAddress;

    @Column(name = "\"ShipCity\"", length = 15)
    private String shipCity;

    @Column(name = "\"ShipRegion\"", length = 15)
    private String shipRegion;

    @Column(name = "\"ShipPostalCode\"", length = 10)
    private String shipPostalCode;

    @Column(name = "\"ShipCountry\"", length = 15)
    private String shipCountry;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderDetail> orderDetails = new ArrayList<>();

    /**
     * Default constructor required by JPA
     */
    public Order() {
        this.orderDate = LocalDateTime.now();
        this.freight = BigDecimal.ZERO;
    }

    /**
     * Create an order with customer and employee
     */
    public Order(Customer customer, Employee employee) {
        this();
        this.customer = customer;
        this.employee = employee;
        if (customer != null) {
            this.shipName = customer.getCompanyName();
            this.shipAddress = customer.getAddress();
            this.shipCity = customer.getCity();
            this.shipRegion = customer.getRegion();
            this.shipPostalCode = customer.getPostalCode();
            this.shipCountry = customer.getCountry();
        }
    }

    // Getters and setters
    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDateTime getRequiredDate() {
        return requiredDate;
    }

    public void setRequiredDate(LocalDateTime requiredDate) {
        this.requiredDate = requiredDate;
    }

    public LocalDateTime getShippedDate() {
        return shippedDate;
    }

    public void setShippedDate(LocalDateTime shippedDate) {
        this.shippedDate = shippedDate;
    }

    public Shipper getShipper() {
        return shipper;
    }

    public void setShipper(Shipper shipper) {
        this.shipper = shipper;
    }

    public BigDecimal getFreight() {
        return freight;
    }

    public void setFreight(BigDecimal freight) {
        this.freight = freight;
    }

    public String getShipName() {
        return shipName;
    }

    public void setShipName(String shipName) {
        this.shipName = shipName;
    }

    public String getShipAddress() {
        return shipAddress;
    }

    public void setShipAddress(String shipAddress) {
        this.shipAddress = shipAddress;
    }

    public String getShipCity() {
        return shipCity;
    }

    public void setShipCity(String shipCity) {
        this.shipCity = shipCity;
    }

    public String getShipRegion() {
        return shipRegion;
    }

    public void setShipRegion(String shipRegion) {
        this.shipRegion = shipRegion;
    }

    public String getShipPostalCode() {
        return shipPostalCode;
    }

    public void setShipPostalCode(String shipPostalCode) {
        this.shipPostalCode = shipPostalCode;
    }

    public String getShipCountry() {
        return shipCountry;
    }

    public void setShipCountry(String shipCountry) {
        this.shipCountry = shipCountry;
    }

    public List<OrderDetail> getOrderDetails() {
        return orderDetails;
    }

    public void setOrderDetails(List<OrderDetail> orderDetails) {
        this.orderDetails = orderDetails;
    }

    /**
     * Add an order detail to this order
     */
    public void addOrderDetail(OrderDetail orderDetail) {
        orderDetails.add(orderDetail);
        orderDetail.setOrder(this);
    }

    /**
     * Remove an order detail from this order
     */
    public void removeOrderDetail(OrderDetail orderDetail) {
        orderDetails.remove(orderDetail);
        orderDetail.setOrder(null);
    }

    /**
     * Add a product to this order
     */
    public OrderDetail addProduct(Product product, int quantity) {
        OrderDetail detail = new OrderDetail();
        detail.setProduct(product);
        detail.setUnitPrice(product.getUnitPrice());
        detail.setQuantity((short) quantity);
        detail.setDiscount(BigDecimal.ZERO);
        this.addOrderDetail(detail);
        return detail;
    }

    /**
     * Check if the order has been shipped
     */
    public boolean isShipped() {
        return shippedDate != null;
    }

    /**
     * Calculate the total amount for this order (sum of line items + freight)
     */
    public BigDecimal getOrderTotal() {
        BigDecimal total = orderDetails.stream()
                .map(detail -> detail.getUnitPrice().multiply(new BigDecimal(detail.getQuantity()))
                        .multiply(BigDecimal.ONE.subtract(detail.getDiscount())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return freight != null ? total.add(freight) : total;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Order order = (Order) o;
        return Objects.equals(orderId, order.orderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(orderId);
    }

    @Override
    public String toString() {
        return "Order{" + "orderId=" + orderId + ", customer=" + (customer != null ? customer.getCompanyName() : null)
                + ", orderDate=" + orderDate + ", shipped=" + isShipped() + ", itemCount=" + orderDetails.size()
                + ", total=" + getOrderTotal() + '}';
    }
}