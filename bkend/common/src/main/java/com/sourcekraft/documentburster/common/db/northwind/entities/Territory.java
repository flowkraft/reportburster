package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;


/**
 * Represents a sales territory in the Northwind database. Territories are
 * grouped by regions and assigned to employees.
 */
@Entity
@Table(name = "\"Territories\"")
public class Territory {

    @Id
    @Column(name = "\"TerritoryID\"", length = 20)
    private String territoryId;

    @Column(name = "\"TerritoryDescription\"", length = 50, nullable = false)
    private String territoryDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"RegionID\"", nullable = false)
    private Region region;

    @ManyToMany(mappedBy = "territories", fetch = FetchType.LAZY)
    private List<Employee> employees = new ArrayList<>();

    /**
     * Default constructor required by JPA
     */
    public Territory() {
    }

    /**
     * Create a territory with ID, description and region
     */
    public Territory(String territoryId, String territoryDescription, Region region) {
        this.territoryId = territoryId;
        this.territoryDescription = territoryDescription;
        this.region = region;
    }

    // Getters and setters
    public String getTerritoryId() {
        return territoryId;
    }

    public void setTerritoryId(String territoryId) {
        this.territoryId = territoryId;
    }

    public String getTerritoryDescription() {
        return territoryDescription;
    }

    public void setTerritoryDescription(String territoryDescription) {
        this.territoryDescription = territoryDescription;
    }

    public Region getRegion() {
        return region;
    }

    public void setRegion(Region region) {
        this.region = region;
    }

    public List<Employee> getEmployees() {
        return employees;
    }

    public void setEmployees(List<Employee> employees) {
        this.employees = employees;
    }

    /**
     * Add an employee to this territory
     */
    public void addEmployee(Employee employee) {
        employees.add(employee);
        employee.getTerritories().add(this);
    }

    /**
     * Remove an employee from this territory
     */
    public void removeEmployee(Employee employee) {
        employees.remove(employee);
        employee.getTerritories().remove(this);
    }

    /**
     * Get full territory description with region
     */
    public String getFullDescription() {
        return territoryDescription + (region != null ? " (" + region.getRegionDescription() + ")" : "");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Territory territory = (Territory) o;
        return Objects.equals(territoryId, territory.territoryId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(territoryId);
    }

    @Override
    public String toString() {
        return "Territory{" + "territoryId='" + territoryId + '\'' + ", territoryDescription='" + territoryDescription
                + '\'' + ", region=" + (region != null ? region.getRegionDescription() : null) + ", employeeCount="
                + (employees != null ? employees.size() : 0) + '}';
    }
}