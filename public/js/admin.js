// Admin panel functionality

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Filter listeners
  const statusFilter = document.getElementById('statusFilter');
  const paymentFilter = document.getElementById('paymentFilter');
  const searchOrder = document.getElementById('searchOrder');
  
  if (statusFilter) statusFilter.addEventListener('change', filterOrders);
  if (paymentFilter) paymentFilter.addEventListener('change', filterOrders);
  if (searchOrder) searchOrder.addEventListener('keyup', filterOrders);
  
  // Status select listeners
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('status-select')) {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      updateOrderStatus(orderId, newStatus, e.target);
    }
  });
  
  // View order button listeners
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-view-order');
    if (btn) {
      const orderId = btn.dataset.orderId;
      viewOrderDetails(orderId);
    }
  });
});

function filterOrders() {
  const statusFilter = document.getElementById('statusFilter').value;
  const paymentFilter = document.getElementById('paymentFilter').value;
  const searchTerm = document.getElementById('searchOrder').value.toLowerCase();
  const rows = document.querySelectorAll('#ordersTableBody tr');

  rows.forEach(row => {
    const status = row.dataset.status;
    const payment = row.dataset.payment;
    const text = row.textContent.toLowerCase();

    const statusMatch = statusFilter === 'all' || status === statusFilter;
    const paymentMatch = paymentFilter === 'all' || payment === paymentFilter;
    const searchMatch = searchTerm === '' || text.includes(searchTerm);

    if (statusMatch && paymentMatch && searchMatch) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function updateOrderStatus(orderId, newStatus, selectElement) {
  fetch('/admin/orders/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId, status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showNotification('Order status updated successfully', 'success');
      // Update the row's data attribute
      const row = selectElement.closest('tr');
      row.dataset.status = newStatus;
    } else {
      showNotification('Failed to update order status', 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showNotification('An error occurred', 'error');
  });
}

function viewOrderDetails(orderId) {
  fetch(`/admin/orders/${orderId}`)
    .then(res => res.json())
    .then(order => {
      showOrderModal(order);
    })
    .catch(err => {
      console.error(err);
      showNotification('Failed to load order details', 'error');
    });
}

function showOrderModal(order) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="fas fa-receipt"></i> Order #${order.id}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="order-detail-section">
          <h3><i class="fas fa-user"></i> Customer Information</h3>
          <p><strong>Name:</strong> ${order.customerName}</p>
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
        </div>

        <div class="order-detail-section">
          <h3><i class="fas fa-map-marker-alt"></i> Shipping Address</h3>
          <p>${order.shippingAddress.address}</p>
          <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
          ${order.shippingAddress.landmark ? `<p>Landmark: ${order.shippingAddress.landmark}</p>` : ''}
        </div>

        <div class="order-detail-section">
          <h3><i class="fas fa-shopping-bag"></i> Order Items</h3>
          <table class="order-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price.toLocaleString('en-IN')}</td>
                  <td>₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="order-detail-section">
          <h3><i class="fas fa-credit-card"></i> Payment Information</h3>
          <p><strong>Method:</strong> <span class="payment-badge ${order.paymentMethod}">${order.paymentMethod.toUpperCase()}</span></p>
          <p><strong>Subtotal:</strong> ₹${order.subtotal.toLocaleString('en-IN')}</p>
          <p><strong>Tax (GST 18%):</strong> ₹${order.tax.toLocaleString('en-IN')}</p>
          <p><strong>Total:</strong> <strong>₹${order.total.toLocaleString('en-IN')}</strong></p>
        </div>

        <div class="order-detail-section">
          <h3><i class="fas fa-info-circle"></i> Order Status</h3>
          <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
          <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 5px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
