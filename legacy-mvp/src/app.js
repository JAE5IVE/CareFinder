import { csvColumns, hospitals as seedHospitals } from "./data.js";
import { buildShareUrl, filterHospitals, readFiltersFromUrl, sanitizeMarkdown, toCsv } from "./utils.js";

const state = {
  hospitals: JSON.parse(localStorage.getItem("carefinder:hospitals") || "null") || seedHospitals,
  filters: { query: "", city: "", specialty: "", ownership: "", radius: "10", userLocation: null },
  selectedColumns: csvColumns.map((column) => column.key),
  sortBy: "rating",
  admin: localStorage.getItem("carefinder:admin") === "true"
};

const els = {
  searchView: document.querySelector("#searchView"),
  adminView: document.querySelector("#adminView"),
  tabs: document.querySelectorAll(".tab"),
  query: document.querySelector("#query"),
  city: document.querySelector("#city"),
  specialty: document.querySelector("#specialty"),
  ownership: document.querySelector("#ownership"),
  radius: document.querySelector("#radius"),
  radiusValue: document.querySelector("#radiusValue"),
  useLocation: document.querySelector("#useLocation"),
  clearFilters: document.querySelector("#clearFilters"),
  columnChoices: document.querySelector("#columnChoices"),
  exportCsv: document.querySelector("#exportCsv"),
  copyLink: document.querySelector("#copyLink"),
  shareEmail: document.querySelector("#shareEmail"),
  shareEmailButton: document.querySelector("#shareEmailButton"),
  shareFeedback: document.querySelector("#shareFeedback"),
  sortBy: document.querySelector("#sortBy"),
  resultsTitle: document.querySelector("#resultsTitle"),
  mapCanvas: document.querySelector("#mapCanvas"),
  results: document.querySelector("#results"),
  detailDialog: document.querySelector("#detailDialog"),
  detailContent: document.querySelector("#detailContent"),
  closeDialog: document.querySelector("#closeDialog"),
  adminLogin: document.querySelector("#adminLogin"),
  adminLogout: document.querySelector("#adminLogout"),
  adminEmail: document.querySelector("#adminEmail"),
  adminPassword: document.querySelector("#adminPassword"),
  loginPanel: document.querySelector("#loginPanel"),
  adminSession: document.querySelector("#adminSession"),
  hospitalForm: document.querySelector("#hospitalForm"),
  markdownPreview: document.querySelector("#markdownPreview"),
  description: document.querySelector("#description"),
  adminSaveStatus: document.querySelector("#adminSaveStatus"),
  reviewModeration: document.querySelector("#reviewModeration")
};

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function init() {
  const urlFilters = readFiltersFromUrl();
  state.filters = { ...state.filters, ...urlFilters };
  fillSelect(els.city, "Any city", unique(state.hospitals.map((hospital) => hospital.city)));
  fillSelect(
    els.specialty,
    "Any specialty",
    unique(state.hospitals.flatMap((hospital) => hospital.specialties))
  );
  csvColumns.forEach((column) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${column.key}" checked /> ${column.label}`;
    els.columnChoices.append(label);
  });
  bindEvents();
  syncInputs();
  updateAdminUi();
  render();
}

function fillSelect(select, firstLabel, options) {
  select.innerHTML = `<option value="">${firstLabel}</option>`;
  options.forEach((option) => {
    const node = document.createElement("option");
    node.value = option;
    node.textContent = option;
    select.append(node);
  });
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  [els.query, els.city, els.specialty, els.ownership, els.radius, els.sortBy].forEach((input) => {
    input.addEventListener("input", () => {
      state.filters.query = els.query.value;
      state.filters.city = els.city.value;
      state.filters.specialty = els.specialty.value;
      state.filters.ownership = els.ownership.value;
      state.filters.radius = els.radius.value;
      state.sortBy = els.sortBy.value;
      render();
    });
  });

  els.columnChoices.addEventListener("change", () => {
    state.selectedColumns = [...els.columnChoices.querySelectorAll("input:checked")].map((input) => input.value);
  });

  els.useLocation.addEventListener("click", useLocation);
  els.clearFilters.addEventListener("click", clearFilters);
  els.exportCsv.addEventListener("click", exportCsv);
  els.copyLink.addEventListener("click", copyLink);
  els.shareEmailButton.addEventListener("click", prepareEmail);
  els.closeDialog.addEventListener("click", () => els.detailDialog.close());

  els.adminLogin.addEventListener("click", () => {
    const ok = els.adminEmail.value === "admin@carefinder.ng" && els.adminPassword.value === "demo-admin";
    state.admin = ok;
    localStorage.setItem("carefinder:admin", String(ok));
    updateAdminUi(ok ? "Signed in." : "Use admin@carefinder.ng and demo-admin.");
  });

  els.adminLogout.addEventListener("click", () => {
    state.admin = false;
    localStorage.removeItem("carefinder:admin");
    updateAdminUi("Signed out.");
  });

  els.description.addEventListener("input", () => {
    els.markdownPreview.innerHTML = sanitizeMarkdown(els.description.value);
  });

  els.hospitalForm.addEventListener("submit", saveHospital);
}

