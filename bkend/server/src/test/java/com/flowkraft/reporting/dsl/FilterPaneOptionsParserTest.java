package com.flowkraft.reporting.dsl;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.flowkraft.reporting.dsl.filterpane.FilterPaneOptions;
import com.flowkraft.reporting.dsl.filterpane.FilterPaneOptionsParser;

/**
 * Tests for FilterPaneOptionsParser — validates Groovy DSL parsing
 * for the rb-filter-pane web component configuration.
 */
class FilterPaneOptionsParserTest {

    @Nested
    @DisplayName("FUNDAMENTALS — minimal and default configurations")
    class Fundamentals {

        @Test
        @DisplayName("Empty/null input returns default options")
        void emptyInput() throws Exception {
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode("");
            assertNotNull(opts);
            assertNull(opts.getField());
            assertEquals("asc", opts.getSort());
            assertEquals(500, opts.getMaxValues());
            assertTrue(opts.isMultiSelect());
            assertFalse(opts.isShowCount());
            assertEquals("auto", opts.getHeight());
        }

        @Test
        @DisplayName("Minimal — field only (unnamed block)")
        void minimalFieldOnly() throws Exception {
            String dsl = """
                filterPane {
                    field 'ShipCountry'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            assertEquals("ShipCountry", opts.getField());
            assertNull(opts.getLabel()); // defaults to field name in frontend
            assertEquals("asc", opts.getSort());
            assertEquals(500, opts.getMaxValues());
            assertTrue(opts.isMultiSelect());
        }

        @Test
        @DisplayName("Minimal — field only (named block)")
        void minimalNamedBlock() throws Exception {
            String dsl = """
                filterPane('countryFilter') {
                    field 'ShipCountry'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            assertNotNull(opts.getNamedOptions());
            assertTrue(opts.getNamedOptions().containsKey("countryFilter"));

            FilterPaneOptions named = opts.getNamedOptions().get("countryFilter");
            assertEquals("ShipCountry", named.getField());
        }
    }

    @Nested
    @DisplayName("FULL CONFIGURATION — all options specified")
    class FullConfiguration {

