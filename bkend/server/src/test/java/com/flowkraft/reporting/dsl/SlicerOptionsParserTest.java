package com.flowkraft.reporting.dsl;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.flowkraft.reporting.dsl.slicer.SlicerOptions;
import com.flowkraft.reporting.dsl.slicer.SlicerOptionsParser;

/**
 * Tests for SlicerOptionsParser — validates Groovy DSL parsing
 * for the rb-slicer web component configuration.
 *
 * <p><b>📖 Tests are the regression net for the DSL syntax contract.</b>
 * Every test fixture uses canonical block form. Adding a test that uses the
 * legacy parens/list-of-maps form silently weakens the contract — refuse it
 * in review. See
 * {@link com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme#iAmImportantReadme()}
 * for the full principles.
 */
class SlicerOptionsParserTest {

    static { com.flowkraft.reporting.dsl.common.DSLPrinciplesReadme.iAmImportantReadme(); }


    @Nested
    @DisplayName("FUNDAMENTALS — minimal and default configurations")
    class Fundamentals {

        @Test
        @DisplayName("Empty/null input returns default options")
        void emptyInput() throws Exception {
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode("");
            assertNotNull(opts);
            assertNull(opts.getField());
            assertEquals("asc", opts.getSort());
            assertEquals(500, opts.getMaxValues());
            assertEquals(SlicerOptions.CONTROL_MULTISELECT, opts.getControl());
            assertFalse(opts.isShowCount());
            assertEquals("auto", opts.getHeight());
        }

