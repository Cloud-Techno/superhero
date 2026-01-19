/**
 * ARCHITECTURE: MVVM Style Vanilla JS
 * Logic to fetch Superhero data and cross-reference with OMDB for cinematic context.
 */

const CONFIG = {
  HERO_API: "https://superheroapi.com/api.php/e552af34ecd4db21c68641c681793b5b",
  OMDB_API: "https://www.omdbapi.com/?apikey=52ef7c1b",
};

let favourites = JSON.parse(localStorage.getItem("hero_vault")) || [];

// UI Elements
const ui = {
  input: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  grid: document.getElementById("heroGrid"),
  badge: document.getElementById("favBadge"),
  favList: document.getElementById("favList"),
  drawer: document.getElementById("favDrawer"),
  loader: document.getElementById("loader"),
  msg: document.getElementById("statusMsg"),
};

/**
 * FETCH LOGIC
 */
async function initiateSearch() {
  const query = ui.input.value.trim();
  if (!query) return;

  toggleLoader(true);
  ui.msg.style.display = "none";

  try {
    // Parallel requests would be faster, but sequential is safer for public API rate limits
    const heroRes = await fetch(`${CONFIG.HERO_API}/search/${query}`);
    const heroData = await heroRes.json();

    if (heroData.response === "success") {
      // Get cinematic data for the first result to maintain performance
      const movieRes = await fetch(`${CONFIG.OMDB_API}&s=${query}&type=movie`);
      const movieData = await movieRes.json();
      const movies = movieData.Search ? movieData.Search.slice(0, 3) : null;

      renderHeroes(heroData.results, movies);
    } else {
      showNotification("No hero found in the database.");
    }
  } catch (err) {
    showNotification("Signal lost. Check connection.");
    console.error("API Error:", err);
  } finally {
    toggleLoader(false);
  }
}

/**
 * RENDERING
 */
function renderHeroes(heroes, movies) {
  ui.grid.innerHTML = heroes
    .map((hero) => {
      const isFav = favourites.some((f) => f.id === hero.id);

      return `
            <div class="hero-card">
                <button class="fav-btn-float ${isFav ? "active" : ""}" 
                        onclick="toggleFav('${hero.id}', '${hero.name.replace(/'/g, "")}', '${hero.image.url}')">
                    <i class="fas fa-heart"></i>
                </button>
                <img src="${hero.image.url}" alt="${hero.name}" loading="lazy">
                <div class="hero-content">
                    <h3>${hero.name}</h3>
                    <small>${hero.biography["full-name"] || "Alter Ego Hidden"}</small>
                    
                    <div class="stat-group">
                        <span class="pill">INT: ${hero.powerstats.intelligence}</span>
                        <span class="pill">STR: ${hero.powerstats.strength}</span>
                        <span class="pill">SPD: ${hero.powerstats.speed}</span>
                    </div>

                    <div class="movie-list">
                        <h4>CINEMATIC RECORDS</h4>
                        ${movies ? movies.map((m) => `<p>${m.Title} (${m.Year})</p>`).join("") : "<p>No records found.</p>"}
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

/**
 * PERSISTENCE (localStorage)
 */
window.toggleFav = (id, name, img) => {
  const idx = favourites.findIndex((f) => f.id === id);
  if (idx === -1) {
    favourites.push({ id, name, img });
  } else {
    favourites.splice(idx, 1);
  }

  localStorage.setItem("hero_vault", JSON.stringify(favourites));
  updateFavUI();
  // Smooth heart icon update without full re-render
  event.currentTarget.classList.toggle("active");
};

function updateFavUI() {
  ui.badge.innerText = favourites.length;
  ui.favList.innerHTML = favourites
    .map(
      (f) => `
        <div class="fav-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; background:rgba(255,255,255,0.05); padding:10px; border-radius:15px;">
            <img src="${f.img}" width="50" height="50" style="border-radius:50%; object-fit:cover;">
            <span style="flex:1; font-size:0.9rem;">${f.name}</span>
            <button onclick="toggleFav('${f.id}')" style="background:none; border:none; color:var(--accent); cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>
    `,
    )
    .join("");
}

// Events
ui.searchBtn.addEventListener("click", initiateSearch);
ui.input.addEventListener(
  "keypress",
  (e) => e.key === "Enter" && initiateSearch(),
);
document
  .getElementById("favTrigger")
  .addEventListener("click", () => ui.drawer.classList.add("active"));
document
  .getElementById("closeDrawer")
  .addEventListener("click", () => ui.drawer.classList.remove("active"));

function toggleLoader(val) {
  ui.loader.classList.toggle("hidden", !val);
}
function showNotification(txt) {
  ui.grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px;">${txt}</p>`;
}

// Bootstrap
updateFavUI();
