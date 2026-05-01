let appData = null;
let currentSection = 'home';
let currentFilter = 'Allt';
let searchQuery = '';
let favorites = JSON.parse(localStorage.getItem('nutrition-favorites') || '[]');

// Initial load
fetchData('data_sv.json');

// Function to load the selected language file
function changeLanguage(filename) {
    document.getElementById('appContent').innerHTML = "<p style='text-align:center;'>Loading...</p>";
    fetchData(filename);
}

// Fetch JSON data and re-render the current view
function fetchData(filename) {
    fetch(filename)
        .then(response => response.json())
        .then(data => {
            appData = data;
            updateNavigationLabels(filename);
            renderSection(currentSection);
        })
        .catch(error => {
            document.getElementById('appContent').innerHTML = "<p style='text-align:center;'>Could not load language data. Make sure " + filename + " exists.</p>";
            console.error('Error fetching data:', error);
        });
}

// Optional: Update bottom nav text based on selected language
function updateNavigationLabels(filename) {
    if (filename === 'data_en.json') {
        const home = document.getElementById('label-home'); if (home) home.innerText = 'Home';
        const recipes = document.getElementById('label-recipes'); if (recipes) recipes.innerText = 'Recipes';
        const favorites = document.getElementById('label-favorites'); if (favorites) favorites.innerText = 'Favorites';
        const advice = document.getElementById('label-advice'); if (advice) advice.innerText = 'Advice';
        const know = document.getElementById('label-know'); if (know) know.innerText = 'Learn';
    } else {
        const home = document.getElementById('label-home'); if (home) home.innerText = 'Hem';
        const recipes = document.getElementById('label-recipes'); if (recipes) recipes.innerText = 'Recept';
        const favorites = document.getElementById('label-favorites'); if (favorites) favorites.innerText = 'Favoriter';
        const advice = document.getElementById('label-advice'); if (advice) advice.innerText = 'Råd';
        const know = document.getElementById('label-know'); if (know) know.innerText = 'Kunskap';
    }
}

function toggleFavorite(recipeTitle) {
    if (favorites.includes(recipeTitle)) {
        favorites = favorites.filter(t => t !== recipeTitle);
    } else {
        favorites.push(recipeTitle);
    }
    localStorage.setItem('nutrition-favorites', JSON.stringify(favorites));
    renderSection(currentSection);
}

function setFilter(category) {
    currentFilter = category;
    renderSection('recipes');
}

function handleSearch(event) {
    searchQuery = event.target.value.toLowerCase();
    renderSection('recipes');
}

