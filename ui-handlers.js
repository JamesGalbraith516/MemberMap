const sidePanel = document.getElementById("sidePanel");
const sidebarToggle = document.getElementById("sidebarToggle");
const zoomWrapper = document.getElementById("zoomWrapper");

function positionToggle() {
  const sidebarRect = sidePanel.getBoundingClientRect();
  // Vertically center toggle relative to sidebar
  sidebarToggle.style.top = sidebarRect.top + sidebarRect.height / 2 + "px";
  // Position toggle just outside sidebar's right edge, offset by half toggle width (20px)
  sidebarToggle.style.right = (window.innerWidth - sidebarRect.right - 20) + "px";
}

// Initialize position on load
positionToggle();

// Update position on window resize
window.addEventListener("resize", positionToggle);

sidebarToggle.addEventListener("click", () => {
  const isCollapsed = sidePanel.classList.toggle("collapsed");
  sidebarToggle.classList.toggle("collapsed", isCollapsed);
  sidebarToggle.innerHTML = isCollapsed ? "&#x276F;" : "&#x276E;"; // ❯ or ❮

  // Move zoom controls accordingly
  if (zoomWrapper) {
    zoomWrapper.style.left = isCollapsed ? "40px" : "300px";
  }

  positionToggle();
});
