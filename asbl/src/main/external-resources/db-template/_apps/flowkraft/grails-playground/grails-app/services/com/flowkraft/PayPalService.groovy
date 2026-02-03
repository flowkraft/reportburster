package com.flowkraft

import grails.gorm.transactions.Transactional
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

/**
 * PayPal Payment Service
 * Handles PayPal order creation and capture
 * 
 * Based on Next.js implementation in:
 * - app/api/payments/paypal/create-order/route.ts
 * - app/api/payments/paypal/capture-order/route.ts
 */
class PayPalService {

    // Configuration - should be moved to application.yml in production
    String paypalClientId = System.getenv('PAYPAL_CLIENT_ID') ?: 'ATe_placeholder'
    String paypalClientSecret = System.getenv('PAYPAL_CLIENT_SECRET') ?: 'secret_placeholder'
    String paypalApiBase = System.getenv('PAYPAL_API_BASE') ?: 'https://api-m.sandbox.paypal.com'
    
    // Cached access token
    private String accessToken = null
    private Long tokenExpiry = 0

    /**
     * Create a PayPal order for an invoice
     * 
     * @param invoice The invoice to create order for
     * @return Map containing orderId and approval URL, or error
     */
    Map createOrder(Invoice invoice) {
        if (!invoice) {
            return [success: false, error: 'Invoice not found']
        }

        if (!invoice.isPayable()) {
            return [success: false, error: 'Invoice is not payable']
        }

        try {
            def token = getAccessToken()
            if (!token) {
                return [success: false, error: 'Failed to authenticate with PayPal']
            }

            def orderData = [
                intent: 'CAPTURE',
                purchase_units: [
                    [
                        reference_id: invoice.invoiceNumber,
                        description: "Payment for Invoice ${invoice.invoiceNumber}",
                        custom_id: invoice.id.toString(),
                        amount: [
                            currency_code: invoice.currency,
                            value: String.format('%.2f', invoice.totalAmount),
                            breakdown: [
                                item_total: [
                                    currency_code: invoice.currency,
                                    value: String.format('%.2f', invoice.subtotal)
                                ],
                                tax_total: [
                                    currency_code: invoice.currency,
                                    value: String.format('%.2f', invoice.taxAmount ?: 0)
                                ],
                                discount: [
                                    currency_code: invoice.currency,
                                    value: String.format('%.2f', invoice.discount ?: 0)
                                ]
                            ]
                        ],
                        items: [
                            [
                                name: "Invoice ${invoice.invoiceNumber}",
                                description: "Services for ${invoice.customerName}",
                                quantity: '1',
                                unit_amount: [
                                    currency_code: invoice.currency,
                                    value: String.format('%.2f', invoice.subtotal)
                                ],
                                category: 'DIGITAL_GOODS'
                            ]
                        ]
                    ]
                ],
                application_context: [
                    brand_name: 'FlowKraft',
                    landing_page: 'BILLING',
                    user_action: 'PAY_NOW',
                    return_url: "http://localhost:8080/payment/paypal/success?invoiceId=${invoice.id}",
                    cancel_url: "http://localhost:8080/payment/paypal/cancel?invoiceId=${invoice.id}"
                ]
            ]

            def response = makePayPalRequest('/v2/checkout/orders', orderData, token)

            if (response.error || response.name == 'INVALID_REQUEST') {
                log.error("PayPal error creating order: ${response}")
                return [success: false, error: response.message ?: response.error_description ?: 'Failed to create PayPal order']
            }

            // Find approval URL
            def approvalUrl = response.links?.find { it.rel == 'approve' }?.href

            return [
                success: true,
                orderId: response.id,
                approvalUrl: approvalUrl,
                status: response.status
            ]
        } catch (Exception e) {
            log.error("Exception creating PayPal order: ${e.message}", e)
            return [success: false, error: 'Failed to create PayPal order: ' + e.message]
        }
    }

