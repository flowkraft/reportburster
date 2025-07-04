public static class AppsSettings extends DumpToString {
        private static final long serialVersionUID = 1L;

        @XmlElement(name = "app")
        public List<AppSetting> app;
    }

    