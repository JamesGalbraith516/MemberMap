// Handles UI interactions, sidebar toggle, filters and CSV download

const typeFilter = document.getElementById("typeFilter");
const distanceFilter = document.getElementById("distanceFilter");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const sidePanel = document.getElementById("sidePanel");
const sidebarToggle = document.getElementById("sidebarToggle");

// For controlling Leaflet zoom control position
const zoomWrapper = document.querySelector(".leaflet-control-zoom");

function setupUIHandlers(allData) {
  // On filter changes update map
  typeFilter.addEventListener("change", () => updateMap(allData));
  distanceFilter.addEventListener("input", () => updateMap(allData));

  // Download CSV
  downloadCsvBtn.addEventListener("click", () => downloadResults());

  // Sidebar toggle
  sidebarToggle.addEventListener("click", () => {
    const isCollapsed = sidePanel.classList.toggle("collapsed");
    sidebarToggle.classList.toggle("collapsed", isCollapsed);
    sidebarToggle.innerHTML = isCollapsed ? "&#x276F;" : "&#x276E;"; // ❯ or ❮

    // Adjust zoom control position (moves with sidebar)
    if (zoomWrapper) {
      zoomWrapper.style.left = isCollapsed ? "30px" : "310px";
    }
  });

  // Initial zoom control position
  if (zoomWrapper) {
    zoomWrapper.style.left = "310px";
  }
}

function downloadResults() {
  if (markers.length === 0) {
    alert("No results to download.");
    return;
  }

  const typeValue = typeFilter.value;

  // Filter markers currently on map by type (matches updateMap filter)
  const filteredMarkers = markers.filter((marker) => {
    if (typeValue && marker.data["Type"] !== typeValue) return false;
    return true;
  });

  if (filteredMarkers.length === 0) {
    alert("No results to download.");
    return;
  }

  // Include selectedMarker if not in filteredMarkers (unlikely)
  if (selectedMarker && !filteredMarkers.includes(selectedMarker)) {
    filteredMarkers.push(selectedMarker);
  }

  // Extract all keys for CSV header
  const allKeysSet = new Set();
  filteredMarkers.forEach((marker) => {
    Object.keys(marker.data).forEach((k) => allKeysSet.add(k));
  });
  const allKeys = Array.from(allKeysSet);

  // Build data array for CSV export
  const csvData = filteredMarkers.map((marker) => {
    const row = {};
    allKeys.forEach((k) => {
      row[k] = marker.data[k] || "";
    });
    return row;
  });

  const csv = Papa.unparse(csvData);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "filtered_results.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Start loading data and initialize map and UI
loadData((data) => {
  updateMap(data);
  setupUIHandlers(data);
});