    /**
     * Capture a PayPal order and update invoice status
     * 
     * @param orderId The PayPal order ID
     * @return Map with success status and invoice details
     */
    @Transactional
    Map captureOrder(String orderId) {
        if (!orderId) {
            return [success: false, error: 'Order ID required']
        }

        try {
            def token = getAccessToken()
            if (!token) {
                return [success: false, error: 'Failed to authenticate with PayPal']
            }

            def response = makePayPalRequest("/v2/checkout/orders/${orderId}/capture", [:], token)

            if (response.error || response.name == 'INVALID_REQUEST') {
                log.error("PayPal error capturing order: ${response}")
                return [success: false, error: response.message ?: 'Failed to capture PayPal order']
            }

            // Check capture status
            if (response.status != 'COMPLETED') {
                return [
                    success: false,
                    error: "Payment not completed. Status: ${response.status}",
                    status: response.status
                ]
            }

            // Find invoice from purchase unit
            def purchaseUnit = response.purchase_units?.first()
            def invoiceId = purchaseUnit?.custom_id

            if (!invoiceId) {
                return [success: false, error: 'Invoice ID not found in order']
            }

            def invoice = Invoice.get(invoiceId as Long)
            if (!invoice) {
                return [success: false, error: 'Invoice not found']
            }

            // Mark invoice as paid
            invoice.markAsPaid('paypal', orderId)
            invoice.save(flush: true)

            return [
                success: true,
                invoice: [
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    status: invoice.status,
                    paidAt: invoice.paidAt,
                    paymentReference: invoice.paymentReference
                ],
                paypalStatus: response.status
            ]
        } catch (Exception e) {
            log.error("Exception capturing PayPal order: ${e.message}", e)
            return [success: false, error: 'Failed to capture PayPal order: ' + e.message]
        }
    }

    /**
     * Get order details
     */
    Map getOrderDetails(String orderId) {
        try {
            def token = getAccessToken()
            if (!token) {
                return [success: false, error: 'Failed to authenticate']
            }

            def response = makePayPalRequest("/v2/checkout/orders/${orderId}", null, token, 'GET')
            
            if (response.error) {
                return [success: false, error: response.message]
            }

            return [
                success: true,
                status: response.status,
                orderId: response.id
            ]
        } catch (Exception e) {
            return [success: false, error: e.message]
        }
    }

    // ===== Private Helper Methods =====

    /**
     * Get PayPal access token (with caching)
     */
    private String getAccessToken() {
        // Return cached token if still valid
        if (accessToken && System.currentTimeMillis() < tokenExpiry) {
            return accessToken
        }

        try {
            def url = new URL(paypalApiBase + '/v1/oauth2/token')
            def connection = url.openConnection() as HttpURLConnection
            
            def credentials = "${paypalClientId}:${paypalClientSecret}".bytes.encodeBase64().toString()
            
            connection.requestMethod = 'POST'
            connection.setRequestProperty('Authorization', "Basic ${credentials}")
            connection.setRequestProperty('Content-Type', 'application/x-www-form-urlencoded')
            connection.doOutput = true
            
            connection.outputStream.withWriter('UTF-8') { writer ->
                writer.write('grant_type=client_credentials')
            }

            def responseCode = connection.responseCode
            if (responseCode != 200) {
                log.error("Failed to get PayPal access token: ${responseCode}")
                return null
            }

            def responseText = connection.inputStream.text
            def response = new JsonSlurper().parseText(responseText) as Map

            accessToken = response.access_token
            // Set expiry 5 minutes before actual expiry
            tokenExpiry = System.currentTimeMillis() + ((response.expires_in as Long) - 300) * 1000
            
            return accessToken
        } catch (Exception e) {
            log.error("Exception getting PayPal access token: ${e.message}", e)
            return null
        }
    }

    /**
     * Make a request to PayPal API
     */
    private Map makePayPalRequest(String endpoint, Map body, String token, String method = 'POST') {
        def url = new URL(paypalApiBase + endpoint)
        def connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = method
            connection.setRequestProperty('Authorization', "Bearer ${token}")
            connection.setRequestProperty('Content-Type', 'application/json')
            connection.doOutput = (method == 'POST')
            
            if (method == 'POST' && body) {
                connection.outputStream.withWriter('UTF-8') { writer ->
                    writer.write(JsonOutput.toJson(body))
                }
            }

            def responseCode = connection.responseCode
            def responseStream = responseCode >= 400 ? connection.errorStream : connection.inputStream
            def responseText = responseStream?.text ?: '{}'
            
            return new JsonSlurper().parseText(responseText) as Map
        } finally {
            connection.disconnect()
        }
    }
}
