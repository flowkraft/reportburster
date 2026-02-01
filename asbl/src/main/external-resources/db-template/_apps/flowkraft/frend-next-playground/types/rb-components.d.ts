declare namespace JSX {
  interface IntrinsicElements {
    "rb-tabulator": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "report-code"?: string
        "api-base-url"?: string
        "api-key"?: string
      },
      HTMLElement
    >
    "rb-chart": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "report-code"?: string
        "api-base-url"?: string
        "api-key"?: string
      },
      HTMLElement
    >
    "rb-pivot-table": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "report-code"?: string
        "api-base-url"?: string
        "api-key"?: string
      },
      HTMLElement
    >
    "rb-parameters": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "report-code"?: string
        "api-base-url"?: string
        "api-key"?: string
      },
      HTMLElement
    >
    "rb-report": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "report-code"?: string
        "api-base-url"?: string
        "api-key"?: string
      },
      HTMLElement
    >
  }
}

export {}
