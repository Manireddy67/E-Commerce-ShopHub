// ══════════════════════════════════════════════════════
//  ShopHub Checkout + Payment Gateway Logic
// ══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {

  // ── Input formatters ──────────────────────────────
  const phone   = document.getElementById('phone');
  const pincode = document.getElementById('pincode');
  if (phone)   phone.addEventListener('input',   e => { e.target.value = e.target.value.replace(/\D/g,'').slice(0,10); });
  if (pincode) pincode.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g,'').slice(0,6); });

  // Card number formatter inside gateway
  document.addEventListener('input', function(e) {
    if (e.target.id === 'pgCardNumber') {
      let v = e.target.value.replace(/\D/g,'').slice(0,16);
      e.target.value = v.match(/.{1,4}/g)?.join('  ') || v;
    }
    if (e.target.id === 'pgExpiry') {
      let v = e.target.value.replace(/\D/g,'');
      if (v.length >= 2) v = v.slice(0,2) + ' / ' + v.slice(2,4);
      e.target.value = v;
    }
    if (e.target.id === 'pgCvv') {
      e.target.value = e.target.value.replace(/\D/g,'').slice(0,4);
    }
  });

  // ── Collect shipping details ──────────────────────
  function getShippingDetails() {
    return {
      firstName : document.getElementById('firstName').value.trim(),
      lastName  : document.getElementById('lastName').value.trim(),
      email     : document.getElementById('email').value.trim(),
      phone     : document.getElementById('phone').value.trim(),
      address   : document.getElementById('address').value.trim(),
      city      : document.getElementById('city').value.trim(),
      state     : document.getElementById('state').value,
      pincode   : document.getElementById('pincode').value.trim(),
      landmark  : document.getElementById('landmark').value.trim()
    };
  }

  // ── Validate shipping form ────────────────────────
  function validateShipping() {
    const d = getShippingDetails();
    if (!d.firstName || !d.lastName) { showAlert('Please enter your full name.'); return false; }
    if (!d.phone || !/^[0-9]{10}$/.test(d.phone)) { showAlert('Enter a valid 10-digit phone number.'); return false; }
    if (!d.address) { showAlert('Please enter your street address.'); return false; }
    if (!d.city)    { showAlert('Please enter your city.'); return false; }
    if (!d.state)   { showAlert('Please select your state.'); return false; }
    if (!d.pincode || !/^[0-9]{6}$/.test(d.pincode)) { showAlert('Enter a valid 6-digit PIN code.'); return false; }
    return true;
  }

  function showAlert(msg) {
    // Use a nicer inline alert instead of browser alert
    let box = document.getElementById('checkoutAlert');
    if (!box) {
      box = document.createElement('div');
      box.id = 'checkoutAlert';
      box.style.cssText = 'background:#fee;border:1px solid #fcc;color:#c00;padding:0.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem;';
      document.querySelector('.checkout-form').prepend(box);
    }
    box.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + msg;
    box.style.display = 'flex';
    setTimeout(() => { box.style.display = 'none'; }, 4000);
    window.scrollTo({ top: box.offsetTop - 100, behavior: 'smooth' });
  }

  // ── Main form submit ──────────────────────────────
  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateShipping()) return;

      const method = document.querySelector('input[name="paymentMethod"]:checked').value;

      if (method === 'cod') {
        // COD — place order directly
        placeOrder('cod', null);
      } else {
        // Online — open payment gateway
        openGateway();
      }
    });
  }

  // ── Place order (final API call) ──────────────────
  function placeOrder(paymentMethod, paymentRef) {
    const btn = document.getElementById('placeOrderBtn');
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...'; btn.disabled = true; }

    fetch('/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethod,
        paymentRef: paymentRef || null,
        shippingDetails: getShippingDetails()
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/order-confirmation/' + data.orderId;
      } else {
        if (btn) { btn.innerHTML = '<i class="fas fa-lock"></i> Place Order'; btn.disabled = false; }
        showAlert(data.message || 'Something went wrong. Please try again.');
      }
    })
    .catch(() => {
      if (btn) { btn.innerHTML = '<i class="fas fa-lock"></i> Place Order'; btn.disabled = false; }
      showAlert('Network error. Please try again.');
    });
  }

  // ══════════════════════════════════════════════════
  //  PAYMENT GATEWAY
  // ══════════════════════════════════════════════════

  const overlay    = document.getElementById('paymentGateway');
  const pgClose    = document.getElementById('pgClose');
  const pgTabs     = document.querySelectorAll('.pg-tab');
  const pgContents = document.querySelectorAll('.pg-tab-content');
  const pgProcessing = document.getElementById('pgProcessing');
  const pgSuccess    = document.getElementById('pgSuccess');
  const pgBody       = document.getElementById('pgBody');
  const pgTabsBar    = document.getElementById('pgTabs');

  // Get total amount from page
  function getTotal() {
    const amountEl = document.querySelector('.final-total span:last-child');
    if (!amountEl) return 0;
    return amountEl.textContent.replace(/[₹,]/g,'').trim();
  }

  function openGateway() {
    const total = getTotal();
    document.getElementById('pgAmount').textContent = '₹' + Number(total).toLocaleString('en-IN');
    document.querySelectorAll('.pg-btn-amount').forEach(el => {
      el.textContent = Number(total).toLocaleString('en-IN');
    });
    document.getElementById('pgSuccessAmount').textContent = Number(total).toLocaleString('en-IN');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset to card tab
    switchTab('card');
    pgProcessing.style.display = 'none';
    pgSuccess.style.display = 'none';
    pgBody.style.display = 'block';
    pgTabsBar.style.display = 'flex';
  }

  function closeGateway() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (pgClose) pgClose.addEventListener('click', closeGateway);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeGateway();
  });

  // Tab switching
  pgTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      switchTab(this.dataset.tab);
    });
  });

  function switchTab(name) {
    pgTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    pgContents.forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
  }

  // ── UPI verify ────────────────────────────────────
  const verifyBtn = document.getElementById('pgVerifyUpi');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', function() {
      const upiId = document.getElementById('pgUpiId').value.trim();
      if (!upiId || !upiId.includes('@')) {
        document.getElementById('pgUpiId').style.borderColor = '#e74c3c';
        return;
      }
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      setTimeout(() => {
        this.innerHTML = '<i class="fas fa-check"></i> Verified';
        this.style.background = '#27ae60';
        document.getElementById('pgUpiVerified').style.display = 'flex';
        document.getElementById('pgUpiId').style.borderColor = '#27ae60';
      }, 1200);
    });
  }

  // ── UPI app buttons ───────────────────────────────
  document.querySelectorAll('.pg-upi-app').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.pg-upi-app').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('pgUpiId').value = '';
      document.getElementById('pgUpiVerified').style.display = 'none';
    });
  });

  // ── Bank buttons ──────────────────────────────────
  document.querySelectorAll('.pg-bank-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.pg-bank-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      const bank = this.dataset.bank;
      document.getElementById('pgBankName').textContent = bank;
      document.getElementById('pgSelectedBank').style.display = 'flex';
      document.getElementById('pgPayBank').style.display = 'block';
    });
  });

  // ── Wallet buttons ────────────────────────────────
  document.querySelectorAll('.pg-wallet-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.pg-wallet-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      const wallet = this.dataset.wallet;
      document.getElementById('pgWalletName').textContent = wallet;
      document.getElementById('pgSelectedWallet').style.display = 'flex';
      document.getElementById('pgPayWallet').style.display = 'block';
    });
  });

  // ── Payment processing simulation ────────────────
  function processPayment(method, ref) {
    pgBody.style.display = 'none';
    pgTabsBar.style.display = 'none';
    pgProcessing.style.display = 'flex';

    const messages = [
      'Connecting to payment server...',
      'Verifying payment details...',
      'Authenticating transaction...',
      'Confirming with bank...',
      'Almost done...'
    ];

    const fill = document.getElementById('pgProgressFill');
    const msg  = document.getElementById('pgProcessingMsg');
    let step = 0;
    fill.style.width = '0%';

    const interval = setInterval(() => {
      step++;
      fill.style.width = (step * 20) + '%';
      if (messages[step - 1]) msg.textContent = messages[step - 1];
      if (step >= 5) {
        clearInterval(interval);
        setTimeout(() => showSuccess(method, ref), 500);
      }
    }, 600);
  }

  function showSuccess(method, ref) {
    pgProcessing.style.display = 'none';
    pgSuccess.style.display = 'flex';
    // Generate fake transaction ID
    const txnId = 'SHP' + Date.now().toString().slice(-8).toUpperCase();
    document.getElementById('pgTxnId').textContent = txnId;
    // Place the actual order after 1.5s
    setTimeout(() => {
      placeOrder(method, txnId);
    }, 1500);
  }

  // ── Pay button handlers ───────────────────────────
  document.getElementById('pgPayCard').addEventListener('click', function() {
    const num  = document.getElementById('pgCardNumber').value.replace(/\s/g,'');
    const name = document.getElementById('pgCardName').value.trim();
    const exp  = document.getElementById('pgExpiry').value.trim();
    const cvv  = document.getElementById('pgCvv').value.trim();

    if (num.length < 16) { highlightError('pgCardNumber', 'Enter valid 16-digit card number'); return; }
    if (!name)           { highlightError('pgCardName', 'Enter cardholder name'); return; }
    if (exp.length < 7)  { highlightError('pgExpiry', 'Enter valid expiry date'); return; }
    if (cvv.length < 3)  { highlightError('pgCvv', 'Enter valid CVV'); return; }

    processPayment('card', 'CARD-' + num.slice(-4));
  });

  document.getElementById('pgPayUpi').addEventListener('click', function() {
    const selectedApp = document.querySelector('.pg-upi-app.selected');
    const upiId = document.getElementById('pgUpiId').value.trim();
    if (!selectedApp && !upiId) {
      showGatewayAlert('Please select a UPI app or enter UPI ID');
      return;
    }
    const ref = selectedApp ? selectedApp.dataset.app : upiId;
    processPayment('upi', 'UPI-' + ref);
  });

  document.getElementById('pgPayBank').addEventListener('click', function() {
    const selected = document.querySelector('.pg-bank-btn.selected');
    if (!selected) { showGatewayAlert('Please select a bank'); return; }
    processPayment('netbanking', 'NB-' + selected.dataset.bank);
  });

  document.getElementById('pgPayWallet').addEventListener('click', function() {
    const selected = document.querySelector('.pg-wallet-btn.selected');
    if (!selected) { showGatewayAlert('Please select a wallet'); return; }
    processPayment('wallet', 'WLT-' + selected.dataset.wallet.replace(' ',''));
  });

  function highlightError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.style.borderColor = '#e74c3c';
      el.focus();
      el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
    }
    showGatewayAlert(msg);
  }

  function showGatewayAlert(msg) {
    let box = document.getElementById('pgAlert');
    if (!box) {
      box = document.createElement('div');
      box.id = 'pgAlert';
      box.style.cssText = 'background:#fee;border:1px solid #fcc;color:#c00;padding:0.6rem 1rem;border-radius:8px;margin:0 1.5rem 1rem;font-size:0.85rem;display:flex;align-items:center;gap:0.5rem;';
      document.querySelector('.pg-body').prepend(box);
    }
    box.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + msg;
    box.style.display = 'flex';
    setTimeout(() => { box.style.display = 'none'; }, 3000);
  }

});
