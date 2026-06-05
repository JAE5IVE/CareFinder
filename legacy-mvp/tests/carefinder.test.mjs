import assert from "node:assert/strict";
import { hospitals, csvColumns } from "../src/data.js";
import { filterHospitals, haversineKm, sanitizeMarkdown, toCsv } from "../src/utils.js";

const lagosResults = filterHospitals(hospitals, {
  query: "lagos",
  city: "",
  specialty: "",
  ownership: "",
  radius: "10",
  userLocation: null
});
assert.ok(lagosResults.length >= 2, "search should find Lagos hospitals");

const maternity = filterHospitals(hospitals, {
  query: "",
  city: "",
  specialty: "Maternity",
  ownership: "public",
  radius: "10",
  userLocation: null
});
assert.ok(maternity.every((hospital) => hospital.specialties.includes("Maternity")));
assert.ok(maternity.every((hospital) => hospital.ownership === "public"));

const distance = haversineKm({ lat: 6.4541, lng: 3.3947 }, { lat: 6.4478, lng: 3.4219 });
assert.ok(distance > 0 && distance < 5, "nearby Lagos hospitals should be within a few km");

const html = sanitizeMarkdown("<script>alert(1)</script> **safe**");
assert.ok(!html.includes("<script>"), "markdown should escape script tags");
assert.ok(html.includes("<strong>safe</strong>"), "markdown should render bold text");

const csv = toCsv(hospitals.slice(0, 1), csvColumns.slice(0, 2));
assert.ok(csv.startsWith('"Name","Address"'), "CSV should include selected headers only");

console.log("Carefinder tests passed");
