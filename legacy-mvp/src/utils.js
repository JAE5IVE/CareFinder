export function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function sanitizeMarkdown(markdown) {
  const escaped = String(markdown)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export function filterHospitals(hospitals, filters) {
  const query = filters.query.trim().toLowerCase();
  return hospitals.filter((hospital) => {
    const queryMatch =
      !query ||
      [hospital.name, hospital.city, hospital.lga, hospital.address]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const cityMatch = !filters.city || hospital.city === filters.city;
    const specialtyMatch =
      !filters.specialty || hospital.specialties.includes(filters.specialty);
    const ownershipMatch = !filters.ownership || hospital.ownership === filters.ownership;
    const radiusMatch =
      !filters.userLocation ||
      haversineKm(filters.userLocation, hospital) <= Number(filters.radius || 10);
    return queryMatch && cityMatch && specialtyMatch && ownershipMatch && radiusMatch;
  });
}

export function toCsv(rows, columns) {
  const escapeCell = (value) => {
    const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };
  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCell(row[column.key])).join(","))
    .join("\n");
  return [header, body].filter(Boolean).join("\n");
}

export function buildShareUrl(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "userLocation") params.set(key, value);
  });
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

export function readFiltersFromUrl() {
  const params = new URLSearchParams(location.search);
  return {
    query: params.get("query") || "",
    city: params.get("city") || "",
    specialty: params.get("specialty") || "",
    ownership: params.get("ownership") || "",
    radius: params.get("radius") || "10"
  };
}
