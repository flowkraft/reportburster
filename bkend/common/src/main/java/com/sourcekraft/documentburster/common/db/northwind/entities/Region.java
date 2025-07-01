package com.sourcekraft.documentburster.common.db.northwind.entities;

import java.util.ArrayList; // Added import
import java.util.List;
import java.util.Objects;

import jakarta.persistence.CascadeType; // Consider adding CascadeType if appropriate
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType; // Consider FetchType
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "\"Region\"")
public class Region {

    @Id
    @Column(name = "\"RegionID\"")
    private Integer regionId;

    @Column(name = "\"RegionDescription\"", length = 50, nullable = false)
    private String regionDescription;

    @OneToMany(mappedBy = "region", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Territory> territories = new ArrayList<>();

    /**
     * Default constructor required by JPA.
     */
    public Region() {
    }

    /**
     * Constructor to create a Region with ID and description. ADDED THIS
     * CONSTRUCTOR
     */
    public Region(Integer regionId, String regionDescription) {
        this.regionId = regionId;
        this.regionDescription = regionDescription;
    }

    // --- Getters and Setters ---

    public Integer getRegionId() {
        return regionId;
    }

    public void setRegionId(Integer regionId) {
        this.regionId = regionId;
    }

    public String getRegionDescription() {
        return regionDescription;
    }

    public void setRegionDescription(String regionDescription) {
        this.regionDescription = regionDescription;
    }

    public List<Territory> getTerritories() {
        return territories;
    }

    public void setTerritories(List<Territory> territories) {
        this.territories = territories;
    }

    // --- Helper Methods ---

    /**
     * Helper method to add a Territory to this Region and maintain the
     * bidirectional relationship. ADDED THIS METHOD
     */
    public void addTerritory(Territory territory) {
        if (territory != null) {
            // Prevent adding duplicates if territories were a Set, but good practice anyway
            if (!this.territories.contains(territory)) {
                this.territories.add(territory);
                territory.setRegion(this); // Set the 'many' side
            }
        }
    }

    /**
     * Optional: Helper method to remove a Territory.
     */
    public void removeTerritory(Territory territory) {
        if (territory != null) {
            this.territories.remove(territory);
            territory.setRegion(null); // Unset the 'many' side
        }
    }

    // --- equals and hashCode ---

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        // Use instanceof for better type checking, especially with proxies
        if (!(o instanceof Region))
            return false;
        Region region = (Region) o;
        // Use ID for equality check, ensure it's not null if possible before comparison
        return regionId != null && Objects.equals(regionId, region.regionId);
    }

    @Override
    public int hashCode() {
        // Use a constant for null ID hashcode
        return Objects.hash(regionId);
    }

    @Override
    public String toString() {
        return "Region{" + "regionId=" + regionId + ", regionDescription='" + regionDescription + '\'' + '}';
    }
}