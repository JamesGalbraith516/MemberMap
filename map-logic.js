// Initialize map and marker logic

const map = L.map("map").setView([50.5, -95.0], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let markers = [];
let selectedMarker = null;
let radiusCircle = null;

const defaultIcon = new L.Icon.Default();

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const yellowIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greyIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function haversineDistance(latlng1, latlng2) {
  const R = 6371;
  const dLat = ((latlng2.lat - latlng1.lat) * Math.PI) / 180;
  const dLon = ((latlng2.lng - latlng1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latlng1.lat * Math.PI) / 180) *
      Math.cos((latlng2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearbyMarkers(clickedMarker, radiusKm) {
  const nearby = [];
  const clickedLatLng = clickedMarker.getLatLng();

  markers.forEach((marker) => {
    if (marker === clickedMarker) return;
    const dist = haversineDistance(clickedLatLng, marker.getLatLng());
    if (dist <= radiusKm) {
      nearby.push(marker);
    }
  });

  return nearby;
}

function resetAllMarkerIcons() {
  markers.forEach((m) => {
    m.setIcon(greyIcon);
    m.getElement()?.classList.remove("marker-glow");
  });
}

function updateMarkerCount(count) {
  const countDiv = document.getElementById("markerCount");
  if (count === 0) {
    countDiv.textContent = "No marker selected";
  } else {
    countDiv.textContent = `Total nearby markers: ${count}`;
  }
}

function updateMap(allData) {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  if (radiusCircle) {
    map.removeLayer(radiusCircle);
    radiusCircle = null;
  }

  selectedMarker = null;
  updateMarkerCount(0);
  resetAllMarkerIcons();

  const typeFilter = document.getElementById("typeFilter").value;

  allData.forEach((row) => {
    if (typeFilter && row["Type"] !== typeFilter) return;

    const geocode = row["Geocode"];
    if (!geocode || !geocode.includes(",")) return;

    const [lat, lng] = geocode.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) return;

    const marker = L.marker([lat, lng], { icon: greyIcon });
    marker.data = row;

    marker.on("click", () => {
      resetAllMarkerIcons();

      if (radiusCircle) {
        map.removeLayer(radiusCircle);
        radiusCircle = null;
      }

      selectedMarker = marker;

      let radiusKm = parseFloat(
        document.getElementById("distanceFilter").value
      );
      if (isNaN(radiusKm) || radiusKm <= 0) radiusKm = 50;

      const selectedLatLng = marker.getLatLng();
      let nearby = findNearbyMarkers(marker, radiusKm);

      nearby = nearby.map((m) => ({
        marker: m,
        distance: haversineDistance(selectedLatLng, m.getLatLng()),
      }));
      nearby.sort((a, b) => a.distance - b.distance);

      nearby.forEach((entry) => entry.marker.setIcon(blueIcon));
      marker.setIcon(yellowIcon);

      // Add glow on hover
      markers.forEach((m) => {
        const el = m.getElement();
        if (!el) return;
        el.onmouseenter = () => {
          el.classList.add("marker-glow");
        };
        el.onmouseleave = () => {
          el.classList.remove("marker-glow");
        };
      });

      radiusCircle = L.circle(marker.getLatLng(), {
        radius: radiusKm * 1000,
        color: "#999",
        fillColor: "#ccc",
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);

      const listDiv = document.getElementById("nearbyList");
      listDiv.innerHTML = "";

      // Selected marker at top
      const d = marker.data;
      const divSelected = document.createElement("div");
      divSelected.className = "nearby-entry";
      divSelected.innerHTML = `
        <div class="name-distance">
          <span>${d["First Name"]} ${d["Last Name"]} (Selected)</span>
          <span class="distance">0.0 km</span>
        </div>
        <div>${d["Business Name"]}</div>
      `;
      listDiv.appendChild(divSelected);

      if (nearby.length === 0) {
        const noDiv = document.createElement("div");
        noDiv.textContent = "No nearby markers found.";
        listDiv.appendChild(noDiv);
      } else {
        nearby.forEach((entry) => {
          const d = entry.marker.data;
          const distance = entry.distance.toFixed(1);
          const div = document.createElement("div");
          div.className = "nearby-entry";
          div.innerHTML = `
            <div class="name-distance">
              <span>${d["First Name"]} ${d["Last Name"]}</span>
              <span class="distance">${distance} km</span>
            </div>
            <div>${d["Business Name"]}</div>
          `;
          listDiv.appendChild(div);
        });
      }

      updateMarkerCount(nearby.length);

      const popupHTML = `
        <strong>${marker.data["First Name"]} ${marker.data["Last Name"]}</strong><br>
        ${marker.data["Business Name"]}<br><br>
        <strong>${nearby.length} nearby markers within ${radiusKm} km</strong>
      `;
      marker.bindPopup(popupHTML).openPopup();
    });

    marker.addTo(map);
    markers.push(marker);
  });
}
