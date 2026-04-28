package com.flowkraft.reporting.dsl.jsononly;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Map widget options DTO — configuration for the rb-map web component.
 *
 * Mirrors the RbMap.wc.svelte `options` prop shape.
 */
public class MapOptions {

    // 'auto' | 'region' (choropleth) | 'pin' | 'grid'
    private String mapType;

    // 'auto' | 'us_states' | 'world_countries'
    private String region;

    // Dimension column for choropleth matching (state / country)
    private String dimension;

    // Numeric measure column for choropleth color ramp
    private String metric;

    // Latitude column (for pin maps)
    private String latField;

    // Longitude column (for pin maps)
    private String lonField;

    // Optional explicit GeoJSON URL override
    private String geoJsonUrl;

    // feature.properties key to match rows against
    private String geoJsonKey;

    // Tile server URL (OpenStreetMap compatible)
    private String tileUrl;

    // Attribution text displayed on the map
    private String attribution;

    // Color scale array (CSS colors) for choropleth ramp
    private List<String> colorScale = new ArrayList<>();

    // Initial zoom level (null = auto-fit)
    private Integer zoom;

    // Initial center [lat, lon] (null = auto-fit)
    private List<Double> center = new ArrayList<>();

    // When true, pan/zoom to fit visible features on load
    private Boolean fitBounds;

    // Named blocks for multi-component reports
    private Map<String, MapOptions> namedOptions = new LinkedHashMap<>();

    public String getMapType() { return mapType; }
    public void setMapType(String mapType) { this.mapType = mapType; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getDimension() { return dimension; }
    public void setDimension(String dimension) { this.dimension = dimension; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public String getLatField() { return latField; }
    public void setLatField(String latField) { this.latField = latField; }

    public String getLonField() { return lonField; }
    public void setLonField(String lonField) { this.lonField = lonField; }

    public String getGeoJsonUrl() { return geoJsonUrl; }
    public void setGeoJsonUrl(String geoJsonUrl) { this.geoJsonUrl = geoJsonUrl; }

    public String getGeoJsonKey() { return geoJsonKey; }
    public void setGeoJsonKey(String geoJsonKey) { this.geoJsonKey = geoJsonKey; }

    public String getTileUrl() { return tileUrl; }
    public void setTileUrl(String tileUrl) { this.tileUrl = tileUrl; }

    public String getAttribution() { return attribution; }
    public void setAttribution(String attribution) { this.attribution = attribution; }

    public List<String> getColorScale() { return colorScale; }
    public void setColorScale(List<String> colorScale) { this.colorScale = colorScale; }

    public Integer getZoom() { return zoom; }
    public void setZoom(Integer zoom) { this.zoom = zoom; }

    public List<Double> getCenter() { return center; }
    public void setCenter(List<Double> center) { this.center = center; }

    public Boolean getFitBounds() { return fitBounds; }
    public void setFitBounds(Boolean fitBounds) { this.fitBounds = fitBounds; }

    public Map<String, MapOptions> getNamedOptions() { return namedOptions; }
    public void setNamedOptions(Map<String, MapOptions> namedOptions) { this.namedOptions = namedOptions; }
}