        @Test
        @DisplayName("Minimal — field only (unnamed block)")
        void minimalFieldOnly() throws Exception {
            String dsl = """
                slicer {
                    field 'ShipCountry'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            assertEquals("ShipCountry", opts.getField());
            assertNull(opts.getLabel()); // defaults to field name in frontend
            assertEquals("asc", opts.getSort());
            assertEquals(500, opts.getMaxValues());
            assertEquals(SlicerOptions.CONTROL_MULTISELECT, opts.getControl());
        }

        @Test
        @DisplayName("Minimal — field only (named block)")
        void minimalNamedBlock() throws Exception {
            String dsl = """
                slicer('countryFilter') {
                    field 'ShipCountry'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            assertNotNull(opts.getNamedOptions());
            assertTrue(opts.getNamedOptions().containsKey("countryFilter"));

            SlicerOptions named = opts.getNamedOptions().get("countryFilter");
            assertEquals("ShipCountry", named.getField());
        }

        @Test
        @DisplayName("The name is the field — `slicer('channel')` alone is a whole slicer")
        void nameIsTheField() throws Exception {
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode("slicer('channel')")
                    .getNamedOptions().get("channel");
            assertNotNull(named, "a bare `slicer('channel')` is a slicer of its own");
            assertEquals("channel", named.getField());
            assertEquals(SlicerOptions.CONTROL_MULTISELECT, named.getControl());
        }

        @Test
        @DisplayName("The name is the field — an empty block says the same")
        void nameIsTheFieldEmptyBlock() throws Exception {
            String dsl = """
                slicer('channel') {
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("channel");
            assertEquals("channel", named.getField());
        }

        @Test
        @DisplayName("`field` wins over the name when the column differs")
        void fieldOverridesTheName() throws Exception {
            String dsl = """
                slicer('channel') {
                    field 'sales_channel'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("channel");
            assertEquals("sales_channel", named.getField());
        }
    }

    @Nested
    @DisplayName("FULL CONFIGURATION — all options specified")
    class FullConfiguration {

        @Test
        @DisplayName("All options set explicitly")
        void allOptions() throws Exception {
            String dsl = """
                slicer('countryFilter') {
                    field 'ShipCountry'
                    label 'Country'
                    sort 'desc'
                    maxValues 100
                    showSearch true
                    showCount true
                    defaultValue 'Germany', 'France'
                    control 'select'
                    height '250px'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            SlicerOptions named = opts.getNamedOptions().get("countryFilter");

            assertEquals("ShipCountry", named.getField());
            assertEquals("Country", named.getLabel());
            assertEquals("desc", named.getSort());
            assertEquals(100, named.getMaxValues());
            assertTrue(named.getShowSearch());
            assertTrue(named.isShowCount());
            assertEquals(List.of("Germany", "France"), named.getDefaultValue());
            assertEquals(SlicerOptions.CONTROL_SELECT, named.getControl());
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
                slicer('f') {
                    field 'Category'
                    sort 'asc'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("asc", named.getSort());
        }

        @Test
        @DisplayName("Sort descending")
        void sortDesc() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Category'
                    sort 'desc'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("desc", named.getSort());
        }

        @Test
        @DisplayName("Sort by count descending (most frequent first)")
        void sortCountDesc() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Category'
                    sort 'count_desc'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("count_desc", named.getSort());
        }

        @Test
        @DisplayName("Sort none (preserve database order)")
        void sortNone() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Category'
                    sort 'none'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("none", named.getSort());
        }
    }

    @Nested
    @DisplayName("MULTI-COMPONENT — multiple named slicers in one DSL file")
    class MultiComponent {

        @Test
        @DisplayName("Two named slicers in same DSL")
        void twoNamedSlicers() throws Exception {
            String dsl = """
                slicer('countryFilter') {
                    field 'ShipCountry'
                    label 'Country'
                }

                slicer('categoryFilter') {
                    field 'CategoryName'
                    label 'Category'
                    showCount true
                    sort 'count_desc'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            Map<String, SlicerOptions> named = opts.getNamedOptions();

            assertEquals(2, named.size());

            SlicerOptions country = named.get("countryFilter");
            assertEquals("ShipCountry", country.getField());
            assertEquals("Country", country.getLabel());

            SlicerOptions category = named.get("categoryFilter");
            assertEquals("CategoryName", category.getField());
            assertEquals("Category", category.getLabel());
            assertTrue(category.isShowCount());
            assertEquals("count_desc", category.getSort());
        }

        @Test
        @DisplayName("Three slicers — country, year, product")
        void threeNamedSlicers() throws Exception {
            String dsl = """
                slicer('country') {
                    field 'ShipCountry'
                }

                slicer('year') {
                    field 'OrderYear'
                    sort 'desc'
                }

                slicer('product') {
                    field 'ProductName'
                    maxValues 50
                    showSearch true
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            assertEquals(3, opts.getNamedOptions().size());

            assertEquals("desc", opts.getNamedOptions().get("year").getSort());
            assertEquals(50, opts.getNamedOptions().get("product").getMaxValues());
            assertTrue(opts.getNamedOptions().get("product").getShowSearch());
        }
    }

    @Nested
    @DisplayName("DEFAULT VALUE — pre-picked values on load")
    class DefaultValue {

        @Test
        @DisplayName("Single default value")
        void singleDefault() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Country'
                    defaultValue 'Germany'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(List.of("Germany"), named.getDefaultValue());
        }

        @Test
        @DisplayName("Multiple default values (varargs)")
        void multipleDefaults() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Country'
                    defaultValue 'Germany', 'France', 'Spain'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(List.of("Germany", "France", "Spain"), named.getDefaultValue());
        }

        @Test
        @DisplayName("No default value (empty list)")
        void noDefaults() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Country'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertTrue(named.getDefaultValue().isEmpty());
        }
    }

    @Nested
    @DisplayName("ERROR HANDLING — invalid inputs and edge cases")
    class ErrorHandling {

        @Test
        @DisplayName("Invalid sort value throws IllegalArgumentException")
        void invalidSortValue() {
            String dsl = """
                slicer('f') {
                    field 'Category'
                    sort 'banana'
                }
                """;
            assertThrows(Exception.class, () ->
                SlicerOptionsParser.parseGroovySlicerDslCode(dsl));
        }

        @Test
        @DisplayName("Invalid sort value in unnamed block throws")
        void invalidSortUnnamed() {
            String dsl = """
                slicer {
                    field 'Category'
                    sort 'invalid_mode'
                }
                """;
            assertThrows(Exception.class, () ->
                SlicerOptionsParser.parseGroovySlicerDslCode(dsl));
        }

        @Test
        @DisplayName("Null input returns default options")
        void nullInput() throws Exception {
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(null);
            assertNotNull(opts);
            assertNull(opts.getField());
        }

        @Test
        @DisplayName("Groovy syntax error throws exception")
        void groovySyntaxError() {
            String dsl = "slicer('f') { field $$$ }";
            assertThrows(Exception.class, () ->
                SlicerOptionsParser.parseGroovySlicerDslCode(dsl));
        }

        @Test
        @DisplayName("Empty closure — the name is the field, the rest defaults")
        void emptyClosure() throws Exception {
            String dsl = """
                slicer('empty') {
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            SlicerOptions named = opts.getNamedOptions().get("empty");
            assertNotNull(named);
            assertEquals("empty", named.getField()); // the name is the field (owner decision 19)
            assertEquals("asc", named.getSort());
            assertEquals(500, named.getMaxValues());
        }

        @Test
        @DisplayName("No slicer block — returns empty defaults")
        void noSlicerBlock() throws Exception {
            String dsl = "// just a comment, no slicer block";
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            assertNotNull(opts);
            assertNull(opts.getField());
            assertTrue(opts.getNamedOptions().isEmpty());
        }

        @Test
        @DisplayName("`defaultSelected` — the word it replaced — throws (no alias)")
        void oldDefaultSelectedThrows() {
            String dsl = """
                slicer('f') {
                    field 'Country'
                    defaultSelected 'Germany'
                }
                """;
            assertThrows(Exception.class, () ->
                SlicerOptionsParser.parseGroovySlicerDslCode(dsl),
                "one canonical form: the parser is strict, so the old word is a typo");
        }

        @Test
        @DisplayName("`multiSelect` — the word it replaced — throws (no alias)")
        void oldMultiSelectThrows() {
            String dsl = """
                slicer('f') {
                    field 'Country'
                    multiSelect false
                }
                """;
            assertThrows(Exception.class, () ->
                SlicerOptionsParser.parseGroovySlicerDslCode(dsl));
        }

        @Test
        @DisplayName("Invalid control value throws")
        void invalidControlValue() {
            String dsl = """
                slicer('f') {
                    field 'Country'
                    control 'dropdown'
                }
                """;
            assertThrows(Exception.class, () ->
                SlicerOptionsParser.parseGroovySlicerDslCode(dsl));
        }
    }

    @Nested
    @DisplayName("BOUNDARIES — edge cases for field values and limits")
    class Boundaries {

        @Test
        @DisplayName("Field with spaces is preserved")
        void fieldWithSpaces() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Ship Country'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("Ship Country", named.getField());
        }

        @Test
        @DisplayName("maxValues zero is accepted")
        void maxValuesZero() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Category'
                    maxValues 0
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(0, named.getMaxValues());
        }

        @Test
        @DisplayName("maxValues very large number")
        void maxValuesLarge() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Category'
                    maxValues 100000
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(100000, named.getMaxValues());
        }

        @Test
        @DisplayName("Empty string field is stored as empty")
        void emptyStringField() throws Exception {
            String dsl = """
                slicer('f') {
                    field ''
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("", named.getField());
        }

        @Test
        @DisplayName("Label with special characters")
        void labelSpecialChars() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'col1'
                    label 'Revenue ($)'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
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
                slicer('f') {
                    field 'FirstField'
                    field 'SecondField'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals("SecondField", named.getField());
        }

        @Test
        @DisplayName("Calling defaultValue twice — values accumulate (append)")
        void defaultValueCalledTwice() throws Exception {
            String dsl = """
                slicer('f') {
                    field 'Country'
                    defaultValue 'Germany'
                    defaultValue 'France'
                }
                """;
            SlicerOptions named = SlicerOptionsParser.parseGroovySlicerDslCode(dsl)
                    .getNamedOptions().get("f");
            assertEquals(List.of("Germany", "France"), named.getDefaultValue());
        }

        @Test
        @DisplayName("Same named block ID used twice — second overwrites first")
        void duplicateNamedBlockId() throws Exception {
            String dsl = """
                slicer('dup') {
                    field 'FirstField'
                    label 'First'
                }
                slicer('dup') {
                    field 'SecondField'
                    label 'Second'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
            assertEquals(1, opts.getNamedOptions().size());
            assertEquals("SecondField", opts.getNamedOptions().get("dup").getField());
            assertEquals("Second", opts.getNamedOptions().get("dup").getLabel());
        }

        @Test
        @DisplayName("Mixed named and unnamed blocks coexist")
        void mixedNamedAndUnnamed() throws Exception {
            String dsl = """
                slicer {
                    field 'UnnamedField'
                    label 'Unnamed'
                }
                slicer('named1') {
                    field 'NamedField'
                    label 'Named'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);
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
        @DisplayName("Northwind dashboard — country + category slicers")
        void northwindDashboard() throws Exception {
            String dsl = """
                slicer('countryFilter') {
                    field 'ShipCountry'
                    label 'Ship Country'
                    showCount true
                    sort 'count_desc'
                }

                slicer('categoryFilter') {
                    field 'CategoryName'
                    label 'Product Category'
                    sort 'asc'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);

            SlicerOptions country = opts.getNamedOptions().get("countryFilter");
            assertEquals("ShipCountry", country.getField());
            assertEquals("Ship Country", country.getLabel());
            assertTrue(country.isShowCount());
            assertEquals("count_desc", country.getSort());

            SlicerOptions category = opts.getNamedOptions().get("categoryFilter");
            assertEquals("CategoryName", category.getField());
            assertEquals("Product Category", category.getLabel());
            assertEquals("asc", category.getSort());
        }

        @Test
        @DisplayName("Sales dashboard — year with descending sort + region with defaults")
        void salesDashboard() throws Exception {
            String dsl = """
                slicer('yearFilter') {
                    field 'OrderYear'
                    label 'Year'
                    sort 'desc'
                    defaultValue '2024'
                    control 'select'
                }

                slicer('regionFilter') {
                    field 'Region'
                    label 'Region'
                    height '200px'
                }
                """;
            SlicerOptions opts = SlicerOptionsParser.parseGroovySlicerDslCode(dsl);

            SlicerOptions year = opts.getNamedOptions().get("yearFilter");
            assertEquals("desc", year.getSort());
            assertEquals(List.of("2024"), year.getDefaultValue());
            assertEquals(SlicerOptions.CONTROL_SELECT, year.getControl());

            SlicerOptions region = opts.getNamedOptions().get("regionFilter");
            assertEquals("200px", region.getHeight());
            assertEquals(SlicerOptions.CONTROL_MULTISELECT, region.getControl()); // default
        }
    }
}
