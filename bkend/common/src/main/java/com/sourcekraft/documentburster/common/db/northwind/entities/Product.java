package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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
 * Represents a product in the Northwind database. Products are items sold by
 * the company.
 */
@Entity
@Table(name = "\"Products\"")
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "\"ProductID\"")
	private Integer productId;

	@Column(name = "\"ProductName\"", length = 40, nullable = false)
	private String productName;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "\"SupplierID\"")
	private Supplier supplier;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "\"CategoryID\"")
	private Category category;

	@Column(name = "\"QuantityPerUnit\"", length = 20)
	private String quantityPerUnit;

	@Column(name = "\"UnitPrice\"", precision = 19, scale = 4)
	private BigDecimal unitPrice;

	@Column(name = "\"UnitsInStock\"")
	private Short unitsInStock;

	@Column(name = "\"UnitsOnOrder\"")
	private Short unitsOnOrder;

	@Column(name = "\"ReorderLevel\"")
	private Short reorderLevel;

	@Column(name = "\"Discontinued\"", nullable = false)
	private boolean discontinued;

	@OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
	private List<OrderDetail> orderDetails = new ArrayList<>();

	/**
	 * Default constructor required by JPA
	 */
	public Product() {
		this.discontinued = false;
		this.unitsInStock = 0;
		this.unitsOnOrder = 0;
	}

	/**
	 * Create a product with essential information
	 */
	public Product(String productName, BigDecimal unitPrice) {
		this();
		this.productName = productName;
		this.unitPrice = unitPrice;
	}

	/**
	 * Create a product with category and supplier
	 */
	public Product(String productName, BigDecimal unitPrice, Category category, Supplier supplier) {
		this(productName, unitPrice);
		this.category = category;
		this.supplier = supplier;
	}

	// Getters and setters
	public Integer getProductId() {
		return productId;
	}

	public void setProductId(Integer productId) {
		this.productId = productId;
	}

	public String getProductName() {
		return productName;
	}

	public void setProductName(String productName) {
		this.productName = productName;
	}

	public Supplier getSupplier() {
		return supplier;
	}

	public void setSupplier(Supplier supplier) {
		this.supplier = supplier;
	}

	public Category getCategory() {
		return category;
	}

	public void setCategory(Category category) {
		this.category = category;
	}

	public String getQuantityPerUnit() {
		return quantityPerUnit;
	}

	public void setQuantityPerUnit(String quantityPerUnit) {
		this.quantityPerUnit = quantityPerUnit;
	}

	public BigDecimal getUnitPrice() {
		return unitPrice;
	}

	public void setUnitPrice(BigDecimal unitPrice) {
		this.unitPrice = unitPrice;
	}

	public Short getUnitsInStock() {
		return unitsInStock;
	}

	public void setUnitsInStock(Short unitsInStock) {
		this.unitsInStock = unitsInStock;
	}

	public Short getUnitsOnOrder() {
		return unitsOnOrder;
	}

	public void setUnitsOnOrder(Short unitsOnOrder) {
		this.unitsOnOrder = unitsOnOrder;
	}

	public Short getReorderLevel() {
		return reorderLevel;
	}

	public void setReorderLevel(Short reorderLevel) {
		this.reorderLevel = reorderLevel;
	}

	public boolean isDiscontinued() {
		return discontinued;
	}

	public void setDiscontinued(boolean discontinued) {
		this.discontinued = discontinued;
	}

	public List<OrderDetail> getOrderDetails() {
		return orderDetails;
	}

	public void setOrderDetails(List<OrderDetail> orderDetails) {
		this.orderDetails = orderDetails;
	}

	/**
	 * Add an order detail to this product
	 */
	public void addOrderDetail(OrderDetail orderDetail) {
		orderDetails.add(orderDetail);
		orderDetail.setProduct(this);
	}

	/**
	 * Remove an order detail from this product
	 */
	public void removeOrderDetail(OrderDetail orderDetail) {
		orderDetails.remove(orderDetail);
		orderDetail.setProduct(null);
	}

	/**
	 * Check if product is available in stock
	 */
	public boolean isInStock() {
		return unitsInStock != null && unitsInStock > 0;
	}

	/**
	 * Get the current stock value (units in stock * unit price)
	 */
	public BigDecimal getInventoryValue() {
		if (unitsInStock == null || unitPrice == null) {
			return BigDecimal.ZERO;
		}
		return unitPrice.multiply(new BigDecimal(unitsInStock));
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		Product product = (Product) o;
		return Objects.equals(productId, product.productId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(productId);
	}

	@Override
	public String toString() {
		return "Product{" + "productId=" + productId + ", productName='" + productName + '\'' + ", category="
				+ (category != null ? category.getCategoryName() : null) + ", unitPrice=" + unitPrice + ", inStock="
				+ isInStock() + '}';
	}
}