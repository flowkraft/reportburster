package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Represents the many-to-many relationship between customers and customer demographics
 * in the Northwind database. This is a junction table that links customers to their
 * demographic categories.
 */
@Entity
@Table(name = "\"CustomerCustomerDemo\"")
@IdClass(CustomerCustomerDemo.CustomerCustomerDemoId.class)
public class CustomerCustomerDemo {

    /**
     * Composite primary key class for CustomerCustomerDemo entity.
     * This class represents the combined primary key consisting of
     * customerId and customerTypeId.
     */
    public static class CustomerCustomerDemoId implements Serializable {
        
        private static final long serialVersionUID = 1L;
        
        private String customerId;
        private String customerTypeId;
        
        /**
         * Default constructor required by JPA
         */
        public CustomerCustomerDemoId() {
        }
        
        /**
         * Constructor with key fields
         * 
         * @param customerId The customer ID
         * @param customerTypeId The customer type ID
         */
        public CustomerCustomerDemoId(String customerId, String customerTypeId) {
            this.customerId = customerId;
            this.customerTypeId = customerTypeId;
        }
        
        public String getCustomerId() {
            return customerId;
        }
        
        public void setCustomerId(String customerId) {
            this.customerId = customerId;
        }
        
        public String getCustomerTypeId() {
            return customerTypeId;
        }
        
        public void setCustomerTypeId(String customerTypeId) {
            this.customerTypeId = customerTypeId;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            CustomerCustomerDemoId that = (CustomerCustomerDemoId) o;
            return Objects.equals(customerId, that.customerId) &&
                   Objects.equals(customerTypeId, that.customerTypeId);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(customerId, customerTypeId);
        }
        
        @Override
        public String toString() {
            return "CustomerCustomerDemoId{" +
                    "customerId='" + customerId + '\'' +
                    ", customerTypeId='" + customerTypeId + '\'' +
                    '}';
        }
    }

    @Id
    @Column(name = "\"CustomerID\"", length = 5, nullable = false)
    private String customerId;

    @Id
    @Column(name = "\"CustomerTypeID\"", length = 10, nullable = false)
    private String customerTypeId;

    @ManyToOne
    @JoinColumn(name = "\"CustomerID\"", insertable = false, updatable = false)
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "\"CustomerTypeID\"", insertable = false, updatable = false)
    private CustomerDemographics customerDemographics;

    /**
     * Default constructor required by JPA
     */
    public CustomerCustomerDemo() {
    }

    /**
     * Constructs a new CustomerCustomerDemo with the specified IDs
     * 
     * @param customerId The ID of the customer
     * @param customerTypeId The ID of the customer demographic type
     */
    public CustomerCustomerDemo(String customerId, String customerTypeId) {
        this.customerId = customerId;
        this.customerTypeId = customerTypeId;
    }

    /**
     * Constructs a new CustomerCustomerDemo with all properties
     * 
     * @param customerId The ID of the customer
     * @param customerTypeId The ID of the customer demographic type
     * @param customer The associated customer
     * @param customerDemographics The associated customer demographics
     */
    public CustomerCustomerDemo(String customerId, String customerTypeId, 
            Customer customer, CustomerDemographics customerDemographics) {
        this.customerId = customerId;
        this.customerTypeId = customerTypeId;
        this.customer = customer;
        this.customerDemographics = customerDemographics;
    }

    /**
     * Gets the customer ID
     * 
     * @return The customer ID
     */
    public String getCustomerId() {
        return customerId;
    }

    /**
     * Sets the customer ID
     * 
     * @param customerId The customer ID
     */
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    /**
     * Gets the customer type ID
     * 
     * @return The customer type ID
     */
    public String getCustomerTypeId() {
        return customerTypeId;
    }

    /**
     * Sets the customer type ID
     * 
     * @param customerTypeId The customer type ID
     */
    public void setCustomerTypeId(String customerTypeId) {
        this.customerTypeId = customerTypeId;
    }

    /**
     * Gets the associated customer
     * 
     * @return The customer
     */
    public Customer getCustomer() {
        return customer;
    }

    /**
     * Sets the associated customer
     * 
     * @param customer The customer
     */
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    /**
     * Gets the associated customer demographics
     * 
     * @return The customer demographics
     */
    public CustomerDemographics getCustomerDemographics() {
        return customerDemographics;
    }

    /**
     * Sets the associated customer demographics
     * 
     * @param customerDemographics The customer demographics
     */
    public void setCustomerDemographics(CustomerDemographics customerDemographics) {
        this.customerDemographics = customerDemographics;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CustomerCustomerDemo that = (CustomerCustomerDemo) o;
        return Objects.equals(customerId, that.customerId) &&
               Objects.equals(customerTypeId, that.customerTypeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(customerId, customerTypeId);
    }

    @Override
    public String toString() {
        return "CustomerCustomerDemo{" +
                "customerId='" + customerId + '\'' +
                ", customerTypeId='" + customerTypeId + '\'' +
                '}';
    }
}