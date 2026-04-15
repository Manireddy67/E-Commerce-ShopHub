// Enhanced add to cart functionality
function addToCart(productId, button) {
  const originalText = button.innerHTML;
  
  // Show loading state
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
  button.disabled = true;
  
  fetch('/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId, quantity: 1 })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      button.innerHTML = '<i class="fas fa-check"></i> Added!';
      button.style.background = '#28a745';
      showNotification('Product added to cart successfully!', 'success');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
        button.disabled = false;
      }, 2000);
    }
  })
  .catch(err => {
    console.error(err);
    button.innerHTML = originalText;
    button.disabled = false;
    showNotification('Failed to add product to cart', 'error');
  });
}

function addToCartWithQuantity(productId) {
  const quantity = document.getElementById('quantity').value;
  fetch('/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId, quantity: parseInt(quantity) })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showNotification('Product added to cart!');
      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);
    }
  })
  .catch(err => console.error(err));
}

function removeFromCart(productId) {
  fetch('/cart/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      location.reload();
    }
  })
  .catch(err => console.error(err));
}

function checkout() {
  // Redirect to checkout page instead of placing order directly
  window.location.href = '/checkout';
}

// Enhanced notification system
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
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}


// Filter products by category
function filterProducts(category) {
  const products = document.querySelectorAll('.product-card');
  const buttons = document.querySelectorAll('.filter-btn');
  
  // Update active button
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Filter products
  products.forEach(product => {
    if (category === 'all' || product.dataset.category === category) {
      product.classList.remove('hidden');
    } else {
      product.classList.add('hidden');
    }
  });
}

// Wishlist functionality
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

function toggleWishlist(productId, button) {
  const isWishlisted = wishlist.includes(productId);
  
  if (isWishlisted) {
    wishlist = wishlist.filter(id => id !== productId);
    button.innerHTML = '<i class="far fa-heart"></i>';
    button.style.color = '#666';
    showNotification('Removed from wishlist', 'info');
  } else {
    wishlist.push(productId);
    button.innerHTML = '<i class="fas fa-heart"></i>';
    button.style.color = '#ff6b35';
    showNotification('Added to wishlist', 'success');
  }
  
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Initialize buttons and event listeners on page load
document.addEventListener('DOMContentLoaded', function() {
  // Add to cart button event listeners
  const addToCartButtons = document.querySelectorAll('.btn-add-cart');
  addToCartButtons.forEach(button => {
    const productId = parseInt(button.getAttribute('data-product-id'));
    button.addEventListener('click', function() {
      addToCart(productId, button);
    });
  });

  // Wishlist button event listeners
  const wishlistButtons = document.querySelectorAll('.btn-wishlist');
  wishlistButtons.forEach(button => {
    const productId = parseInt(button.getAttribute('data-product-id'));
    
    // Initialize wishlist state
    if (wishlist.includes(productId)) {
      button.innerHTML = '<i class="fas fa-heart"></i>';
      button.style.color = '#ff6b35';
    }
    
    // Add click event listener
    button.addEventListener('click', function() {
      toggleWishlist(productId, button);
    });
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Enhanced filter animation
function filterProducts(category) {
  const products = document.querySelectorAll('.product-card');
  const buttons = document.querySelectorAll('.filter-btn');
  
  // Update active button
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Add fade out animation
  products.forEach(product => {
    product.style.opacity = '0.3';
    product.style.transform = 'scale(0.95)';
  });
  
  setTimeout(() => {
    // Filter products
    products.forEach(product => {
      if (category === 'all' || product.dataset.category === category) {
        product.classList.remove('hidden');
        product.style.opacity = '1';
        product.style.transform = 'scale(1)';
      } else {
        product.classList.add('hidden');
      }
    });
  }, 200);
}

// Load more products functionality
function loadMoreProducts() {
  const button = document.querySelector('.load-more-btn');
  const originalText = button.innerHTML;
  
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  button.disabled = true;
  
  // Simulate loading (in a real app, this would fetch from server)
  setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
    showNotification('No more products to load', 'info');
  }, 1500);
}

// Add event listener for load more button
document.addEventListener('DOMContentLoaded', function() {
  const loadMoreBtn = document.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreProducts);
  }
});

// Image lazy loading
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.src;
          img.classList.remove('loading');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => {
      img.classList.add('loading');
      imageObserver.observe(img);
    });
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .product-card {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  .product-card.hidden {
    display: none;
  }
`;
document.head.appendChild(style);