

// Use global available in Node 18+ or standard fetch
// import fetch from 'node-fetch'; // Removed to avoid missing module error

// If running in environment without fetch (older node), would need polyfill.
// Assuming Node 18+ for this project.
// Since api.ts uses fetch, we need to polyfill it or ensure we run this in an environment that has it.
// Node 18+ has fetch. We'll assume the environment has it or we might need a custom script that does raw HTTP.

// Actually, relying on src/lib/api.ts might be tricky if it has browser-specific dependencies.
// Let's write a standalone script using fetch to be safe and self-contained.

const API_URL = 'http://localhost:8081'; // Assuming default port
const ADMIN_EMAIL = 'admin@visionary.com';
const ADMIN_PASSWORD = 'admin123';

async function runVerification() {
    console.log('Starting Manual Payment Verification Flow...');

    try {
        // 1. Login as Admin
        console.log('1. Logging in as Admin...');
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
        const loginData: any = await loginRes.json();
        const token = loginData.token;
        console.log('   Login successful. Token acquired.');

        // 2. Enable Manual Payment Settings
        console.log('2. Enabling Manual Payment Settings...');
        const settingsPayload = {
            enabled: true,
            upiId: 'test@upi',
            bankDetails: 'Test Bank\nAC: 123456789\nIFSC: TEST0001',
            instructions: 'Please pay and upload proof.',
            qrCode: ''
        };

        const settingsRes = await fetch(`${API_URL}/api/settings/manual_payment_settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settingsPayload)
        });

        if (!settingsRes.ok) throw new Error(`Settings update failed: ${await settingsRes.text()}`);
        console.log('   Settings enabled.');

        // 3. Create a Manual Order
        console.log('3. Creating a Manual Payment Order...');
        const orderPayload = {
            items: [{
                productId: 'test-product-id', // We might need a real product ID, but backend might not validate existence strictly for this test or we can fetch one.
                title: 'Test Product',
                price: 100,
                quantity: 1,
                image: 'test.jpg'
            }],
            total: 100,
            shippingAddress: {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@user.com',
                phone: '1234567890',
                address: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            },
            paymentMethod: 'manual',
            paymentProof: '/uploads/test_proof.jpg',
            utrNumber: 'UTR_TEST_123'
        };

        // We need a real product ID usually. Let's fetch products first.
        const productRes = await fetch(`${API_URL}/api/products`);
        const products: any = await productRes.json();
        if (products.length > 0) {
            orderPayload.items[0].productId = products[0]._id;
            orderPayload.items[0].title = products[0].title;
            orderPayload.items[0].price = products[0].price;
            orderPayload.total = products[0].price;
        }

        const createOrderRes = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Admin placing order for self or just testing authenticated endpoint
            },
            body: JSON.stringify(orderPayload)
        });

        if (!createOrderRes.ok) throw new Error(`Order creation failed: ${await createOrderRes.text()}`);
        const orderData: any = await createOrderRes.json();
        const orderId = orderData.orderId; // backend usually returns orderId, check schema

        // If the backend returns { success: true, orderId: "..." }
        // Let's verify format based on previous file reads
        // routes/orders.ts: res.status(201).json({ success: true, orderId: newOrder._id })

        console.log(`   Order created. ID: ${orderId}`);

        // 4. Verify Order Status (Should be Pending)
        console.log('4. Verifying initial order status...');
        const getOrderRes = await fetch(`${API_URL}/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orderDetails: any = await getOrderRes.json();

        if (orderDetails.paymentMethod !== 'manual') throw new Error('Payment method mismatch');
        if (orderDetails.verificationStatus !== 'pending') throw new Error(`Verification status mismatch: ${orderDetails.verificationStatus}`);
        console.log('   Initial status verified: Pending/Pending');

        // 5. Admin Approves Payment
        console.log('5. Approving Payment as Admin...');
        const verifyRes = await fetch(`${API_URL}/api/orders/${orderId}/verify-manual-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: 'approve', note: 'Automated verification test' })
        });

        if (!verifyRes.ok) throw new Error(`Verification failed: ${await verifyRes.text()}`);
        console.log('   Payment approved.');

        // 6. Verify Final Status
        console.log('6. Verifying final order status...');
        const finalOrderRes = await fetch(`${API_URL}/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const finalOrder: any = await finalOrderRes.json();

        if (finalOrder.verificationStatus !== 'approved') throw new Error('Verification status is not approved');
        if (finalOrder.paymentStatus !== 'completed') throw new Error('Payment status is not completed');
        if (finalOrder.orderStatus !== 'confirmed') throw new Error('Order status is not confirmed');

        console.log('   Final status verified: Approved/Completed/Confirmed');
        console.log('SUCCESS: Manual Payment Flow Verified!');

    } catch (error: any) {
        console.error('VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
}

runVerification();