        @Test
        @DisplayName("All options set explicitly")
        void allOptions() throws Exception {
            String dsl = """
                filterPane('countryFilter') {
                    field 'ShipCountry'
                    label 'Country'
                    sort 'desc'
                    maxValues 100
                    showSearch true
                    showCount true
                    defaultSelected 'Germany', 'France'
                    multiSelect false
                    height '250px'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            FilterPaneOptions named = opts.getNamedOptions().get("countryFilter");

            assertEquals("ShipCountry", named.getField());
            assertEquals("Country", named.getLabel());
            assertEquals("desc", named.getSort());
            assertEquals(100, named.getMaxValues());
            assertTrue(named.getShowSearch());
            assertTrue(named.isShowCount());
            assertEquals(List.of("Germany", "France"), named.getDefaultSelected());
            assertFalse(named.isMultiSelect());
            assertEquals("250px", named.getHeight());
        }
    }

    @Nested
    @DisplayName("SORT OPTIONS — various sort modes")
    class SortOptions {

        @Test
        @DisplayName("Sort ascending (default)")
        void sortAsc() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Category'
                    sort 'asc'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("asc", named.getSort());
        }

        @Test
        @DisplayName("Sort descending")
        void sortDesc() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Category'
                    sort 'desc'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("desc", named.getSort());
        }

        @Test
        @DisplayName("Sort by count descending (most frequent first)")
        void sortCountDesc() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Category'
                    sort 'count_desc'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("count_desc", named.getSort());
        }

        @Test
        @DisplayName("Sort none (preserve database order)")
        void sortNone() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Category'
                    sort 'none'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("none", named.getSort());
        }
    }

    @Nested
    @DisplayName("MULTI-COMPONENT — multiple named filter panes in one DSL file")
    class MultiComponent {

        @Test
        @DisplayName("Two named filter panes in same DSL")
        void twoNamedPanes() throws Exception {
            String dsl = """
                filterPane('countryFilter') {
                    field 'ShipCountry'
                    label 'Country'
                }

                filterPane('categoryFilter') {
                    field 'CategoryName'
                    label 'Category'
                    showCount true
                    sort 'count_desc'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            Map<String, FilterPaneOptions> named = opts.getNamedOptions();

            assertEquals(2, named.size());

            FilterPaneOptions country = named.get("countryFilter");
            assertEquals("ShipCountry", country.getField());
            assertEquals("Country", country.getLabel());

            FilterPaneOptions category = named.get("categoryFilter");
            assertEquals("CategoryName", category.getField());
            assertEquals("Category", category.getLabel());
            assertTrue(category.isShowCount());
            assertEquals("count_desc", category.getSort());
        }

        @Test
        @DisplayName("Three filter panes — country, year, product")
        void threeNamedPanes() throws Exception {
            String dsl = """
                filterPane('country') {
                    field 'ShipCountry'
                }

                filterPane('year') {
                    field 'OrderYear'
                    sort 'desc'
                }

                filterPane('product') {
                    field 'ProductName'
                    maxValues 50
                    showSearch true
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            assertEquals(3, opts.getNamedOptions().size());

            assertEquals("desc", opts.getNamedOptions().get("year").getSort());
            assertEquals(50, opts.getNamedOptions().get("product").getMaxValues());
            assertTrue(opts.getNamedOptions().get("product").getShowSearch());
        }
    }

    @Nested
    @DisplayName("DEFAULT SELECTED — pre-selected values on load")
    class DefaultSelected {

        @Test
        @DisplayName("Single default selected value")
        void singleDefault() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Country'
                    defaultSelected 'Germany'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(List.of("Germany"), named.getDefaultSelected());
        }

        @Test
        @DisplayName("Multiple default selected values (varargs)")
        void multipleDefaults() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Country'
                    defaultSelected 'Germany', 'France', 'Spain'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(List.of("Germany", "France", "Spain"), named.getDefaultSelected());
        }

        @Test
        @DisplayName("No default selected (empty list)")
        void noDefaults() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Country'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertTrue(named.getDefaultSelected().isEmpty());
        }
    }

    @Nested
    @DisplayName("ERROR HANDLING — invalid inputs and edge cases")
    class ErrorHandling {

        @Test
        @DisplayName("Invalid sort value throws IllegalArgumentException")
        void invalidSortValue() {
            String dsl = """
                filterPane('f') {
                    field 'Category'
                    sort 'banana'
                }
                """;
            assertThrows(Exception.class, () ->
                FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl));
        }

        @Test
        @DisplayName("Invalid sort value in unnamed block throws")
        void invalidSortUnnamed() {
            String dsl = """
                filterPane {
                    field 'Category'
                    sort 'invalid_mode'
                }
                """;
            assertThrows(Exception.class, () ->
                FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl));
        }

        @Test
        @DisplayName("Null input returns default options")
        void nullInput() throws Exception {
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(null);
            assertNotNull(opts);
            assertNull(opts.getField());
        }

        @Test
        @DisplayName("Groovy syntax error throws exception")
        void groovySyntaxError() {
            String dsl = "filterPane('f') { field $$$ }";
            assertThrows(Exception.class, () ->
                FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl));
        }

        @Test
        @DisplayName("Empty closure produces defaults")
        void emptyClosure() throws Exception {
            String dsl = """
                filterPane('empty') {
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            FilterPaneOptions named = opts.getNamedOptions().get("empty");
            assertNotNull(named);
            assertNull(named.getField());
            assertEquals("asc", named.getSort());
            assertEquals(500, named.getMaxValues());
        }

        @Test
        @DisplayName("No filterPane block — returns empty defaults")
        void noFilterPaneBlock() throws Exception {
            String dsl = "// just a comment, no filterPane block";
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            assertNotNull(opts);
            assertNull(opts.getField());
            assertTrue(opts.getNamedOptions().isEmpty());
        }
    }

    @Nested
    @DisplayName("BOUNDARIES — edge cases for field values and limits")
    class Boundaries {

        @Test
        @DisplayName("Field with spaces is preserved")
        void fieldWithSpaces() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Ship Country'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("Ship Country", named.getField());
        }

        @Test
        @DisplayName("maxValues zero is accepted")
        void maxValuesZero() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Category'
                    maxValues 0
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(0, named.getMaxValues());
        }

        @Test
        @DisplayName("maxValues very large number")
        void maxValuesLarge() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Category'
                    maxValues 100000
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(100000, named.getMaxValues());
        }

