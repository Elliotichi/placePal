$(document).ready(function () {
  /**
   * @file theme.js
   * @author saul and the goodmans
   * @brief Theme switching logic for light/dark mode. Takes system preferences if new visitor.
   *        Uses jQuery to manipulate CSS.
   * @NOTE These are CSS variables: when modifying styles, stuff like var(--text) will work as expected.
   * @TODO nothing, pretty stable code
   */
  const darkTheme = {
    background: "#1e1e1e",
    components: "#2d2d30",
    text: "#d3d3d3",
    hover: "rgba(255,255,255,0.1)",
    placepalblue: "#183580",
  };

  const lightTheme = {
    background: "#f7f5f0",    
    components: "#faf5ea",    
    text: "#4a4a4a",         
    hover: "rgba(0,0,0,0.25)",
    placepalblue: "#2a4495",  
  };

  function applyTheme(isDark) {
    const theme = isDark ? darkTheme : lightTheme;
    const root = document.documentElement;

    for (const [key, value] of Object.entries(theme)) {
      root.style.setProperty(`--${key}`, value);
    }

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  function initTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      applyTheme(savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark);
    }
  }

  $("#theme-toggle").click(function () {
    const currentTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(currentTheme === "light");
  });

  initTheme();
});
