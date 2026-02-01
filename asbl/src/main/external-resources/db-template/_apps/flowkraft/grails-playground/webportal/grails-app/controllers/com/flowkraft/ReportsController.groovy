package com.flowkraft

import groovy.json.JsonOutput

class ReportsController {

    ReportBursterService reportBursterService

    def index() {
        render(view: 'index')
    }

    /**
     * New simplified view using rb-report component.
     * GET /reports/simple
     */
    def simple() {
        render(view: 'simple')
    }

    /**
     * HTMX/AJAX endpoint for fetching report data.
     * 
     * GET/POST /reports/fetchData
     * 
     * Parameters:
     * - configurationFilePath: (optional) path to configuration XML
     * - Any additional parameters are passed to the report query
     * 
     * Response: JSON with reportData, reportColumnNames, etc.
     */
    def fetchData() {
        try {
            // Extract configurationFilePath, rest are query parameters
            def configPath = params.remove('configurationFilePath') ?: params.remove('configFilePath')
            def queryParams = params.findAll { k, v -> 
                !['controller', 'action', 'format'].contains(k) 
            } as Map<String, String>
            
            def result = reportBursterService.fetchReportData(configPath, queryParams)
            render(contentType: 'application/json', text: JsonOutput.toJson(result))
        } catch (Exception e) {
            log.error("Error fetching report data", e)
            response.status = 500
            render(contentType: 'application/json', text: JsonOutput.toJson([
                error: true,
                message: e.message
            ]))
        }
    }

    /**
     * Get sample data for demo purposes.
     * GET /reports/sampleData
     */
    def sampleData() {
        render(contentType: 'application/json', text: JsonOutput.toJson(
            reportBursterService.getSampleData()
        ))
    }
}
