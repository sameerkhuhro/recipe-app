const searchBox = document.querySelector(".searchBox");
const searchBtn = document.querySelector(".searchBtn");
const recipeDetailsContent = document.querySelector(".recipe-detials-content");
const recipeCloseBtn = document.querySelector(".recipe-closeBtn");
const specialRecipeSection = document.querySelector("#special-recipe-section");
const searchResultsSection = document.querySelector("#search-results-section");
const searchResultsHeading = document.querySelector("#search-results-heading");
const specialRecipeContainer = document.querySelector("#special-recipe-section .recipe-container");
const searchResultsContainer = document.querySelector("#search-results-container");
const favoritesSection = document.querySelector("#favorites-section");
const favoritesContainer = document.querySelector("#favorites-container");
const paginationControls = document.querySelector("#pagination-controls");
const suggestionsDropdown = document.querySelector("#suggestions-dropdown");
const themeToggleBtn = document.querySelector("#theme-toggle");
const favoritesToggleBtn = document.querySelector("#favorites-toggle");

const RESULTS_PER_PAGE = 6;
const FAVORITES_KEY = "favoriteMealIds";
const THEME_KEY = "preferredTheme";

let currentSearchResults = [];
let currentPage = 1;
let suggestionTimer = null;
let favoritesVisible = false;

const getFavoriteIds = () => {
  try {
    const ids = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    return [];
  }
};

const setFavoriteIds = (ids) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
};

const isFavorite = (mealId) => getFavoriteIds().includes(mealId);

const updateFavoritesToggleLabel = () => {
  const count = getFavoriteIds().length;
  const countBadge = `<span class="favorites-count">${count}</span>`;
  favoritesToggleBtn.innerHTML = favoritesVisible
    ? `<i class="fa-solid fa-heart-crack"></i> Hide Favorites ${countBadge}`
    : `<i class="fa-solid fa-heart"></i> Favorites ${countBadge}`;
};

const toggleFavorite = (mealId) => {
  const ids = getFavoriteIds();
  const updated = ids.includes(mealId)
    ? ids.filter((id) => id !== mealId)
    : [...ids, mealId];

  setFavoriteIds(updated);
  updateFavoritesToggleLabel();
  if (favoritesVisible) {
    renderFavorites();
  }
  renderSearchResultsPage(currentPage);
};

