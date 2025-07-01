package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Represents a customer in the Northwind database. Customers are companies that
 * purchase products.
 */
@Entity
@Table(name = "\"Customers\"")
public class Customer {

	@Id
	@Column(name = "\"CustomerID\"", length = 5)
	private String customerId;

	@Column(name = "\"CompanyName\"", length = 40, nullable = false)
	private String companyName;

	@Column(name = "\"ContactName\"", length = 30)
	private String contactName;

	@Column(name = "\"ContactTitle\"", length = 30)
	private String contactTitle;

	@Column(name = "\"Address\"", length = 60)
	private String address;

	@Column(name = "\"City\"", length = 15)
	private String city;

	@Column(name = "\"Region\"", length = 15)
	private String region;

	@Column(name = "\"PostalCode\"", length = 10)
	private String postalCode;

	@Column(name = "\"Country\"", length = 15)
	private String country;

	@Column(name = "\"Phone\"", length = 24)
	private String phone;

	@Column(name = "\"Fax\"", length = 24)
	private String fax;

	@Column(name = "\"Email\"", length = 225)
	private String email;

	@OneToMany(mappedBy = "customer", fetch = FetchType.LAZY)
	private List<Order> orders = new ArrayList<>();

	@ManyToMany
	@JoinTable(name = "\"CustomerCustomerDemo\"", joinColumns = @JoinColumn(name = "\"CustomerID\""), inverseJoinColumns = @JoinColumn(name = "\"CustomerTypeID\""))
	private List<CustomerDemographics> demographics = new ArrayList<>();

	/**
	 * Default constructor required by JPA
	 */
	public Customer() {
	}

	/**
	 * Create a customer with essential information
	 */
	public Customer(String customerId, String companyName, String contactName) {
		this.customerId = customerId;
		this.companyName = companyName;
		this.contactName = contactName;
	}

	// Getters and setters
	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	public String getContactName() {
		return contactName;
	}

	public void setContactName(String contactName) {
		this.contactName = contactName;
	}

	public String getContactTitle() {
		return contactTitle;
	}

	public void setContactTitle(String contactTitle) {
		this.contactTitle = contactTitle;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public String getRegion() {
		return region;
	}

	public void setRegion(String region) {
		this.region = region;
	}

	public String getPostalCode() {
		return postalCode;
	}

	public void setPostalCode(String postalCode) {
		this.postalCode = postalCode;
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getFax() {
		return fax;
	}

	public void setFax(String fax) {
		this.fax = fax;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public List<Order> getOrders() {
		return orders;
	}

	public void setOrders(List<Order> orders) {
		this.orders = orders;
	}

	public List<CustomerDemographics> getDemographics() {
		return demographics;
	}

	public void setDemographics(List<CustomerDemographics> demographics) {
		this.demographics = demographics;
	}

	/**
	 * Add an order to this customer
	 */
	public void addOrder(Order order) {
		orders.add(order);
		order.setCustomer(this);
	}

	/**
	 * Remove an order from this customer
	 */
	public void removeOrder(Order order) {
		orders.remove(order);
		order.setCustomer(null);
	}

	/**
	 * Add a demographic to this customer
	 */
	public void addDemographic(CustomerDemographics demographic) {
		demographics.add(demographic);
		demographic.getCustomers().add(this);
	}

	/**
	 * Remove a demographic from this customer
	 */
	public void removeDemographic(CustomerDemographics demographic) {
		demographics.remove(demographic);
		demographic.getCustomers().remove(this);
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		Customer customer = (Customer) o;
		return Objects.equals(customerId, customer.customerId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(customerId);
	}

	@Override
	public String toString() {
		return "Customer{" + "customerId='" + customerId + '\'' + ", companyName='" + companyName + '\'' + ", contactName='" + contactName + '\'' + '}';
	}
}