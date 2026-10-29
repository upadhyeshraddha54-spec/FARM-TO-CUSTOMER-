document.addEventListener("DOMContentLoaded", () => {
  const starterProducts = [
    {
      id: "sample-tomato",
      name: "Fresh Tomatoes",
      category: "Vegetables",
      price: 30,
      unit: "kg",
      quantity: 100,
      sellerName: "Green Valley Farm",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "sample-potato",
      name: "Farm Potatoes",
      category: "Vegetables",
      price: 25,
      unit: "kg",
      quantity: 100,
      sellerName: "Sunrise Farms",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "sample-mango",
      name: "Seasonal Mangoes",
      category: "Fruits",
      price: 100,
      unit: "kg",
      quantity: 50,
      sellerName: "Mango Orchard",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "sample-banana",
      name: "Fresh Bananas",
      category: "Fruits",
      price: 50,
      unit: "dozen",
      quantity: 60,
      sellerName: "Green Valley Farm",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "sample-rice",
      name: "Local Rice",
      category: "Grains",
      price: 65,
      unit: "kg",
      quantity: 80,
      sellerName: "Village Grain Farm",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "sample-onion",
      name: "Red Onions",
      category: "Vegetables",
      price: 35,
      unit: "kg",
      quantity: 90,
      sellerName: "Sunrise Farms",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "sample-spinach",
      name: "Fresh Spinach",
      category: "Vegetables",
      price: 20,
      unit: "piece",
      quantity: 40,
      sellerName: "Green Valley Farm",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "sample-milk",
      name: "Fresh Milk",
      category: "Dairy",
      price: 35,
      unit: "litre",
      quantity: 30,
      sellerName: "Happy Cow Dairy",
      sellerEmail: "demo-farmer@example.com",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80"
    }
  ];

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      alert("Browser storage is unavailable. Please try another browser.");
      return false;
    }
  }

  function getProducts() {
    const stored = read("farmToHomeProducts", null);

    if (Array.isArray(stored)) {
      return [...starterProducts, ...stored];
    }

    write("farmToHomeProducts", []);
    return starterProducts;
  }

  let selectedCategory = "All";
  let cart = read("farmToHomeCart", []);
  const grid = document.getElementById("productsGrid");
  const searchInput = document.getElementById("searchInput");
  const cartPanel = document.getElementById("cartPanel");
  const cartBackdrop = document.getElementById("cartBackdrop");

  document.getElementById("year").textContent = new Date().getFullYear();

  function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function renderProducts() {
    const query = searchInput.value.trim().toLowerCase();

    const products = getProducts().filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const matchesQuery =
        `${product.name} ${product.category} ${product.sellerName}`
          .toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });

    document.getElementById("productCount").textContent =
      `${products.length} products`;

    document.getElementById("emptyProducts")
      .classList.toggle("hidden", products.length !== 0);

    grid.innerHTML = products.map((product) => {
      const image = product.image
        ? `<img class="product-image" src="${safeText(product.image)}"
             alt="${safeText(product.name)}" loading="lazy"
             onerror="this.outerHTML='<div class=&quot;product-placeholder&quot;>🌱</div>'">`
        : `<div class="product-placeholder">🌱</div>`;

      return `
        <article class="product-card">
          ${image}
          <div class="product-info">
            <span class="product-category">${safeText(product.category)}</span>
            <h3>${safeText(product.name)}</h3>
            <p class="product-seller">Sold by ${safeText(product.sellerName)}</p>
            <p class="product-price">₹${Number(product.price).toFixed(2)}
              <span class="product-unit">/ ${safeText(product.unit)}</span>
            </p>
            <p class="product-stock">${Number(product.quantity)} available</p>
            <button class="btn btn-primary add-to-cart"
              data-id="${safeText(product.id)}"
              ${Number(product.quantity) < 1 ? "disabled" : ""}>
              ${Number(product.quantity) < 1 ? "Out of stock" : "Add to Cart"}
            </button>
          </div>
        </article>`;
    }).join("");
  }

  function renderCart() {
    const allProducts = getProducts();

    cart = cart.filter((item) =>
      allProducts.some((product) => product.id === item.id)
    );

    write("farmToHomeCart", cart);

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cartCount").textContent = totalCount;

    const items = cart.map((item) => {
      const product = allProducts.find((p) => p.id === item.id);
      if (!product) return "";

      return `
        <div class="cart-item">
          <div>
            <h4>${safeText(product.name)}</h4>
            <p>₹${Number(product.price).toFixed(2)} × ${item.quantity} ${safeText(product.unit)}</p>
            <strong>₹${(Number(product.price) * item.quantity).toFixed(2)}</strong>
          </div>
          <div>
            <button data-remove="${safeText(product.id)}">Remove</button>
            <div>
              <button data-change="-1" data-id="${safeText(product.id)}">−</button>
              <span>${item.quantity}</span>
              <button data-change="1" data-id="${safeText(product.id)}">+</button>
            </div>
          </div>
        </div>`;
    }).join("");

    document.getElementById("cartItems").innerHTML =
      items || '<p class="muted">Your cart is empty.</p>';

    const total = cart.reduce((sum, item) => {
      const product = allProducts.find((p) => p.id === item.id);
      return sum + (product ? Number(product.price) * item.quantity : 0);
    }, 0);

    document.getElementById("cartTotal").textContent = `₹${total.toFixed(2)}`;
  }

  function openCart() {
    cartPanel.classList.remove("hidden");
    cartBackdrop.classList.remove("hidden");
    renderCart();
  }

  function closeCart() {
    cartPanel.classList.add("hidden");
    cartBackdrop.classList.add("hidden");
  }

  document.getElementById("cartButton").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);

  document.getElementById("searchButton").addEventListener("click", renderProducts);
  searchInput.addEventListener("input", renderProducts);

  document.querySelectorAll(".category-nav [data-category]").forEach((link) => {
    link.addEventListener("click", () => {
      selectedCategory = link.dataset.category;
      renderProducts();
    });
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".add-to-cart");
    if (!button) return;

    const product = getProducts().find((p) => p.id === button.dataset.id);
    if (!product) return;

    const existing = cart.find((item) => item.id === product.id);
    if (existing && existing.quantity >= Number(product.quantity)) {
      alert("You cannot add more than the available stock.");
      return;
    }

    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, quantity: 1 });

    if (write("farmToHomeCart", cart)) {
      renderCart();
      openCart();
    }
  });

  document.getElementById("cartItems").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove]");
    const changeButton = event.target.closest("[data-change]");

    if (removeButton) {
      cart = cart.filter((item) => item.id !== removeButton.dataset.remove);
    } else if (changeButton) {
      const item = cart.find((entry) => entry.id === changeButton.dataset.id);
      const product = getProducts().find((p) => p.id === changeButton.dataset.id);

      if (!item || !product) return;

      const nextQuantity = item.quantity + Number(changeButton.dataset.change);

      if (nextQuantity < 1) {
        cart = cart.filter((entry) => entry.id !== item.id);
      } else if (nextQuantity > Number(product.quantity)) {
        alert("You cannot add more than the available stock.");
        return;
      } else {
        item.quantity = nextQuantity;
      }
    } else {
      return;
    }

    write("farmToHomeCart", cart);
    renderCart();
  });

  document.getElementById("checkoutButton").addEventListener("click", () => {
    if (cart.length === 0) {
      document.getElementById("cartMessage").textContent = "Your cart is empty.";
      return;
    }

    const session = read("farmToHomeDemoSession", null);

    if (!session || session.role !== "buyer") {
      sessionStorage.setItem("farmToHomeReturnToCheckout", "yes");
      window.location.href = "buyer-login.html";
      return;
    }

    document.getElementById("cartMessage").textContent =
      "Demo checkout only. No payment or order has been placed.";
    document.getElementById("cartMessage").className = "form-message error";
  });

  renderProducts();
  renderCart();
});