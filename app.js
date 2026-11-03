/* =========================================
   BAJET VIRAL.MY — APP.JS
   Supabase Affiliate Store
========================================= */

(() => {
  "use strict";

  const config = window.BV_CONFIG;

  if (!config || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    console.error("Supabase config tidak dijumpai. Semak config.js.");
    alert("Sambungan konfigurasi belum tersedia. Sila semak config.js.");
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase library tidak dimuatkan.");
    alert("Supabase gagal dimuatkan. Sila semak sambungan internet.");
    return;
  }

  const db = window.supabase.createClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY
  );

  const TABLE = "products";
  const BUCKET = "product-images";

  const $ = (id) => document.getElementById(id);

  let products = [];
  let editingId = null;

  const el = {
    year: $("year"),
    adminOpen: $("adminOpen"),
    adminModal: $("adminModal"),
    closeAdmin: $("closeAdmin"),
    loginView: $("loginView"),
    dashboardView: $("dashboardView"),
    loginForm: $("loginForm"),
    loginEmail: $("loginEmail"),
    loginPassword: $("loginPassword"),
    loginMessage: $("loginMessage"),
    productGrid: $("productGrid"),
    categoryFilter: $("categoryFilter"),
    searchInput: $("searchInput"),
    platformFilter: $("platformFilter"),
    productCount: $("productCount"),
    emptyState: $("emptyState"),
    logoutBtn: $("logoutBtn"),
    adminProductList: $("adminProductList"),
    productId: $("productId"),
    productName: $("productName"),
    productPrice: $("productPrice"),
    productCategory: $("productCategory"),
    productPlatform: $("productPlatform"),
    productUrl: $("productUrl"),
    productImageUrl: $("productImageUrl"),
    productDescription: $("productDescription"),
    productActive: $("productActive"),
    saveProductBtn: $("saveProductBtn"),
    productForm: $("productForm"),
    productImageFile: $("productImageFile"),
    productMessage: $("productMessage"),
    resetFormBtn: $("resetFormBtn"),
    refreshBtn: $("refreshBtn"),
    toast: $("toast")
  };

  function toast(message) {
    if (!el.toast) {
      console.log(message);
      return;
    }

    el.toast.textContent = message;
    el.toast.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.toast.classList.remove("show");
    }, 3000);
  }

  function showMessage(target, message, isError = false) {
    if (!target) return;

    target.textContent = message;
    target.style.color = isError ? "#dc2626" : "#16a34a";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["https:", "http:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function money(value) {
    const amount = Number(value || 0);

    return amount.toLocaleString("ms-MY", {
      style: "currency",
      currency: "MYR"
    });
  }

  
  function showLogin() {
    if (el.loginView) el.loginView.style.display = "";
    if (el.dashboardView) el.dashboardView.style.display = "none";
  }

  function showDashboard() {
    if (el.loginView) el.loginView.style.display = "none";
    if (el.dashboardView) el.dashboardView.style.display = "";
  }
function openAdmin() {
    if (el.adminModal) {
      el.adminModal.classList.add("show");
      el.adminModal.style.display = "flex";
    }
  }

  function closeAdmin() {
    if (el.adminModal) {
      el.adminModal.classList.remove("show");
      el.adminModal.style.display = "";
    }
  }

  async function checkAdmin() {
    const { data, error } = await db.auth.getUser();

    if (error || !data.user) return false;

    return data.user.app_metadata?.role === "admin";
  }

  // =====================================
  // LOAD PRODUCTS
  // =====================================

  async function loadProducts() {
    if (el.productGrid) {
      el.productGrid.innerHTML = "<p>Memuatkan produk...</p>";
    }

    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal memuatkan produk:", error);
      if (el.productGrid) {
        el.productGrid.innerHTML =
          "<p>Produk gagal dimuatkan. Sila cuba semula.</p>";
      }
      return;
    }

    products = data || [];
    renderProducts();
    renderAdminProducts();
    updateCategoryFilter();
  }

  // =====================================
  // CATEGORY FILTER
  // =====================================

  function updateCategoryFilter() {
    if (!el.categoryFilter) return;

    const selected = el.categoryFilter.value;
    const categories = [...new Set(
      products
        .filter((product) => product.active !== false)
        .map((product) => product.category)
        .filter(Boolean)
    )].sort();

    el.categoryFilter.innerHTML =
      '<option value="">Semua kategori</option>' +
      categories.map((category) =>
        `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
      ).join("");

    if (categories.includes(selected)) {
      el.categoryFilter.value = selected;
    }
  }

  // =====================================
  // PUBLIC PRODUCT DISPLAY
  // =====================================

  function renderProducts() {
    if (!el.productGrid) return;

    const keyword = (el.searchInput?.value || "").toLowerCase().trim();
    const category = el.categoryFilter?.value || "";
    const platform = el.platformFilter?.value || "";

    const filtered = products.filter((product) => {
      if (product.active === false) return false;

      const matchesKeyword =
        !keyword ||
        String(product.name || "").toLowerCase().includes(keyword) ||
        String(product.description || "").toLowerCase().includes(keyword);

      const matchesCategory =
        !category || product.category === category;

      const matchesPlatform =
        !platform || product.platform === platform;

      return matchesKeyword && matchesCategory && matchesPlatform;
    });

    if (el.productCount) {
      el.productCount.textContent = `${filtered.length} produk`;
    }

    if (el.emptyState) {
      el.emptyState.style.display = filtered.length ? "none" : "";
    }

    el.productGrid.innerHTML = filtered.map((product) => {
      const image = safeUrl(product.image_url);
      const affiliate = safeUrl(product.affiliate_url);

      return `
        <article class="product-card">
          <div class="product-image">
            ${image
              ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}" loading="lazy">`
              : `<div class="image-placeholder">BAJET VIRAL.MY</div>`
            }
          </div>

          <div class="product-info">
            <small>${escapeHTML(product.category || "Produk")}</small>
            <h3>${escapeHTML(product.name)}</h3>
            <p>${escapeHTML(product.description || "")}</p>

            <div class="product-bottom">
              <strong>${money(product.price)}</strong>
              ${affiliate
                ? `<a class="buy-btn" href="${escapeHTML(affiliate)}" target="_blank" rel="noopener noreferrer">BELI SEKARANG</a>`
                : `<span class="buy-btn disabled">PAUTAN TIADA</span>`
              }
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  // =====================================
  // ADMIN PRODUCT LIST
  // =====================================

  function renderAdminProducts() {
    if (!el.adminProductList) return;

    if (!products.length) {
      el.adminProductList.innerHTML = "<p>Belum ada produk.</p>";
      return;
    }

    el.adminProductList.innerHTML = products.map((product) => `
      <div class="admin-product-item">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <small>${money(product.price)} · ${escapeHTML(product.category || "")}</small>
          <small>${product.active === false ? "Tidak aktif" : "Aktif"}</small>
        </div>

        <div class="admin-product-actions">
          <button type="button" data-edit="${escapeHTML(product.id)}">Edit</button>
          <button type="button" data-delete="${escapeHTML(product.id)}">Padam</button>
        </div>
      </div>
    `).join("");
  }

  // =====================================
  // RESET PRODUCT FORM
  // =====================================

  function resetProductForm() {
    editingId = null;

    if (el.productForm) el.productForm.reset();
    if (el.productId) el.productId.value = "";
    if (el.productActive) el.productActive.checked = true;
    if (el.saveProductBtn) el.saveProductBtn.textContent = "Simpan Produk";

    showMessage(el.productMessage, "");
  }

  // =====================================
  // EDIT PRODUCT
  // =====================================

  function editProduct(id) {
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) return;

    editingId = product.id;

    if (el.productId) el.productId.value = product.id;
    if (el.productName) el.productName.value = product.name || "";
    if (el.productPrice) el.productPrice.value = product.price ?? "";
    if (el.productCategory) el.productCategory.value = product.category || "";
    if (el.productPlatform) el.productPlatform.value = product.platform || "";
    if (el.productUrl) el.productUrl.value = product.affiliate_url || "";
    if (el.productImageUrl) el.productImageUrl.value = product.image_url || "";
    if (el.productDescription) el.productDescription.value = product.description || "";
    if (el.productActive) el.productActive.checked = product.active !== false;

    if (el.saveProductBtn) {
      el.saveProductBtn.textContent = "Kemaskini Produk";
    }

    showMessage(el.productMessage, "Sedang mengedit produk.");
  }

  // =====================================
  // UPLOAD PRODUCT IMAGE
  // =====================================

  async function uploadProductImage(file) {
    if (!file) return "";

    if (!file.type.startsWith("image/")) {
      throw new Error("Fail mestilah gambar.");
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error("Saiz gambar mestilah kurang daripada 5MB.");
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const fileName =
      `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) throw error;

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  // =====================================
  // SAVE / UPDATE PRODUCT
  // =====================================

  async function saveProduct(event) {
    event.preventDefault();

    const name = el.productName?.value.trim();
    const price = Number(el.productPrice?.value);
    const category = el.productCategory?.value.trim();
    const platform = el.productPlatform?.value;
    const affiliateUrl = safeUrl(el.productUrl?.value.trim());
    let imageUrl = safeUrl(el.productImageUrl?.value.trim());
    const description = el.productDescription?.value.trim() || "";
    const active = el.productActive ? el.productActive.checked : true;
    const imageFile = el.productImageFile?.files?.[0];

    if (!name || !category || !platform) {
      showMessage(el.productMessage, "Sila lengkapkan maklumat produk.", true);
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      showMessage(el.productMessage, "Harga produk tidak sah.", true);
      return;
    }

    if (!affiliateUrl) {
      showMessage(el.productMessage, "Sila masukkan pautan affiliate yang sah.", true);
      return;
    }

    if (el.saveProductBtn) {
      el.saveProductBtn.disabled = true;
      el.saveProductBtn.textContent = "Sedang menyimpan...";
    }

    try {
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const productData = {
        name,
        price,
        category,
        platform,
        affiliate_url: affiliateUrl,
        image_url: imageUrl,
        description,
        active
      };

      let result;

      if (editingId) {
        result = await db
          .from(TABLE)
          .update(productData)
          .eq("id", editingId);
      } else {
        result = await db
          .from(TABLE)
          .insert([productData]);
      }

      if (result.error) throw result.error;

      showMessage(
        el.productMessage,
        editingId ? "Produk berjaya dikemaskini!" : "Produk berjaya ditambah!"
      );

      toast("Produk berjaya disimpan.");
      resetProductForm();
      await loadProducts();

    } catch (error) {
      console.error("Ralat simpan produk:", error);
      showMessage(
        el.productMessage,
        error.message || "Produk gagal disimpan.",
        true
      );
    } finally {
      if (el.saveProductBtn) {
        el.saveProductBtn.disabled = false;
        el.saveProductBtn.textContent = editingId
          ? "Kemaskini Produk"
          : "Simpan Produk";
      }
    }
  }

  // =====================================
  // DELETE PRODUCT
  // =====================================

  async function deleteProduct(id) {
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) return;

    if (!confirm(`Padam produk "${product.name}"?`)) return;

    const { error } = await db
      .from(TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Gagal padam produk:", error);
      toast(error.message || "Produk gagal dipadam.");
      return;
    }

    toast("Produk berjaya dipadam.");
    await loadProducts();
  }

  // =====================================
  // ADMIN LOGIN
  // =====================================

  async function loginAdmin(event) {
    event.preventDefault();

    const email = el.loginEmail?.value.trim();
    const password = el.loginPassword?.value;

    if (!email || !password) {
      showMessage(el.loginMessage, "Masukkan email dan password.", true);
      return;
    }

    showMessage(el.loginMessage, "Sedang log masuk...");

    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showMessage(el.loginMessage, error.message, true);
      return;
    }

    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      await db.auth.signOut();
      showMessage(
        el.loginMessage,
        "Akaun ini tidak mempunyai akses admin.",
        true
      );
      return;
    }

    showDashboard();
    await loadProducts();
    toast("Log masuk admin berjaya.");
  }

  // =====================================
  // LOGOUT
  // =====================================

  async function logoutAdmin() {
    const { error } = await db.auth.signOut();

    if (error) {
      toast(error.message);
      return;
    }

    resetProductForm();
    showLogin();
    toast("Anda telah log keluar.");
  }

  // =====================================
  // EVENT LISTENERS
  // =====================================

  el.adminOpen?.addEventListener("click", openAdmin);
  el.closeAdmin?.addEventListener("click", closeAdmin);

  el.adminModal?.addEventListener("click", (event) => {
    if (event.target === el.adminModal) closeAdmin();
  });

  el.loginForm?.addEventListener("submit", loginAdmin);
  el.logoutBtn?.addEventListener("click", logoutAdmin);
  el.productForm?.addEventListener("submit", saveProduct);
  el.resetFormBtn?.addEventListener("click", resetProductForm);
  el.refreshBtn?.addEventListener("click", loadProducts);

  el.searchInput?.addEventListener("input", renderProducts);
  el.categoryFilter?.addEventListener("change", renderProducts);
  el.platformFilter?.addEventListener("change", renderProducts);

  el.adminProductList?.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) editProduct(editButton.dataset.edit);
    if (deleteButton) deleteProduct(deleteButton.dataset.delete);
  });

  // =====================================
  // AUTH SESSION CHECK
  // =====================================

  async function initialiseApp() {
    if (el.year) {
      el.year.textContent = new Date().getFullYear();
    }

    const isAdmin = await checkAdmin();

    if (isAdmin) {
      showDashboard();
      await loadProducts();
    } else {
      showLogin();
      await loadProducts();
    }
  }

  db.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      showLogin();
    }

    if (event === "SIGNED_IN" && session?.user) {
      setTimeout(async () => {
        if (await checkAdmin()) {
          showDashboard();
          await loadProducts();
        }
      }, 0);
    }
  });

  initialiseApp().catch((error) => {
    console.error("Aplikasi gagal dimulakan:", error);
    toast("Aplikasi gagal dimulakan. Sila semak sambungan.");
  });

})();
/* PRODUCT CARD SIZE FIX */
.product-image {
  display: block;
  width: 100%;
  height: 180px;
  aspect-ratio: auto;
  object-fit: cover;
  background: #f5f5f7;
}

.product-card {
  min-width: 0;
  overflow: hidden;
}

.product-info h3 {
  min-height: 34px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-info .product-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 620px) {
  .product-image {
    height: 145px;
  }
}
