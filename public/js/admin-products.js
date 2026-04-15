// Admin Products Management

document.addEventListener('DOMContentLoaded', function() {
  // Filter listeners
  const categoryFilter = document.getElementById('categoryFilter');
  const searchProduct = document.getElementById('searchProduct');
  
  if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
  if (searchProduct) searchProduct.addEventListener('keyup', filterProducts);
  
  // Add product button
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', showAddProductModal);
  }
  
  // Edit and Delete buttons
  document.addEventListener('click', function(e) {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');
    
    if (editBtn) {
      const productId = editBtn.dataset.productId;
      editProduct(productId);
    }
    
    if (deleteBtn) {
      const productId = deleteBtn.dataset.productId;
      deleteProduct(productId);
    }
  });
});

function filterProducts() {
  const categoryFilter = document.getElementById('categoryFilter').value;
  const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
  const cards = document.querySelectorAll('.product-admin-card');

  cards.forEach(card => {
    const category = card.dataset.category;
    const text = card.textContent.toLowerCase();

    const categoryMatch = categoryFilter === 'all' || category === categoryFilter;
    const searchMatch = searchTerm === '' || text.includes(searchTerm);

    if (categoryMatch && searchMatch) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function showAddProductModal() {
  const modal = createProductModal({
    title: 'Add New Product',
    submitText: 'Add Product',
    product: {
      id: '',
      name: '',
      price: '',
      category: 'Electronics',
      description: '',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
    },
    onSubmit: addProduct
  });
  
  document.body.appendChild(modal);
}

function editProduct(productId) {
  fetch(`/admin/products/${productId}`)
    .then(res => res.json())
    .then(product => {
      const modal = createProductModal({
        title: 'Edit Product',
        submitText: 'Update Product',
        product: product,
        onSubmit: updateProduct
      });
      
      document.body.appendChild(modal);
    })
    .catch(err => {
      console.error(err);
      showNotification('Failed to load product details', 'error');
    });
}

function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }
  
  fetch('/admin/products/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: productId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showNotification(data.message, 'success');
      setTimeout(() => location.reload(), 1000);
    } else {
      showNotification(data.message, 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showNotification('An error occurred', 'error');
  });
}

function addProduct(formData) {
  fetch('/admin/products/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showNotification(data.message, 'success');
      setTimeout(() => location.reload(), 1000);
    } else {
      showNotification(data.message, 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showNotification('An error occurred', 'error');
  });
}

function updateProduct(formData) {
  fetch('/admin/products/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showNotification(data.message, 'success');
      setTimeout(() => location.reload(), 1000);
    } else {
      showNotification(data.message, 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showNotification('An error occurred', 'error');
  });
}

function createProductModal({ title, submitText, product, onSubmit }) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2><i class="fas fa-box"></i> ${title}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <form id="productForm">
          <input type="hidden" id="productId" value="${product.id}">
          
          <div class="form-group">
            <label for="productName">Product Name *</label>
            <input type="text" id="productName" value="${product.name}" required>
          </div>
          
          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label for="productPrice">Price (₹) *</label>
              <input type="number" id="productPrice" value="${product.price}" required min="0">
            </div>
            
            <div class="form-group">
              <label for="productCategory">Category *</label>
              <select id="productCategory" required>
                <option value="Electronics" ${product.category === 'Electronics' ? 'selected' : ''}>Electronics</option>
                <option value="Cosmetics" ${product.category === 'Cosmetics' ? 'selected' : ''}>Cosmetics</option>
                <option value="Fashion" ${product.category === 'Fashion' ? 'selected' : ''}>Fashion</option>
                <option value="Home & Kitchen" ${product.category === 'Home & Kitchen' ? 'selected' : ''}>Home & Kitchen</option>
                <option value="Sports" ${product.category === 'Sports' ? 'selected' : ''}>Sports</option>
                <option value="Books" ${product.category === 'Books' ? 'selected' : ''}>Books</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="productDescription">Description *</label>
            <textarea id="productDescription" rows="3" required>${product.description}</textarea>
          </div>
          
          <div class="form-group">
            <label for="productImage">Image URL *</label>
            <input type="url" id="productImage" value="${product.image}" required>
            <small>Enter a valid image URL (e.g., from Unsplash)</small>
          </div>
          
          <div class="form-actions" style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">
              <i class="fas fa-save"></i> ${submitText}
            </button>
            <button type="button" class="btn" style="flex: 1; background: #95a5a6;" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Form submission
  const form = modal.querySelector('#productForm');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
      id: document.getElementById('productId').value,
      name: document.getElementById('productName').value,
      price: document.getElementById('productPrice').value,
      category: document.getElementById('productCategory').value,
      description: document.getElementById('productDescription').value,
      image: document.getElementById('productImage').value
    };
    
    modal.remove();
    onSubmit(formData);
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  return modal;
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
