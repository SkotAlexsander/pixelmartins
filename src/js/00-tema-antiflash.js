(function () {
  try {
    var saved = localStorage.getItem("pm-theme");
    if (saved === "light") document.documentElement.classList.add("light");
  } catch (e) {}
})();
