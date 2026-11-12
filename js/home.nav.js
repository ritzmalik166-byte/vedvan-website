// Private visit form: no past dates, and the whole field opens the calendar
const visitDate = document.getElementById("visit-date");

if (visitDate) {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  visitDate.min = now.toISOString().slice(0, 10);

  // Date inputs have no placeholder: flag the empty state so CSS shows a stand-in label
  const syncEmpty = () => visitDate.classList.toggle("is-empty", !visitDate.value);
  syncEmpty();
  visitDate.addEventListener("input", syncEmpty);
  visitDate.addEventListener("change", syncEmpty);
  visitDate.addEventListener("blur", syncEmpty);
  visitDate.form?.addEventListener("reset", () => setTimeout(syncEmpty));

  visitDate.addEventListener("click", () => {
    try {
      visitDate.showPicker();
    } catch (e) {
      // showPicker unsupported: the native icon still opens the calendar
    }
  });
}

// Mobile navigation toggle
const navToggle = document.querySelector(".js-nav-toggle");
const mobileMenu = document.getElementById("mobile-menu");

if (navToggle && mobileMenu) {
  // The open / close animation (menu height + hamburger ↔ close icon) is CSS, driven by `is-open` and aria-expanded
  const setOpen = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("is-open", open);
  };

  navToggle.addEventListener("click", () => {
    setOpen(navToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      setOpen(false);
      navToggle.focus();
    }
  });
}

// Bubble buttons: the gold drains away from (and refills towards) the point where the pointer enters / leaves
document.querySelectorAll(".bubble-btn").forEach((btn) => {
  const setOrigin = (event) => {
    const rect = btn.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    btn.style.setProperty("--bubble-x", `${x}px`);
    btn.style.setProperty("--bubble-y", `${y}px`);
    // Just large enough to reach the farthest corner, so the whole animation is visible
    const maxX = Math.max(x, rect.width - x);
    const maxY = Math.max(y, rect.height - y);
    btn.style.setProperty("--bubble-max", `${Math.ceil(Math.hypot(maxX, maxY)) + 2}px`);
  };
  btn.addEventListener("pointerenter", setOrigin);
  btn.addEventListener("pointerleave", setOrigin);
});