// Render the selected view
function renderSection(section) {
    if (!appData) return;
    
    // Only reset filter and search if navigating to a new section
    if (currentSection !== section) {
        currentFilter = 'Allt';
        searchQuery = '';
        currentSection = section;
        window.scrollTo(0,0);
    }
    
    const container = document.getElementById('appContent');
    
    // Update active state on navigation safely
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById('nav-' + section);
    if (navItem) navItem.classList.add('active');

    if (section === 'home') {
        container.innerHTML = `
            <h2 class="page-title">${appData.welcome_page.title}</h2>
            <p class="page-subtitle">${appData.welcome_page.text}</p>
            ${appData.welcome_page.sections.map(sectionData => `
                <div class="content-card">
                    ${sectionData.image ? `<img src="${sectionData.image}" alt="Image" class="card-image">` : ''}
                    <h3>${sectionData.heading}</h3>
                    <p>${sectionData.body}</p>
                </div>`).join('')}`;
    } 
    
    else if (section === 'know') {
        container.innerHTML = `
            <h2 class="page-title">Kunskapsbas</h2>
            ${appData.knowledge_base.map((item, index) => `
            <div class="content-card">
                ${item.image ? `<img src="${item.image}" alt="Image" class="card-image">` : ''}
                <div class="status-badge" style="color: #f6ad55;">
                    <span class="status-dot" style="background-color: #f6ad55;"></span>${item.category}
                </div>
                <div class="card-icon">🔖</div>
                <h3>${item.title}</h3>
                <button class="toggle-btn" onclick="toggleAccordion('know-${index}')">Läs mer</button>
                <div id="acc-know-${index}" class="expandable-content">
                    <p style="white-space: pre-line;">${item.content}</p>
                </div>
            </div>`).join('')}`;
    } 
    
    else if (section === 'recipes') {
        // Build unique categories
        const categories = ['Allt', ...new Set(appData.recipes.map(r => r.category))];
        
        // Filter recipes
        let filteredRecipes = appData.recipes.filter(recipe => {
            const matchesFilter = currentFilter === 'Allt' || recipe.category === currentFilter;
            const matchesSearch = recipe.title.toLowerCase().includes(searchQuery) || 
                                  recipe.ingredients.some(i => i.toLowerCase().includes(searchQuery));
            return matchesFilter && matchesSearch;
        });

        container.innerHTML = `
            <h2 class="page-title">Mina Recept</h2>
            
            <div class="search-bar">
                <input type="text" placeholder="Sök recept eller ingrediens..." value="${searchQuery}" onkeyup="handleSearch(event)">
            </div>
            
            <div class="filter-scroll">
                ${categories.map(cat => `
                    <button class="filter-pill ${currentFilter === cat ? 'active' : ''}" onclick="setFilter('${cat}')">${cat}</button>
                `).join('')}
            </div>

            ${filteredRecipes.length === 0 ? '<p style="text-align:center; color:var(--text-muted);">Inga recept hittades.</p>' : ''}
            
            ${filteredRecipes.map((recipe, index) => `
            <div class="content-card">
                ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" class="card-image">` : ''}
                <div class="status-badge">
                    <span class="status-dot"></span>${recipe.category}
                </div>
                
                <div class="favorite-btn ${favorites.includes(recipe.title) ? 'active' : ''}" onclick="toggleFavorite('${recipe.title.replace(/'/g, "\\'")}')">
                    ${favorites.includes(recipe.title) ? '❤️' : '🤍'}
                </div>

                <h3>${recipe.title}</h3>
                <div class="macro-tag">${recipe.energy} | ${recipe.protein}</div>
                <button class="toggle-btn" onclick="toggleAccordion('rec-${index}')">Visa recept & ingredienser</button>
                <div id="acc-rec-${index}" class="expandable-content">
                    <div class="ingredients-list">
                        <strong>Ingredienser:</strong><br>
                        <ul>
                            ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                    <p><strong>Gör så här:</strong></p>
                    <p style="white-space: pre-line;">${recipe.instructions}</p>
                </div>
            </div>`).join('')}`;
            
        if (searchQuery !== '') {
            const input = document.querySelector('.search-bar input');
            if (input) {
                input.focus();
                const val = input.value;
                input.value = '';
                input.value = val;
            }
        }
    } 
    
    else if (section === 'favorites') {
        const favoriteRecipes = appData.recipes.filter(r => favorites.includes(r.title));
        
        container.innerHTML = `
            <h2 class="page-title">Mina Favoriter</h2>
            ${favoriteRecipes.length === 0 ? `
                <div style="text-align:center; padding: 40px 20px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">🤍</div>
                    <p style="color:var(--text-muted);">Du har inte sparat några favoriter ännu.</p>
                </div>
            ` : ''}
            
            ${favoriteRecipes.map((recipe, index) => `
            <div class="content-card">
                ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" class="card-image">` : ''}
                <div class="status-badge">
                    <span class="status-dot"></span>${recipe.category}
                </div>
                
                <div class="favorite-btn active" onclick="toggleFavorite('${recipe.title.replace(/'/g, "\\'")}')">
                    ❤️
                </div>

                <h3>${recipe.title}</h3>
                <div class="macro-tag">${recipe.energy} | ${recipe.protein}</div>
                <button class="toggle-btn" onclick="toggleAccordion('fav-${index}')">Visa recept & ingredienser</button>
                <div id="acc-fav-${index}" class="expandable-content">
                    <div class="ingredients-list">
                        <strong>Ingredienser:</strong><br>
                        <ul>
                            ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                    <p><strong>Gör så här:</strong></p>
                    <p style="white-space: pre-line;">${recipe.instructions}</p>
                </div>
            </div>`).join('')}`;
    }

    else if (section === 'advice') {
        container.innerHTML = `
            <h2 class="page-title">Medicinska Råd</h2>
            ${appData.medical_advice.map((advice, index) => `
            <div class="content-card">
                ${advice.image ? `<img src="${advice.image}" alt="Image" class="card-image">` : ''}
                <div class="status-badge" style="color: #e53e3e;">
                    <span class="status-dot" style="background-color: #e53e3e;"></span>Symtomhantering
                </div>
                <h3>${advice.title}</h3>
                <button class="toggle-btn" onclick="toggleAccordion('adv-${index}')">Visa information</button>
                <div id="acc-adv-${index}" class="expandable-content">
                    <p>${advice.info}</p>
                    ${advice.avoid ? `<div class="warning-alert"><strong>Viktigt att undvika:</strong><br><ul>${advice.avoid.map(item => `<li>${item}</li>`).join('')}</ul></div>` : ''}
                    ${advice.tips ? `<div style="margin-top:15px; background: rgba(235, 248, 250, 0.6); padding:15px; border-radius:12px; border: 1px solid rgba(255,255,255,0.5);"><strong>Praktiska råd:</strong><ul>${advice.tips.map(item => `<li>${item}</li>`).join('')}</ul></div>` : ''}
                </div>
            </div>`).join('')}`;
    }
}

// Toggle expand/collapse functionality
function toggleAccordion(id) {
    const element = document.getElementById('acc-' + id);
    const button = element.previousElementSibling;
    const isOpen = element.style.display === 'block';
    
    element.style.display = isOpen ? 'none' : 'block';
    
    if (isOpen) {
        if (id.includes('rec') || id.includes('fav')) button.innerText = 'Visa recept & ingredienser';
        else if (id.includes('know')) button.innerText = 'Läs mer';
        else button.innerText = 'Visa information';
    } else {
        button.innerText = 'Dölj / Hide';
    }
}

// Register new Service Worker safely
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
