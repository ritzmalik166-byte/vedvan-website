// Mobile navigation toggle
const navToggle = document.querySelector(".js-nav-toggle");
const mobileMenu = document.getElementById("mobile-menu");

if (navToggle && mobileMenu) {
  const setOpen = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    mobileMenu.hidden = !open;
  };

  navToggle.addEventListener("click", () => {
    setOpen(navToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileMenu.hidden) {
      setOpen(false);
      navToggle.focus();
    }
  });
}