        @Test
        @DisplayName("Empty string field is stored as empty")
        void emptyStringField() throws Exception {
            String dsl = """
                filterPane('f') {
                    field ''
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("", named.getField());
        }

        @Test
        @DisplayName("Label with special characters")
        void labelSpecialChars() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'col1'
                    label 'Revenue ($)'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("Revenue ($)", named.getLabel());
        }
    }

    @Nested
    @DisplayName("OVERRIDES — behavior when DSL methods are called multiple times")
    class Overrides {

        @Test
        @DisplayName("Calling field twice — last value wins")
        void fieldCalledTwice() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'FirstField'
                    field 'SecondField'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("SecondField", named.getField());
        }

        @Test
        @DisplayName("Calling defaultSelected twice — values accumulate (append)")
        void defaultSelectedCalledTwice() throws Exception {
            String dsl = """
                filterPane('f') {
                    field 'Country'
                    defaultSelected 'Germany'
                    defaultSelected 'France'
                }
                """;
            FilterPaneOptions named = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(List.of("Germany", "France"), named.getDefaultSelected());
        }

        @Test
        @DisplayName("Same named block ID used twice — second overwrites first")
        void duplicateNamedBlockId() throws Exception {
            String dsl = """
                filterPane('dup') {
                    field 'FirstField'
                    label 'First'
                }
                filterPane('dup') {
                    field 'SecondField'
                    label 'Second'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            assertEquals(1, opts.getNamedOptions().size());
            assertEquals("SecondField", opts.getNamedOptions().get("dup").getField());
            assertEquals("Second", opts.getNamedOptions().get("dup").getLabel());
        }

        @Test
        @DisplayName("Mixed named and unnamed blocks coexist")
        void mixedNamedAndUnnamed() throws Exception {
            String dsl = """
                filterPane {
                    field 'UnnamedField'
                    label 'Unnamed'
                }
                filterPane('named1') {
                    field 'NamedField'
                    label 'Named'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);
            // Unnamed block
            assertEquals("UnnamedField", opts.getField());
            assertEquals("Unnamed", opts.getLabel());
            // Named block
            assertEquals(1, opts.getNamedOptions().size());
            assertEquals("NamedField", opts.getNamedOptions().get("named1").getField());
        }
    }

    @Nested
    @DisplayName("REAL-WORLD — common dashboard configurations")
    class RealWorld {

        @Test
        @DisplayName("Northwind dashboard — country + category filter panes")
        void northwindDashboard() throws Exception {
            String dsl = """
                filterPane('countryFilter') {
                    field 'ShipCountry'
                    label 'Ship Country'
                    showCount true
                    sort 'count_desc'
                }

                filterPane('categoryFilter') {
                    field 'CategoryName'
                    label 'Product Category'
                    sort 'asc'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);

            FilterPaneOptions country = opts.getNamedOptions().get("countryFilter");
            assertEquals("ShipCountry", country.getField());
            assertEquals("Ship Country", country.getLabel());
            assertTrue(country.isShowCount());
            assertEquals("count_desc", country.getSort());

            FilterPaneOptions category = opts.getNamedOptions().get("categoryFilter");
            assertEquals("CategoryName", category.getField());
            assertEquals("Product Category", category.getLabel());
            assertEquals("asc", category.getSort());
        }

        @Test
        @DisplayName("Sales dashboard — year with descending sort + region with defaults")
        void salesDashboard() throws Exception {
            String dsl = """
                filterPane('yearFilter') {
                    field 'OrderYear'
                    label 'Year'
                    sort 'desc'
                    defaultSelected '2024'
                    multiSelect false
                }

                filterPane('regionFilter') {
                    field 'Region'
                    label 'Region'
                    height '200px'
                }
                """;
            FilterPaneOptions opts = FilterPaneOptionsParser.parseGroovyFilterPaneDslCode(dsl);

            FilterPaneOptions year = opts.getNamedOptions().get("yearFilter");
            assertEquals("desc", year.getSort());
            assertEquals(List.of("2024"), year.getDefaultSelected());
            assertFalse(year.isMultiSelect());

            FilterPaneOptions region = opts.getNamedOptions().get("regionFilter");
            assertEquals("200px", region.getHeight());
            assertTrue(region.isMultiSelect()); // default
        }
    }
}
