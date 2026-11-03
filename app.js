/* BAJET VIRAL.MY - Supabase client app */
(() => {
  "use strict";
  const cfg = window.BV_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("PASTE_") && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
  const db = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const $ = id => document.getElementById(id);
  let products = [];
  let editing = false;
  let toastTimer;

  $("year").textContent = new Date().getFullYear();

  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }
  function message(id, text, success=false) {
    const el = $(id); el.textContent = text; el.classList.toggle("success", success);
  }
  function escapeHTML(value="") {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function money(value) {
    return new Intl.NumberFormat("ms-MY", {style:"currency",currency:"MYR"}).format(Number(value || 0));
  }
  function safeUrl(value) {
    try { const u = new URL(value); return ["https:","http:"].includes(u.protocol) ? u.href : ""; }
    catch { return ""; }
  }
  function showModal() {
    $("adminModal").classList.remove("hidden");
    $("loginView").classList.remove("hidden");
    $("dashboardView").classList.add("hidden");
    message("loginMessage","");
  }
  function closeModal() { $("adminModal").classList.add("hidden"); }
  $("adminOpen").addEventListener("click", async () => {
    showModal();
    if (db) {
      const {data:{session}} = await db.auth.getSession();
      if (session) showDashboard();
    }
  });
  $("closeAdmin").addEventListener("click", closeModal);
  $("adminModal").addEventListener("click", e => { if (e.target.dataset.close) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  async function loadProducts() {
    if (!db) {
      $("productGrid").innerHTML = '<div class="loading">Sambungkan Supabase dahulu. Masukkan Project URL dan anon key dalam fail <b>config.js</b>.</div>';
      return;
    }
    $("productGrid").innerHTML = '<div class="loading">Sedang memuatkan produk...</div>';
    const {data,error} = await db.from("products").select("*").eq("active",true).order("created_at",{ascending:false});
    if (error) {
      $("productGrid").innerHTML = '<div class="loading">Tidak dapat memuatkan produk. Semak tetapan Supabase dan SQL.</div>';
      console.error(error); return;
    }
    products = data || [];
    buildCategoryOptions();
    renderProducts();
function renderProducts() {
  const term = $("searchInput").value.trim().toLowerCase();
  const cat = $("categoryFilter").value;
  const platform = $("platformFilter").value;

  const list = products.filter(p =>
    (!term || `${p.name} ${p.description || ""} ${p.category}`.toLowerCase().includes(term)) &&
    (!cat || p.category === cat) &&
    (!platform || p.platform === platform)
  );

  $("productCount").textContent = `${list.length} produk`;
  $("emptyState").classList.toggle("hidden", list.length !== 0);

  $("productGrid").innerHTML = list.map(p => {
    const img = safeUrl(p.image_url);
    const raw = String(p.affiliate_url || "").trim();

    let link = "";
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") {
        link = url.href;
      }
    } catch (e) {}

    return `
      <article class="product-card">
        ${img ? `<img class="product-image" src="${escapeHTML(img)}" alt="${escapeHTML(p.name)}">` : ""}
        <div class="product-info">
          <span class="platform-tag">${escapeHTML(p.platform)} · ${escapeHTML(p.category)}</span>
          <h3>${escapeHTML(p.name)}</h3>
          <div class="product-bottom">
            <span class="price">${money(p.price)}</span>
            ${link
              ? `<a class="buy-btn" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer sponsored">BELI SEKARANG ↗</a>`
              : `<span class="buy-btn disabled-buy">PAUTAN BELUM SAH</span>`}
          </div>
        </div>
      </article>
    `;
  }).join("");
}
  const term = $("searchInput").value.trim().toLowerCase();
  const cat = $("categoryFilter").value;
  const platform = $("platformFilter").value;

  const list = products.filter(p =>
    (!term || `${p.name} ${p.description || ""} ${p.category}`.toLowerCase().includes(term)) &&
    (!cat || p.category === cat) &&
    (!platform || p.platform === platform)
  );

  $("productCount").textContent = `${list.length} produk`;
  $("emptyState").classList.toggle("hidden", list.length !== 0);

  $("productGrid").innerHTML = list.map(p => {
    const img = safeUrl(p.image_url);
    const rawLink = String(p.affiliate_url || "").trim();

    let link = "";
    try {
      const parsed = new URL(rawLink);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        link = parsed.href;
      }
    } catch (e) {
      link = "";
    }

    return `
      <article class="product-card">
        ${img
          ? `<img class="product-image" src="${escapeHTML(img)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'">`
          : `<div class="product-image placeholder">✦</div>`}

        <div class="product-info">
          <span class="platform-tag">
            ${escapeHTML(p.platform)} · ${escapeHTML(p.category)}
          </span>

          <h3>${escapeHTML(p.name)}</h3>

          ${p.description
            ? `<p class="product-desc">${escapeHTML(p.description)}</p>`
            : ""}

          <div class="product-bottom">
            <span class="price">${money(p.price)}</span>

            ${link
              ? `<a class="buy-btn"
                   href="${escapeHTML(link)}"
                   target="_blank"
                   rel="noopener noreferrer sponsored">
                   BELI SEKARANG ↗
                 </a>`
              : `<span class="buy-btn disabled-buy">
                   PAUTAN BELUM SAH
                 </span>`}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

  }
  function buildCategoryOptions() {
    const select = $("categoryFilter"), current = select.value;
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    select.innerHTML = '<option value="">Semua kategori</option>' + cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    select.value = cats.includes(current) ? current : "";
  }
  function renderProducts() {
    const term = $("searchInput").value.trim().toLowerCase();
    const cat = $("categoryFilter").value, platform = $("platformFilter").value;
    const list = products.filter(p =>
      (!term || `${p.name} ${p.description||""} ${p.category}`.toLowerCase().includes(term)) &&
      (!cat || p.category === cat) && (!platform || p.platform === platform)
    );
    $("productCount").textContent = `${list.length} produk`;
    $("emptyState").classList.toggle("hidden", list.length !== 0);
    $("productGrid").innerHTML = list.map(p => {
      const img = safeUrl(p.image_url);
      const link = String(p.affiliate_url || "").trim();

return `<article class="product-card">
  ${img ? `<img class="product-image" src="${escapeHTML(img)}" alt="${escapeHTML(p.name)}">` : `<div class="product-image placeholder">✦</div>`}
  <div class="product-info">
    <span class="platform-tag">${escapeHTML(p.platform)} · ${escapeHTML(p.category)}</span>
    <h3>${escapeHTML(p.name)}</h3>
    ${p.description ? `<p class="product-desc">${escapeHTML(p.description)}</p>` : ""}
    <div class="product-bottom">
      <span class="price">${money(p.price)}</span>
      <a class="buy-btn" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer sponsored">BELI SEKARANG ↗</a>
    </div>
  </div>
</article>`;
      return `<article class="product-card">
        ${img ? `<img class="product-image" src="${escapeHTML(img)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'">` : `<div class="product-image placeholder">✦</div>`}
        <div class="product-info"><span class="platform-tag">${escapeHTML(p.platform)} · ${escapeHTML(p.category)}</span>
          <h3>${escapeHTML(p.name)}</h3>${p.description ? `<p class="product-desc">${escapeHTML(p.description)}</p>` : ""}
          <div class="product-bottom"><span class="price">${money(p.price)}</span>
          ${link ? `<a class="buy-btn" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer sponsored">BELI SEKARANG ↗</a>` : ""}
          </div>
        </div></article>`;
    }).join("");
  }
  $("searchInput").addEventListener("input", renderProducts);
  $("categoryFilter").addEventListener("change", renderProducts);
  $("platformFilter").addEventListener("change", renderProducts);

  async function showDashboard() {
    $("loginView").classList.add("hidden");
    $("dashboardView").classList.remove("hidden");
    await loadAdminProducts();
  }
  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!db) return message("loginMessage","Sila lengkapkan config.js dahulu.");
    message("loginMessage","Sedang log masuk...");
    const {error} = await db.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
    if (error) return message("loginMessage",error.message);
    const {data:{user}} = await db.auth.getUser();
    if (user?.app_metadata?.role !== "admin") {
      await db.auth.signOut();
      return message("loginMessage","Akaun ini belum diberi peranan admin. Ikut langkah SQL dalam README.");
    }
    await showDashboard();
  });
  $("logoutBtn").addEventListener("click", async () => {
    if (db) await db.auth.signOut();
    $("dashboardView").classList.add("hidden"); $("loginView").classList.remove("hidden");
    message("loginMessage","Anda telah log keluar.",true); resetForm();
  });

  async function loadAdminProducts() {
    const {data,error} = await db.from("products").select("*").order("created_at",{ascending:false});
    if (error) { $("adminProductList").textContent = "Gagal memuatkan senarai. Pastikan akaun anda mempunyai role admin."; return; }
    $("adminProductList").innerHTML = (data||[]).map(p => `<div class="admin-row">
      ${safeUrl(p.image_url) ? `<img src="${escapeHTML(p.image_url)}" alt="">` : `<div class="brand-mark">BV</div>`}
      <div class="admin-row-info"><b>${escapeHTML(p.name)}</b><small>${money(p.price)} · ${escapeHTML(p.platform)} · ${p.active?"Aktif":"Disembunyikan"}</small></div>
      <button type="button" data-edit="${p.id}">Edit</button><button type="button" data-delete="${p.id}">Padam</button>
    </div>`).join("") || '<p class="muted">Belum ada produk. Tambah produk pertama anda di atas.</p>';
    $("adminProductList").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editProduct(data.find(p=>p.id===b.dataset.edit))));
    $("adminProductList").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteProduct(b.dataset.delete)));
  }
  function editProduct(p) {
    if (!p) return;
    editing = true;
    $("productId").value = p.id; $("productName").value = p.name; $("productPrice").value = p.price;
    $("productCategory").value = p.category; $("productPlatform").value = p.platform;
    $("productUrl").value = p.affiliate_url; $("productImageUrl").value = p.image_url || "";
    $("productDescription").value = p.description || ""; $("productActive").checked = p.active;
    $("saveProductBtn").textContent = "Kemaskini produk";
    $("productForm").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function resetForm() {
    $("productForm").reset(); $("productId").value = ""; $("productActive").checked = true;
    $("productImageFile").value = ""; editing = false; $("saveProductBtn").textContent = "Simpan produk";
    message("productMessage","");
  }
  $("resetFormBtn").addEventListener("click",resetForm);
  $("refreshBtn").addEventListener("click",loadAdminProducts);

  async function uploadImage(file) {
    if (!file) return null;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Format gambar mesti JPG, PNG atau WEBP.");
    if (file.size > 5*1024*1024) throw new Error("Saiz gambar maksimum ialah 5MB.");
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const {error} = await db.storage.from("product-images").upload(path,file,{cacheControl:"3600",upsert:false});
    if (error) throw error;
    const {data} = db.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }
  $("productForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!db) return;
    const save = $("saveProductBtn"); save.disabled = true; save.textContent = "Menyimpan...";
    try {
      const {data:{user}} = await db.auth.getUser();
      if (user?.app_metadata?.role !== "admin") throw new Error("Akses admin diperlukan. Log keluar dan log masuk semula.");
      let imageUrl = $("productImageUrl").value.trim();
      const file = $("productImageFile").files[0];
      if (file) imageUrl = await uploadImage(file);
      const affiliate = safeUrl($("productUrl").value.trim());
      if (!affiliate) throw new Error("Masukkan link affiliate yang sah (http/https).");
      const payload = {
        name:$("productName").value.trim(), price:Number($("productPrice").value),
        category:$("productCategory").value.trim(), platform:$("productPlatform").value,
        affiliate_url:affiliate, image_url:imageUrl || null,
        description:$("productDescription").value.trim(), active:$("productActive").checked
      };
      if (!payload.name || !payload.category || !Number.isFinite(payload.price) || payload.price < 0) throw new Error("Semak nama, kategori dan harga produk.");
      const id = $("productId").value;
      const result = id ? await db.from("products").update(payload).eq("id",id) : await db.from("products").insert(payload);
      if (result.error) throw result.error;
      message("productMessage",id?"Produk berjaya dikemaskini.":"Produk berjaya ditambah.",true);
      toast(id?"Produk dikemaskini":"Produk berjaya ditambah");
      resetForm(); await loadAdminProducts(); await loadProducts();
    } catch(err) { message("productMessage",err.message || "Ralat semasa menyimpan produk."); }
    finally { save.disabled = false; save.textContent = editing ? "Kemaskini produk" : "Simpan produk"; }
  });
  async function deleteProduct(id) {
    if (!confirm("Padam produk ini? Tindakan ini tidak boleh dibatalkan.")) return;
    const {error} = await db.from("products").delete().eq("id",id);
    if (error) return toast("Tidak berjaya memadam: " + error.message);
    toast("Produk dipadam"); await loadAdminProducts(); await loadProducts();
  }

  if (!configured) {
    $("productGrid").innerHTML = '<div class="loading">Untuk mengaktifkan kedai, masukkan Supabase Project URL dan anon public key dalam <b>config.js</b>.</div>';
  } else {
    loadProducts();
    db.auth.onAuthStateChange((_event,session) => {
      if (!session && !$("adminModal").classList.contains("hidden")) {
        $("dashboardView").classList.add("hidden"); $("loginView").classList.remove("hidden");
      }
    });
  }
})();
