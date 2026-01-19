/**
 * Configuration & State Management
 */
const API_CONFIG = {
  BASE_URL: "https://superheroapi.com/api.php/e552af34ecd4db21c68641c681793b5b",
  // Enhancement: Movie info can be integrated via OMDB if required [cite: 10, 36]
};

let favourites = JSON.parse(localStorage.getItem("vault_favs")) || [];

// DOM Cache
const dom = {
  input: document.getElementById("searchInput"),
  grid: document.getElementById("heroGrid"),
  btn: document.getElementById("searchBtn"),
  badge: document.getElementById("favBadge"),
  drawer: document.getElementById("favDrawer"),
  favList: document.getElementById("favContainer"),
  loader: document.getElementById("loader"),
  msg: document.getElementById("statusMessage"),
};

/**
 * Core Functionality: API Connection
 */
async function fetchHeroes(name) {
  if (!name) return;

  toggleLoader(true);
  dom.msg.style.display = "none";

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/search/${name}`);
    const data = await response.json();

    if (data.response === "success") {
      renderResults(data.results);
    } else {
      showError("No heroes found with that name. Try 'Avenger'.");
    }
  } catch (err) {
    showError("Connectivity issue. Please check your API access.");
    console.error("Fetch Error:", err);
  } finally {
    toggleLoader(false);
  }
}

/**
 * UI Rendering
 */
function renderResults(heroes) {
  dom.grid.innerHTML = heroes
    .map((hero) => {
      const isFav = favourites.some((f) => f.id === hero.id);
      return `
            <article class="hero-card">
                <button class="fav-icon-btn ${isFav ? "active" : ""}" 
                        onclick="handleFavToggle('${hero.id}', '${hero.name.replace(/'/g, "")}', '${hero.image.url}')">
                    <i class="${isFav ? "fas" : "far"} fa-heart"></i>
                </button>
                <img src="${hero.image.url}" alt="${hero.name}" onerror="this.src='https://via.placeholder.com/400x600?text=No+Image'">
                <div class="hero-content">
                    <h3>${hero.name}</h3>
                    <p class="real-name">${hero.biography["full-name"] || "Alter Ego Unknown"}</p>
                    <div class="stats-bar">
                        <span class="stat-pill">INT: ${hero.powerstats.intelligence}</span>
                        <span class="stat-pill">STR: ${hero.powerstats.strength}</span>
                        <span class="stat-pill">SPD: ${hero.powerstats.speed}</span>
                    </div>
                </div>
            </article>
        `;
    })
    .join("");
}

/**
 * Favourites Logic
 */
window.handleFavToggle = (id, name, img) => {
  const index = favourites.findIndex((f) => f.id === id);
  if (index === -1) {
    favourites.push({ id, name, img });
  } else {
    favourites.splice(index, 1);
  }

  localStorage.setItem("vault_favs", JSON.stringify(favourites));
  updateUI();
};

function updateUI() {
  dom.badge.innerText = favourites.length;
  dom.favList.innerHTML = favourites
    .map(
      (f) => `
        <div class="fav-item">
            <img src="${f.img}" width="60">
            <span>${f.name}</span>
            <button onclick="handleFavToggle('${f.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `,
    )
    .join("");

  // Re-render main grid to update heart icons
  if (dom.input.value) fetchHeroes(dom.input.value);
}

// Event Listeners
dom.btn.addEventListener("click", () => fetchHeroes(dom.input.value));
dom.input.addEventListener(
  "keypress",
  (e) => e.key === "Enter" && fetchHeroes(dom.input.value),
);
document
  .getElementById("favTrigger")
  .addEventListener("click", () => dom.drawer.classList.add("active"));
document
  .getElementById("closeDrawer")
  .addEventListener("click", () => dom.drawer.classList.remove("active"));

function toggleLoader(show) {
  dom.loader.classList.toggle("hidden", !show);
}
function showError(txt) {
  dom.grid.innerHTML = `<p class="error-text">${txt}</p>`;
}

// Initialize
updateUI();