function switchView(view) {
  els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === view));
  els.searchView.hidden = view !== "search";
  els.adminView.hidden = view !== "admin";
}

function syncInputs() {
  els.query.value = state.filters.query;
  els.city.value = state.filters.city;
  els.specialty.value = state.filters.specialty;
  els.ownership.value = state.filters.ownership;
  els.radius.value = state.filters.radius;
  els.radiusValue.textContent = `${state.filters.radius} km`;
}

function currentResults() {
  const rows = filterHospitals(state.hospitals, state.filters);
  return rows.sort((a, b) => {
    if (state.sortBy === "rating") return b.rating - a.rating;
    return String(a[state.sortBy]).localeCompare(String(b[state.sortBy]));
  });
}

function render() {
  syncInputs();
  const rows = currentResults();
  els.resultsTitle.textContent = `${rows.length} hospital${rows.length === 1 ? "" : "s"} found`;
  renderMap(rows);
  renderCards(rows);
  renderModeration();
}

function renderMap(rows) {
  els.mapCanvas.innerHTML = "";
  if (!rows.length) {
    els.mapCanvas.innerHTML = `<div class="map-empty">No hospitals match this search.</div>`;
    return;
  }
  const minLat = Math.min(...state.hospitals.map((hospital) => hospital.lat));
  const maxLat = Math.max(...state.hospitals.map((hospital) => hospital.lat));
  const minLng = Math.min(...state.hospitals.map((hospital) => hospital.lng));
  const maxLng = Math.max(...state.hospitals.map((hospital) => hospital.lng));
  rows.forEach((hospital, index) => {
    const x = 8 + ((hospital.lng - minLng) / (maxLng - minLng || 1)) * 84;
    const y = 88 - ((hospital.lat - minLat) / (maxLat - minLat || 1)) * 76;
    const pin = document.createElement("button");
    pin.className = "map-pin";
    pin.style.left = `${x}%`;
    pin.style.top = `${y}%`;
    pin.innerHTML = `<span>${index + 1}</span>`;
    pin.title = hospital.name;
    pin.addEventListener("click", () => showDetail(hospital.id));
    els.mapCanvas.append(pin);
  });
}

