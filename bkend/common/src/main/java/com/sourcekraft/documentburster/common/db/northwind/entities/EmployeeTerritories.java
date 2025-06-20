package com.sourcekraft.documentburster.common.db.northwind.entities;

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
 * Represents the many-to-many relationship between employees and territories in
 * the Northwind database. This junction table tracks which employees are
 * responsible for which sales territories.
 */
@Entity
@Table(name = "\"EmployeeTerritories\"")
@IdClass(EmployeeTerritoriesId.class)
public class EmployeeTerritories {

    @Id
    @Column(name = "\"EmployeeID\"")
    private Integer employeeId;

    @Id
    @Column(name = "\"TerritoryID\"")
    private String territoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"EmployeeID\"", insertable = false, updatable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"TerritoryID\"", insertable = false, updatable = false)
    private Territory territory;

    /**
     * Default constructor required by JPA
     */
    public EmployeeTerritories() {
    }

    /**
     * Create a new employee-territory assignment
     */
    public EmployeeTerritories(Employee employee, Territory territory) {
        this.employee = employee;
        this.territory = territory;
        this.employeeId = employee.getEmployeeId();
        this.territoryId = territory.getTerritoryId();
    }

    // Getters and setters
    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public String getTerritoryId() {
        return territoryId;
    }

    public void setTerritoryId(String territoryId) {
        this.territoryId = territoryId;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
        if (employee != null) {
            this.employeeId = employee.getEmployeeId();
        }
    }

    public Territory getTerritory() {
        return territory;
    }

    public void setTerritory(Territory territory) {
        this.territory = territory;
        if (territory != null) {
            this.territoryId = territory.getTerritoryId();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        EmployeeTerritories that = (EmployeeTerritories) o;
        return Objects.equals(employeeId, that.employeeId) && Objects.equals(territoryId, that.territoryId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(employeeId, territoryId);
    }

    @Override
    public String toString() {
        return "EmployeeTerritories{" + "employee=" + (employee != null ? employee.getLastName() : null)
                + ", territory=" + (territory != null ? territory.getTerritoryDescription() : null) + '}';
    }
}

/**
 * Composite primary key class for EmployeeTerritories
 */
class EmployeeTerritoriesId implements java.io.Serializable {
    /**
     * 
     */
    private static final long serialVersionUID = -8688994392668749105L;
    private Integer employeeId;
    private String territoryId;

    public EmployeeTerritoriesId() {
    }

    public EmployeeTerritoriesId(Integer employeeId, String territoryId) {
        this.employeeId = employeeId;
        this.territoryId = territoryId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        EmployeeTerritoriesId that = (EmployeeTerritoriesId) o;
        return Objects.equals(employeeId, that.employeeId) && Objects.equals(territoryId, that.territoryId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(employeeId, territoryId);
    }
}