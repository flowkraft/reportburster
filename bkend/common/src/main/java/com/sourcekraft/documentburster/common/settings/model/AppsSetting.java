public static class AppSetting extends DumpToString {
        private static final long serialVersionUID = 1L;

        @XmlAttribute
        public int index;

        @XmlValue
        public String value;
    }