function renderCards(rows) {
  els.results.innerHTML = "";
  rows.forEach((hospital) => {
    const card = document.createElement("article");
    card.className = "hospital-card";
    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3>${hospital.name}</h3>
          <p class="muted">${hospital.city} · ${hospital.lga}</p>
        </div>
        <span class="rating">${hospital.rating.toFixed(1)} ★</span>
      </div>
      <p>${hospital.address}</p>
      <div class="pill-row">
        <span class="pill alt">${hospital.ownership}</span>
        ${hospital.specialties.map((item) => `<span class="pill">${item}</span>`).join("")}
      </div>
      <p class="muted">${hospital.reviewCount} reviews · ${hospital.phone}</p>
      <div class="card-actions">
        <button class="button primary" type="button" data-detail="${hospital.id}">Details</button>
        <button class="button" type="button" data-select="${hospital.id}">Select for email</button>
      </div>
    `;
    card.querySelector("[data-detail]").addEventListener("click", () => showDetail(hospital.id));
    card.querySelector("[data-select]").addEventListener("click", (event) => {
      event.currentTarget.classList.toggle("primary");
      hospital.selected = event.currentTarget.classList.contains("primary");
    });
    els.results.append(card);
  });
}

function showDetail(id) {
  const hospital = state.hospitals.find((item) => item.id === id);
  els.detailContent.innerHTML = `
    <section class="detail">
      <div>
        <p class="eyebrow">${hospital.city} · ${hospital.ownership}</p>
        <h2>${hospital.name}</h2>
      </div>
      <p>${hospital.address}</p>
      <p><strong>Phone:</strong> ${hospital.phone} · <strong>Email:</strong> ${hospital.email}</p>
      <p><strong>Visiting hours:</strong> ${hospital.visitingHours}</p>
      <div class="pill-row">${hospital.specialties.map((item) => `<span class="pill">${item}</span>`).join("")}</div>
      <div class="markdown-preview">${sanitizeMarkdown(hospital.description)}</div>
      <p class="rating">${hospital.rating.toFixed(1)} ★ from ${hospital.reviewCount} reviews</p>
      <div>
        <h3>Public reviews</h3>
        ${hospital.reviews
          .filter((review) => review.status === "approved")
          .map((review) => `<p><strong>${review.user}</strong> · ${review.rating} ★<br />${review.text}</p>`)
          .join("")}
      </div>
      <form class="review-form" data-review="${hospital.id}">
        <h3>Leave a review</h3>
        <select name="rating" aria-label="Rating">
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <textarea name="text" rows="3" placeholder="Share your experience"></textarea>
        <button class="button primary" type="submit">Submit for moderation</button>
      </form>
    </section>
  `;
  els.detailContent.querySelector("form").addEventListener("submit", submitReview);
  els.detailDialog.showModal();
}

function submitReview(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const hospital = state.hospitals.find((item) => item.id === event.currentTarget.dataset.review);
  hospital.reviews.push({
    user: "Demo user",
    rating: Number(form.get("rating")),
    text: form.get("text") || "No comment",
    status: "pending"
  });
  saveState();
  els.detailDialog.close();
  render();
}

function useLocation() {
  if (!navigator.geolocation) {
    state.filters.userLocation = { lat: 6.5244, lng: 3.3792 };
    els.shareFeedback.textContent = "Browser location unavailable. Using Lagos as a demo location.";
    render();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.filters.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      els.shareFeedback.textContent = "Location added to radius search.";
      render();
    },
    () => {
      state.filters.userLocation = { lat: 6.5244, lng: 3.3792 };
      els.shareFeedback.textContent = "Location permission skipped. Using Lagos as a demo location.";
      render();
    }
  );
}

function clearFilters() {
  state.filters = { query: "", city: "", specialty: "", ownership: "", radius: "10", userLocation: null };
  history.replaceState({}, "", location.pathname);
  render();
}

function exportCsv() {
  const columns = csvColumns.filter((column) => state.selectedColumns.includes(column.key));
  const csv = toCsv(currentResults(), columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const query = state.filters.query || state.filters.city || "all";
  anchor.href = url;
  anchor.download = `hospitals-${query.toLowerCase().replace(/\W+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function copyLink() {
  const url = buildShareUrl(state.filters);
  await navigator.clipboard.writeText(url);
  els.shareFeedback.textContent = "Search link copied.";
}

function prepareEmail() {
  const email = els.shareEmail.value.trim();
  const selected = state.hospitals.filter((hospital) => hospital.selected);
  const rows = selected.length ? selected : currentResults().slice(0, 5);
  const body = rows
    .map((hospital) => `${hospital.name} - ${hospital.address} - ${hospital.phone}`)
    .join("\n");
  location.href = `mailto:${encodeURIComponent(email)}?subject=Carefinder hospital list&body=${encodeURIComponent(body)}`;
}

function updateAdminUi(message = "") {
  els.loginPanel.hidden = state.admin;
  els.adminSession.hidden = !state.admin;
  els.hospitalForm.querySelectorAll("input, select, textarea, button").forEach((input) => {
    input.disabled = !state.admin;
  });
  els.adminSaveStatus.textContent = message;
}

function saveHospital(event) {
  event.preventDefault();
  if (!state.admin) return;
  const form = new FormData(event.currentTarget);
  const name = form.get("name").trim();
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const phone = form.get("phone").trim();
  if (!name || !phone || Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    els.adminSaveStatus.textContent = "Check name, phone, latitude, and longitude.";
    return;
  }
  const hospital = {
    id: name.toLowerCase().replace(/\W+/g, "-"),
    name,
    city: form.get("city").trim(),
    lga: "New submission",
    address: form.get("address").trim(),
    phone,
    email: form.get("email").trim(),
    ownership: form.get("ownership"),
    specialties: form.get("specialties").split(",").map((item) => item.trim()).filter(Boolean),
    visitingHours: "Pending schedule",
    rating: 0,
    reviewCount: 0,
    lat,
    lng,
    description: form.get("description").trim(),
    reviews: []
  };
  state.hospitals = [hospital, ...state.hospitals.filter((item) => item.id !== hospital.id)];
  saveState();
  els.adminSaveStatus.textContent = "Hospital saved locally.";
  event.currentTarget.reset();
  els.markdownPreview.innerHTML = "";
  render();
}

function renderModeration() {
  const pending = state.hospitals.flatMap((hospital) =>
    hospital.reviews
      .map((review, index) => ({ hospital, review, index }))
      .filter((item) => item.review.status === "pending")
  );
  els.reviewModeration.innerHTML =
    pending
      .map(
        (item) => `
      <div class="moderation-item">
        <strong>${item.hospital.name}</strong>
        <p>${item.review.rating} ★ · ${item.review.text}</p>
        <button class="button" type="button" data-approve="${item.hospital.id}:${item.index}" ${state.admin ? "" : "disabled"}>Approve</button>
      </div>
    `
      )
      .join("") || `<p class="muted">No pending reviews.</p>`;
  els.reviewModeration.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      const [hospitalId, index] = button.dataset.approve.split(":");
      const hospital = state.hospitals.find((item) => item.id === hospitalId);
      hospital.reviews[Number(index)].status = "approved";
      hospital.reviewCount += 1;
      saveState();
      render();
    });
  });
}

function saveState() {
  localStorage.setItem("carefinder:hospitals", JSON.stringify(state.hospitals));
}

init();
