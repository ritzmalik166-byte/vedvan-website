// Private visit form: no past dates, and the whole field opens the calendar
const visitDate = document.getElementById("visit-date");

if (visitDate) {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  visitDate.min = now.toISOString().slice(0, 10);

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
