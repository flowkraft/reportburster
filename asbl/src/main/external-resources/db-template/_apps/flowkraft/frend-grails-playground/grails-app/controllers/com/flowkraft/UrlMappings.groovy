package com.flowkraft

class UrlMappings {
    static mappings = {
        "/$controller/$action?/$id?(.$format)?"{
            constraints {
                // apply constraints here
            }
        }

        // Dashboard pages
        "/"(controller: "home", action: "index")
        "/home"(controller: "home", action: "index")
        "/tabulator"(controller: "tabulator", action: "index")
        "/charts"(controller: "charts", action: "index")
        "/pivottables"(controller: "pivotTables", action: "index")
        "/report-parameters"(controller: "reportParameters", action: "index")
        "/reports"(controller: "reports", action: "index")

        "500"(view:'/error')
        "404"(view:'/notFound')

    }
}
