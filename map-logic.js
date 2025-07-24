const map = L.map('map').setView([50.5, -95.0], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Move Leaflet zoom controls into zoomWrapper for positioning
const zoomWrapper = document.getElementById("zoomWrapper");
const zoomControl = document.querySelector(".leaflet-control-zoom");
if (zoomControl && zoomWrapper) {
  zoomWrapper.appendChild(zoomControl);
}

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSm2djr9eOyF8SI92KcfrCsrFEcW3dmaStUT4H0Ard8A1BUKKgd08owmHvG6TT7AdfPXB26pJ-Stzjw/pub?gid=528897676&single=true&output=csv';

let markers = [];
let allData = [];
let radiusCircle = null;
let selectedMarker = null;

const defaultIcon = new L.Icon.Default();

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

fetch(sheetURL)
  .then(response => response.text())
  .then(csv => {
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    allData = parsed.data;

    const typeSet = new Set();
    allData.forEach(row => {
      const geocode = row['Geocode'];
      if (!geocode || !geocode.includes(',')) return;
      typeSet.add(row['Type']);
    });

    const typeSelect = document.getElementById('typeFilter');
    Array.from(typeSet).sort().forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      typeSelect.appendChild(opt);
    });

    updateMap();

    document.getElementById('typeFilter').addEventListener('change', updateMap);
    document.getElementById('distanceFilter').addEventListener('input', updateMap);
    document.getElementById('downloadCsvBtn').addEventListener('click', downloadResults);
  });

function updateMap() {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  if (radiusCircle) {
    map.removeLayer(radiusCircle);
    radiusCircle = null;
  }

  selectedMarker = null;
  updateMarkerCount(0);
  resetAllMarkerIcons();

  const typeFilter = document.getElementById('typeFilter').value;

  allData.forEach(row => {
    if (typeFilter && row['Type'] !== typeFilter) return;

    const geocode = row['Geocode'];
    if (!geocode || !geocode.includes(',')) return;

    const [lat, lng] = geocode.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return;

    const marker = L.marker([lat, lng], { icon: greyIcon });
    marker.data = row;

    marker.on('click', function () {
      resetAllMarkerIcons();

      if (radiusCircle) {
        map.removeLayer(radiusCircle);
        radiusCircle = null;
      }

      selectedMarker = marker;

      let radiusKm = parseFloat(document.getElementById('distanceFilter').value);
      if (isNaN(radiusKm) || radiusKm <= 0) radiusKm = 50;

      const selectedLatLng = marker.getLatLng();
      let nearby = findNearbyMarkers(marker, radiusKm);

      // Add distance and sort nearby
      nearby = nearby.map(m => ({
        marker: m,
        distance: haversineDistance(selectedLatLng, m.getLatLng())
      }));
      nearby.sort((a, b) => a.distance - b.distance);

      // Update marker icons
      nearby.forEach(entry => entry.marker.setIcon(blueIcon));
      marker.setIcon(yellowIcon);

      radiusCircle = L.circle(marker.getLatLng(), {
        radius: radiusKm * 1000,
        color: '#999',
        fillColor: '#ccc',
        fillOpacity: 0.15,
        weight: 1
      }).addTo(map);

      const listDiv = document.getElementById('nearbyList');
      listDiv.innerHTML = '';

      // Selected marker at top
      const d = marker.data;
      const divSelected = document.createElement('div');
      divSelected.className = 'nearby-entry';
      divSelected.innerHTML = `
        <div class="name-distance">
          <span>${d['First Name']} ${d['Last Name']} (Selected)</span>
          <span class="distance">0.0 km</span>
        </div>
        <div>${d['Business Name']}</div>
      `;
      listDiv.appendChild(divSelected);

      // Sorted nearby entries
      if (nearby.length === 0) {
        const noDiv = document.createElement('div');
        noDiv.textContent = 'No nearby markers found.';
        listDiv.appendChild(noDiv);
      } else {
        nearby.forEach(entry => {
          const d = entry.marker.data;
          const distance = entry.distance.toFixed(1);
          const div = document.createElement('div');
          div.className = 'nearby-entry';
          div.innerHTML = `
            <div class="name-distance">
              <span>${d['First Name']} ${d['Last Name']}</span>
              <span class="distance">${distance} km</span>
            </div>
            <div>${d['Business Name']}</div>
          `;
          listDiv.appendChild(div);
        });
      }

      updateMarkerCount(nearby.length);

      const popupHTML = `
        <strong>${marker.data['First Name']} ${marker.data['Last Name']}</strong><br>
        ${marker.data['Business Name']}<br><br>
        <strong>${nearby.length} nearby markers within ${radiusKm} km</strong>
      `;
      marker.bindPopup(popupHTML).openPopup();
    });

    marker.addTo(map);
    markers.push(marker);
  });
}

function resetAllMarkerIcons() {
  markers.forEach(m => m.setIcon(greyIcon));
}

function updateMarkerCount(count) {
  const countDiv = document.getElementById('markerCount');
  if (count === 0) {
    countDiv.textContent = 'No marker selected';
  } else {
    countDiv.textContent = `Total nearby markers: ${count}`;
  }
}

function haversineDistance(latlng1, latlng2) {
  const R = 6371; // Earth radius in km
  const dLat = (latlng2.lat - latlng1.lat) * Math.PI / 180;
  const dLon = (latlng2.lng - latlng1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(latlng1.lat * Math.PI / 180) * Math.cos(latlng2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearbyMarkers(clickedMarker, radiusKm) {
  const nearby = [];
  const clickedLatLng = clickedMarker.getLatLng();

  markers.forEach(marker => {
    if (marker === clickedMarker) return;
    const dist = haversineDistance(clickedLatLng, marker.getLatLng());
    if (dist <= radiusKm) {
      nearby.push(marker);
    }
  });

  return nearby;
}

function downloadResults() {
  if (markers.length === 0) {
    alert('No results to download.');
    return;
  }

  const typeFilter = document.getElementById('typeFilter').value;

  // Filter markers currently on map by type (matches updateMap filter)
  const filteredMarkers = markers.filter(marker => {
    if (typeFilter && marker.data['Type'] !== typeFilter) return false;
    return true;
  });

  if (filteredMarkers.length === 0) {
    alert('No results to download.');
    return;
  }

  // Prepare data: include all columns from the original CSV for these filtered markers
  // If selectedMarker is set but not in filteredMarkers, add it (unlikely because filteredMarkers is all markers on map)
  if (selectedMarker && !filteredMarkers.includes(selectedMarker)) {
    filteredMarkers.push(selectedMarker);
  }

  // Extract all columns keys to maintain CSV structure
  const allKeysSet = new Set();
  filteredMarkers.forEach(marker => {
    Object.keys(marker.data).forEach(k => allKeysSet.add(k));
  });
  const allKeys = Array.from(allKeysSet);

  // Build array of objects for Papa.unparse
  const csvData = filteredMarkers.map(marker => {
    const row = {};
    allKeys.forEach(k => {
      row[k] = marker.data[k] || '';
    });
    return row;
  });

  const csv = Papa.unparse(csvData);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filtered_results.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
