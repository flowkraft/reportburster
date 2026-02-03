<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="portal"/>
    <title>Pay Invoice ${invoice?.invoiceNumber} - FlowKraft</title>
    
    <!-- Stripe.js -->
    <script src="https://js.stripe.com/v3/"></script>
    
    <!-- PayPal SDK -->
    <script src="https://www.paypal.com/sdk/js?client-id=test&currency=${invoice?.currency ?: 'USD'}"></script>
</head>
<body>

    <div class="container">
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <a href="${createLink(action: 'index')}">My Invoices</a>
                </li>
                <li class="breadcrumb-item">
                    <a href="${createLink(action: 'show', id: invoice?.id)}">${invoice?.invoiceNumber}</a>
                </li>
                <li class="breadcrumb-item active">Pay</li>
            </ol>
        </nav>

        <div class="row justify-content-center">
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header text-center">
                        <h5 class="mb-0">
                            <i class="bi bi-credit-card me-2"></i>Pay Invoice ${invoice?.invoiceNumber}
                        </h5>
                    </div>
                    <div class="card-body">
                        <!-- Invoice Summary -->
                        <div class="text-center mb-4 pb-4 border-bottom">
                            <span class="fs-1 fw-bold">${invoice?.formatAmount(invoice?.totalAmount)}</span>
                            <p class="text-muted mb-0">Total Amount Due</p>
                        </div>

                        <!-- Payment Method Tabs -->
                        <ul class="nav nav-pills nav-fill mb-4" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="stripe-tab" data-bs-toggle="pill" 
                                        data-bs-target="#stripe-panel" type="button" role="tab">
                                    <i class="bi bi-credit-card me-2"></i>Card
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="paypal-tab" data-bs-toggle="pill" 
                                        data-bs-target="#paypal-panel" type="button" role="tab">
                                    <i class="bi bi-paypal me-2"></i>PayPal
                                </button>
                            </li>
                        </ul>

                        <div class="tab-content">
                            <!-- Stripe Payment -->
                            <div class="tab-pane fade show active" id="stripe-panel" role="tabpanel">
                                <div id="stripe-payment-form">
                                    <div id="card-element" class="form-control mb-3" style="padding: 12px;"></div>
                                    <div id="card-errors" class="text-danger small mb-3" role="alert"></div>
                                    <button type="button" id="stripe-pay-btn" class="btn btn-cyan w-100 btn-lg">
                                        <i class="bi bi-lock me-2"></i> Pay ${invoice?.formatAmount(invoice?.totalAmount)}
                                    </button>
                                </div>
                            </div>

                            <!-- PayPal Payment -->
                            <div class="tab-pane fade" id="paypal-panel" role="tabpanel">
                                <div id="paypal-button-container"></div>
                            </div>
                        </div>

                        <!-- Security Note -->
                        <p class="text-muted small text-center mt-4 mb-0">
                            <i class="bi bi-shield-check me-1"></i>
                            Your payment is secured with 256-bit SSL encryption
                        </p>
                    </div>
                </div>

                <!-- Back Link -->
                <div class="text-center mt-3">
                    <a href="${createLink(action: 'show', id: invoice?.id)}" class="text-muted">
                        <i class="bi bi-arrow-left me-1"></i> Back to Invoice
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        const invoiceId = ${invoice?.id};
        const amount = ${invoice?.totalAmount};
        const currency = '${invoice?.currency ?: 'USD'}';

        // ===== STRIPE SETUP =====
        // Note: In production, use your actual Stripe publishable key
        const stripe = Stripe('pk_test_placeholder');
        const elements = stripe.elements();
        const cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1e293b',
                    '::placeholder': { color: '#94a3b8' }
                }
            }
        });
        cardElement.mount('#card-element');

        cardElement.on('change', function(event) {
            const errorDiv = document.getElementById('card-errors');
            errorDiv.textContent = event.error ? event.error.message : '';
        });

        document.getElementById('stripe-pay-btn').addEventListener('click', async function() {
            const btn = this;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

            try {
                // Create PaymentIntent
                const response = await fetch('/payment/stripe/create-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoiceId: invoiceId })
                });
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to create payment intent');
                }

                // Confirm payment
                const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
                    payment_method: { card: cardElement }
                });

                if (error) {
                    throw new Error(error.message);
                }

                if (paymentIntent.status === 'succeeded') {
                    // Confirm with server
                    await fetch('/payment/stripe/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
                    });
                    
                    window.location.href = '/invoices/' + invoiceId + '?paid=true';
                }
            } catch (error) {
                document.getElementById('card-errors').textContent = error.message;
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-lock me-2"></i> Pay \$' + amount.toFixed(2);
            }
        });

        // ===== PAYPAL SETUP =====
        paypal.Buttons({
            createOrder: async function() {
                const response = await fetch('/payment/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoiceId: invoiceId })
                });
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Failed to create PayPal order');
                }
                
                return data.orderId;
            },
            onApprove: async function(data) {
                const response = await fetch('/payment/paypal/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: data.orderID })
                });
                const result = await response.json();
                
                if (result.success) {
                    window.location.href = '/invoices/' + invoiceId + '?paid=true';
                } else {
                    alert('Payment failed: ' + (result.error || 'Unknown error'));
                }
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                alert('PayPal payment failed. Please try again.');
            }
        }).render('#paypal-button-container');
    </script>

</body>
</html>
