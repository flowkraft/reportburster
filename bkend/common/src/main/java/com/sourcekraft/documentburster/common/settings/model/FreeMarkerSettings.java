package com.sourcekraft.documentburster.common.settings.model;

import com.sourcekraft.documentburster.utils.DumpToString;

public class FreeMarkerSettings extends DumpToString {
    
    private static final long serialVersionUID = 1L;
    
    // NO LOCALE HERE - will use the existing <locale> section
    
    // Date format (optional - uses locale default if not specified)
    public String dateformat;
    
    // Time format (optional)
    public String timeformat;
    
    // DateTime format (optional)
    public String datetimeformat;
    
    // Number format (optional)
    public String numberformat;
    
    // Timezone
    public String timezone;
    
}