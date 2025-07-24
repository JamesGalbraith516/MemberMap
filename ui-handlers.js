const sidePanel = document.getElementById("sidePanel");
const sidebarToggle = document.getElementById("sidebarToggle");

sidebarToggle.addEventListener("click", () => {
  const isCollapsed = sidePanel.classList.toggle("collapsed");
  sidebarToggle.classList.toggle("collapsed", isCollapsed);
  sidebarToggle.innerHTML = isCollapsed ? "&#x276F;" : "&#x276E;"; // ❯ or ❮
});
