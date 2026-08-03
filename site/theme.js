/* Wires the header theme toggle. Loaded with `defer`, so it runs after the
   markup is parsed and never blocks rendering.

   It deliberately does NOT decide the initial theme — a small inline script in
   each page's <head> does that before first paint, because a deferred file
   would run too late and the wrong theme would flash first. This file only
   handles the click. */
(function () {
  var root = document.documentElement;
  var button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  function syncLabel() {
    var isDark = root.getAttribute("data-theme") === "dark";
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  syncLabel();

  button.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    // Private-mode Safari throws on localStorage writes; the toggle should
    // still work for the current page even when the choice can't be saved.
    try {
      localStorage.setItem("theme", next);
    } catch (error) {}
    syncLabel();
  });
})();