const setFavoritesVisibility = async (visible) => {
  favoritesVisible = visible;
  favoritesSection.style.display = visible ? "block" : "none";
  updateFavoritesToggleLabel();

  if (visible) {
    await renderFavorites();
    favoritesSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const fetchIngredients = (meal) => {
  let ingredientsList = "";
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    if (ingredient && ingredient.trim()) {
      const measurement = meal[`strMeasure${i}`] || "";
      ingredientsList += `<li>${measurement} ${ingredient}</li>`;
    } else {
      break;
    }
  }
  return ingredientsList;
};

const openRecipePopup = (meal) => {
  const ingredientsHTML = fetchIngredients(meal) || "<li>No ingredients listed</li>";
  const instructions = meal.strInstructions || "No instructions available.";

  recipeDetailsContent.innerHTML = `
    <div class="recipe-popup">
      <h2 class="recipeName">${meal.strMeal}</h2>
      <div class="recipe-content">
        <div class="recipe-section recipe-ingredients">
          <h3>Ingredients</h3>
          <ul class="ingredientList">
            ${ingredientsHTML}
          </ul>
        </div>
        <div class="recipe-section recipe-instructions">
          <h3>Instructions</h3>
          <p class="recipeInstructions">${instructions}</p>
        </div>
      </div>
    </div>
  `;

  recipeDetailsContent.parentElement.style.display = "block";
};

const createRecipeCard = (meal) => {
  const recipeDiv = document.createElement("div");
  recipeDiv.classList.add("recipe", "fade-in-card");

  recipeDiv.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <h2>${meal.strMeal}</h2>
    <p>Belongs to <span>${meal.strCategory || "Unknown"}</span> Category</p>
    <p><span>${meal.strArea || "Unknown"}</span> Dish</p>
    <div class="recipe-actions">
      <button type="button" class="view-recipe-btn">View Recipe</button>
      <button type="button" class="favorite-btn ${isFavorite(meal.idMeal) ? "active" : ""}" aria-label="Add to favorites">
        <i class="fa-solid fa-heart"></i>
      </button>
    </div>
  `;

  const favoriteBtn = recipeDiv.querySelector(".favorite-btn");
  const viewRecipeBtn = recipeDiv.querySelector(".view-recipe-btn");

  favoriteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(meal.idMeal);
  });

  viewRecipeBtn.addEventListener("click", () => {
    openRecipePopup(meal);
  });

  requestAnimationFrame(() => {
    recipeDiv.classList.add("visible");
  });

  return recipeDiv;
};

const renderCards = (container, meals, emptyText) => {
  container.innerHTML = "";
  if (!meals.length) {
    container.innerHTML = `<h2>${emptyText}</h2>`;
    return;
  }

  meals.forEach((meal) => {
    container.appendChild(createRecipeCard(meal));
  });
};

const renderPagination = () => {
  const totalPages = Math.ceil(currentSearchResults.length / RESULTS_PER_PAGE);
  paginationControls.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      renderSearchResultsPage(currentPage - 1);
    }
  });

  const pageInfo = document.createElement("span");
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      renderSearchResultsPage(currentPage + 1);
    }
  });

  paginationControls.appendChild(prevBtn);
  paginationControls.appendChild(pageInfo);
  paginationControls.appendChild(nextBtn);
};

const renderSearchResultsPage = (page) => {
  currentPage = page;
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const paginatedMeals = currentSearchResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);
  renderCards(searchResultsContainer, paginatedMeals, "No recipes found. Try another search.");
  renderPagination();
};

const fetchRecipes = async (query) => {
  if (!query) {
    return;
  }

  specialRecipeSection.style.display = "none";
  searchResultsSection.style.display = "block";
  searchResultsHeading.textContent = `Search Results for: ${query}`;
  searchResultsContainer.innerHTML = "<h2>Found Recipes...</h2>";

  try {
    const data = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const response = await data.json();
    currentSearchResults = response.meals || [];
    renderSearchResultsPage(1);
  } catch (error) {
    currentSearchResults = [];
    searchResultsContainer.innerHTML = "<h2>Something went wrong. Please try again.</h2>";
    paginationControls.innerHTML = "";
  }
};

const fetchRandomRecipe = async () => {
  try {
    const data = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    const response = await data.json();
    const meal = response.meals[0];
    renderCards(specialRecipeContainer, [meal], "No special recipe available.");
  } catch (error) {
    specialRecipeContainer.innerHTML = "<h2>Unable to load today's special recipe.</h2>";
  }
};

const fetchRecipeById = async (mealId) => {
  const data = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
  const response = await data.json();
  return response.meals ? response.meals[0] : null;
};

const renderFavorites = async () => {
  const favoriteIds = getFavoriteIds();
  if (!favoriteIds.length) {
    favoritesContainer.innerHTML = "<h2>No favorites yet. Tap the heart icon to save recipes.</h2>";
    return;
  }

  favoritesContainer.innerHTML = "<h2>Loading favorites...</h2>";

  try {
    const meals = await Promise.all(favoriteIds.map((id) => fetchRecipeById(id)));
    const validMeals = meals.filter(Boolean);
    renderCards(favoritesContainer, validMeals, "No favorites found.");
  } catch (error) {
    favoritesContainer.innerHTML = "<h2>Could not load favorites.</h2>";
  }
};

const renderSuggestions = async (query) => {
  if (!query || query.length < 2) {
    suggestionsDropdown.innerHTML = "";
    suggestionsDropdown.style.display = "none";
    return;
  }

  try {
    const data = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const response = await data.json();
    const names = (response.meals || [])
      .map((meal) => meal.strMeal)
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .slice(0, 6);

    suggestionsDropdown.innerHTML = "";
    if (!names.length) {
      suggestionsDropdown.style.display = "none";
      return;
    }

    names.forEach((name) => {
      const item = document.createElement("li");
      item.textContent = name;
      item.addEventListener("click", () => {
        searchBox.value = name;
        suggestionsDropdown.innerHTML = "";
        suggestionsDropdown.style.display = "none";
        fetchRecipes(name);
      });
      suggestionsDropdown.appendChild(item);
    });

    suggestionsDropdown.style.display = "block";
  } catch (error) {
    suggestionsDropdown.innerHTML = "";
    suggestionsDropdown.style.display = "none";
  }
};

const applyTheme = (theme) => {
  document.body.classList.toggle("light-mode", theme === "light");
  themeToggleBtn.innerHTML = theme === "light"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
};

const initTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(savedTheme);
};

themeToggleBtn.addEventListener("click", () => {
  const isLight = document.body.classList.contains("light-mode");
  const nextTheme = isLight ? "dark" : "light";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
});

favoritesToggleBtn.addEventListener("click", () => {
  setFavoritesVisibility(!favoritesVisible);
});

searchBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const searchInput = searchBox.value.trim();
  suggestionsDropdown.innerHTML = "";
  suggestionsDropdown.style.display = "none";
  fetchRecipes(searchInput);
});

searchBox.addEventListener("input", () => {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => {
    renderSuggestions(searchBox.value.trim());
  }, 250);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("form")) {
    suggestionsDropdown.innerHTML = "";
    suggestionsDropdown.style.display = "none";
  }
});

recipeCloseBtn.addEventListener("click", () => {
  recipeDetailsContent.parentElement.style.display = "none";
  recipeDetailsContent.innerHTML = "";
});

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  fetchRandomRecipe();
  setFavoritesVisibility(false);
});
