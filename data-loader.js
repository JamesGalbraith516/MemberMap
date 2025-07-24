// Load data from Google Sheet CSV and initialize filters and map data
const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSm2djr9eOyF8SI92KcfrCsrFEcW3dmaStUT4H0Ard8A1BUKKgd08owmHvG6TT7AdfPXB26pJ-Stzjw/pub?gid=528897676&single=true&output=csv";

let allData = [];

function loadData(onDataLoaded) {
  fetch(sheetURL)
    .then((response) => response.text())
    .then((csv) => {
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
      allData = parsed.data;

      // Populate Type filter dropdown
      const typeSet = new Set();
      allData.forEach((row) => {
        if (!row["Geocode"] || !row["Geocode"].includes(",")) return;
        typeSet.add(row["Type"]);
      });

      const typeSelect = document.getElementById("typeFilter");
      Array.from(typeSet)
        .sort()
        .forEach((type) => {
          const opt = document.createElement("option");
          opt.value = type;
          opt.textContent = type;
          typeSelect.appendChild(opt);
        });

      onDataLoaded(allData);
    });
}
