document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function message(id, text, type = "error") {
    const element = $(id);
    if (!element) return;
    element.textContent = text;
    element.className = `form-message ${type}`;
  }

  function accounts() {
    return read("farmToHomeAccounts", []);
  }

  function products() {
    return read("farmToHomeProducts", []);
  }

  function session() {
    return read("farmToHomeDemoSession", null);
  }

  function startSession(account) {
    return save("farmToHomeDemoSession", {
      name: account.name,
      email: account.email,
      role: account.role
    });
  }

  function switchTabs(loginForm, registerForm, loginTab, registerTab, mode) {
    if (!loginForm || !registerForm) return;

    const loginActive = mode === "login";
    loginForm.classList.toggle("hidden", !loginActive);
    registerForm.classList.toggle("hidden", loginActive);
    loginTab?.classList.toggle("active", loginActive);
    registerTab?.classList.toggle("active", !loginActive);
  }

  function setupRegistration({
    formId, nameId, emailId, phoneId, passwordId, role, messageId,
    locationId
  }) {
    const form = $(formId);
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = $(nameId).value.trim();
      const email = $(emailId).value.trim().toLowerCase();
      const phone = $(phoneId).value.trim();
      const password = $(passwordId).value;
      const location = locationId ? $(locationId).value.trim() : "";

      if (!name || !email || !phone || !password ||
          (locationId && !location)) {
        message(messageId, "Please fill in all required fields.");
        return;
      }

      if (!/^[0-9]{10}$/.test(phone)) {
        message(messageId, "Enter a valid 10-digit phone number.");
        return;
      }

      if (password.length < 6) {
        message(messageId, "Password must have at least 6 characters.");
        return;
      }

      const allAccounts = accounts();

      if (allAccounts.some((account) => account.email === email)) {
        message(messageId, "This email is already registered. Please log in.");
        return;
      }

      const account = {
        id: `account-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        email,
        phone,
        location,
        role,
        password
      };

      allAccounts.push(account);

      if (!save("farmToHomeAccounts", allAccounts)) {
        message(messageId, "Unable to save your account in this browser.");
        return;
      }

      form.reset();
      message(messageId, "Registration successful. You can now log in.", "success");

      if (role === "seller") {
        const loginEmail = $("sellerLoginEmail");
        if (loginEmail) loginEmail.value = email;
        switchTabs($("sellerLoginForm"), $("sellerRegisterForm"),
          $("loginTab"), $("registerTab"), "login");
      } else {
        const loginEmail = $("buyerLoginEmail");
        if (loginEmail) loginEmail.value = email;
        switchTabs($("buyerLoginForm"), $("buyerRegisterForm"),
          $("loginTab"), $("registerTab"), "login");
      }
    });
  }

  function setupLogin({ formId, emailId, passwordId, role, messageId }) {
    const form = $(formId);
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = $(emailId).value.trim().toLowerCase();
      const password = $(passwordId).value;

      const account = accounts().find((item) =>
        item.email === email &&
        item.password === password &&
        item.role === role
      );

      if (!account) {
        message(messageId, "Login failed. Check your details or register first.");
        return;
      }

      if (!startSession(account)) {
        message(messageId, "Could not start your session.");
        return;
      }

      if (role === "seller") {
        showSellerDashboard(account);
      } else {
        message(messageId, "Login successful! Returning to the shopping page.", "success");

        const goToCheckout =
          sessionStorage.getItem("farmToHomeReturnToCheckout") === "yes";

        if (goToCheckout) {
          sessionStorage.removeItem("farmToHomeReturnToCheckout");
          window.location.href = "index.html#products";
        } else {
          window.location.href = "index.html";
        }
      }
    });
  }

  // Buyer tabs and forms
  if ($("buyerLoginForm")) {
    $("loginTab").addEventListener("click", () =>
      switchTabs($("buyerLoginForm"), $("buyerRegisterForm"),
        $("loginTab"), $("registerTab"), "login"));

    $("registerTab").addEventListener("click", () =>
      switchTabs($("buyerLoginForm"), $("buyerRegisterForm"),
        $("loginTab"), $("registerTab"), "register"));

    setupRegistration({
      formId: "buyerRegisterForm",
      nameId: "buyerName",
      emailId: "buyerRegisterEmail",
      phoneId: "buyerPhone",
      passwordId: "buyerRegisterPassword",
      role: "buyer",
      messageId: "buyerRegisterMessage"
    });

    setupLogin({
      formId: "buyerLoginForm",
      emailId: "buyerLoginEmail",
      passwordId: "buyerLoginPassword",
      role: "buyer",
      messageId: "buyerLoginMessage"
    });
  }

  // Seller login and registration
  if ($("sellerLoginForm")) {
    $("loginTab").addEventListener("click", () =>
      switchTabs($("sellerLoginForm"), $("sellerRegisterForm"),
        $("loginTab"), $("registerTab"), "login"));

    $("registerTab").addEventListener("click", () =>
      switchTabs($("sellerLoginForm"), $("sellerRegisterForm"),
        $("loginTab"), $("registerTab"), "register"));

    setupRegistration({
      formId: "sellerRegisterForm",
      nameId: "sellerName",
      emailId: "sellerRegisterEmail",
      phoneId: "sellerPhone",
      passwordId: "sellerRegisterPassword",
      locationId: "sellerLocation",
      role: "seller",
      messageId: "sellerRegisterMessage"
    });

    setupLogin({
      formId: "sellerLoginForm",
      emailId: "sellerLoginEmail",
      passwordId: "sellerLoginPassword",
      role: "seller",
      messageId: "sellerLoginMessage"
    });

    const currentSession = session();
    if (currentSession?.role === "seller") {
      showSellerDashboard(currentSession);
    }
  }

  function showSellerDashboard(account) {
    $("sellerDashboard")?.classList.remove("hidden");
    $("sellerLoginForm")?.closest(".auth-card")?.classList.add("hidden");

    if ($("sellerDisplayName")) {
      $("sellerDisplayName").textContent = account.name;
    }

    renderSellerProducts(account);
  }

  function renderSellerProducts(account) {
    const container = $("sellerProducts");
    if (!container) return;

    const mine = products().filter((product) =>
      product.sellerEmail === account.email
    );

    if (mine.length === 0) {
      container.innerHTML = "<p>You have not listed any products yet.</p>";
      return;
    }

    container.innerHTML = mine.map((product) => `
      <article class="seller-product-item">
        <h4>${escapeHTML(product.name)}</h4>
        <p>${escapeHTML(product.category)}</p>
        <p>₹${Number(product.price).toFixed(2)} / ${escapeHTML(product.unit)}</p>
        <p>Stock: ${Number(product.quantity)}</p>
        <button type="button" class="btn btn-outline"
          data-delete-product="${escapeHTML(product.id)}">Delete listing</button>
      </article>
    `).join("");
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  // Seller adds a product
  $("addProductForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const current = session();
    if (!current || current.role !== "seller") {
      message("addProductMessage", "Please log in with a seller account.");
      return;
    }

    const name = $("productName").value.trim();
    const category = $("productCategory").value;
    const price = Number($("productPrice").value);
    const unit = $("productUnit").value;
    const quantity = Number($("productQuantity").value);
    const image = $("productImage").value.trim();

    if (!name || !Number.isFinite(price) || price <= 0 ||
        !Number.isInteger(quantity) || quantity < 1) {
      message("addProductMessage", "Enter a valid product name, price and quantity.");
      return;
    }

    if (image) {
      try {
        const url = new URL(image);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        message("addProductMessage", "Enter a valid image URL beginning with https://.");
        return;
      }
    }

    const allProducts = products();

    allProducts.push({
      id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      category,
      price,
      unit,
      quantity,
      image,
      sellerName: current.name,
      sellerEmail: current.email
    });

    if (!save("farmToHomeProducts", allProducts)) {
      message("addProductMessage", "Unable to save this product.");
      return;
    }

    $("addProductForm").reset();
    message("addProductMessage", "Product published on the homepage!", "success");
    renderSellerProducts(current);
  });

  $("sellerProducts")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-product]");
    if (!button) return;

    const current = session();
    if (!current || current.role !== "seller") return;

    const updated = products().filter((product) =>
      !(product.id === button.dataset.deleteProduct &&
        product.sellerEmail === current.email)
    );

    if (save("farmToHomeProducts", updated)) {
      renderSellerProducts(current);
    }
  });

  $("sellerLogout")?.addEventListener("click", () => {
    localStorage.removeItem("farmToHomeDemoSession");
    window.location.reload();
  });

  // Demo admin login.
  // This is intentionally a prototype only, NOT secure authentication.
  $("adminLoginForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = $("adminEmail").value.trim().toLowerCase();
    const password = $("adminPassword").value;

    if (email !== "admin@farmtohome.com" || password !== "Admin123") {
      message("adminLoginMessage", "Invalid demo admin credentials.");
      return;
    }

    save("farmToHomeDemoSession", {
      name: "Demo Admin",
      email,
      role: "admin"
    });

    showAdminDashboard();
  });

  function showAdminDashboard() {
    const current = session();
    if (!current || current.role !== "admin") return;

    $("adminLoginCard")?.classList.add("hidden");
    $("adminDashboard")?.classList.remove("hidden");

    const allAccounts = accounts();
    const allProducts = products();

    $("buyerStat").textContent =
      allAccounts.filter((account) => account.role === "buyer").length;
    $("sellerStat").textContent =
      allAccounts.filter((account) => account.role === "seller").length;
    $("productStat").textContent = allProducts.length;

    $("adminAccounts").innerHTML = allAccounts.map((account) => `
      <tr>
        <td>${escapeHTML(account.name)}</td>
        <td>${escapeHTML(account.email)}</td>
        <td>${escapeHTML(account.role)}</td>
      </tr>
    `).join("") || '<tr><td colspan="3">No registered accounts yet.</td></tr>';

    $("adminProducts").innerHTML = allProducts.map((product) => `
      <tr>
        <td>${escapeHTML(product.name)}</td>
        <td>${escapeHTML(product.sellerName)}</td>
        <td>₹${Number(product.price).toFixed(2)}</td>
        <td>
          ${product.id.startsWith("sample-")
            ? "Sample product"
            : `<button type="button" data-admin-delete="${escapeHTML(product.id)}">Remove</button>`}
        </td>
      </tr>
    `).join("") || '<tr><td colspan="4">No products listed.</td></tr>';
  }

  $("adminProducts")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-delete]");
    if (!button) return;

    const current = session();
    if (!current || current.role !== "admin") return;

    const updated = products().filter((product) =>
      product.id !== button.dataset.adminDelete
    );

    if (save("farmToHomeProducts", updated)) {
      showAdminDashboard();
    }
  });

  $("adminLogout")?.addEventListener("click", () => {
    localStorage.removeItem("farmToHomeDemoSession");
    window.location.reload();
  });

  if ($("adminDashboard") && session()?.role === "admin") {
    showAdminDashboard();
  }
});