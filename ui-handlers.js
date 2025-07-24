const sidePanel = document.getElementById("sidePanel");
const sidebarToggle = document.getElementById("sidebarToggle");
const zoomWrapper = document.getElementById("zoomWrapper");

function positionToggle() {
  const sidebarRect = sidePanel.getBoundingClientRect();
  const toggleSize = 40;

  // Vertical center along sidebar height in viewport coords
  sidebarToggle.style.top = sidebarRect.top + sidebarRect.height / 2 - toggleSize / 2 + "px";

  // Place just outside the sidebar right edge (window coords)
  sidebarToggle.style.left = sidebarRect.right - 2 + "px"; // -2px so border lines up nicely
}

function updateZoomPosition() {
  // Position zoom controls inside mapWrapper with left padding matching sidebar width
  if (sidePanel.classList.contains("collapsed")) {
    zoomWrapper.style.left = "50px"; // small padding when sidebar narrow
  } else {
    zoomWrapper.style.left = "310px"; // sidebar width + padding
  }
}

// Initialize
positionToggle();
updateZoomPosition();

window.addEventListener("resize", () => {
  positionToggle();
  updateZoomPosition();
});

sidebarToggle.addEventListener("click", () => {
  const collapsed = sidePanel.classList.toggle("collapsed");
  sidebarToggle.classList.toggle("collapsed", collapsed);
  sidebarToggle.innerHTML = collapsed ? "&#x276F;" : "&#x276E;"; // ❯ or ❮

  // Hide/show children inside sidebar (except toggle which is outside)
  // We rely on CSS #sidePanel.collapsed > * { display:none } to hide everything when collapsed
  // So no JS needed here for that part

  positionToggle();
  updateZoomPosition();
});
