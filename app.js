/**
 * Netflix IMDb Explorer - Application Logic
 */

// --- CONFIGURATION ---
const CONFIG = {
    domain: 'https://vidrock.to', // fallback only — the active server is chosen from SERVER_PRESETS / the Server button
    publicDemoKey: '2993855ff9655e88d076d338f71295fc',
    tmdbBaseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/original',
    posterBaseUrl: 'https://image.tmdb.org/t/p/w500'
};


// =====================================================================
// VIDEO SERVERS — put your 5 domains here (just replace the empty '' with a domain)
// Slot 1 is the default. Empty slots are hidden. People can also add their
// own servers from the "Server" button, and those are saved in their browser.
// Each server must accept:  {domain}/movie/{tmdbId}  and  {domain}/tv/{tmdbId}/{season}/{episode}
// =====================================================================
const SERVER_PRESETS = [
    { name: 'Server 1', url: 'https://player.vidzee.wtf/embed' },
    { name: 'Server 2', url: 'https://vidstorm.to' },
    { name: 'Server 3', url: 'https://vidrock.to' },
    { name: 'Server 4', url: 'https://vidnest.fun' },
    { name: 'Server 5', url: 'https://vidlink.pro' }
];


// =====================================================================
// FIREBASE CONFIG — paste yours here
// Firebase console → Project settings → General → Your apps → Web app → "SDK setup and configuration"
// (These values are safe to be public; your Firestore security rules protect the data.)
// =====================================================================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDP7sKFk-8qFDBLaHMHBaZrVr-wUm8faZs",
    authDomain: "netflixxlone-528de.firebaseapp.com",
    projectId: "netflixxlone-528de",
    storageBucket: "netflixxlone-528de.firebasestorage.app",
    messagingSenderId: "324468746158",
    appId: "1:324468746158:web:b620eb8530ffff375a0a3f",
    measurementId: "G-86JWSCK0FL"
};

// State Variables
let userApiKey = localStorage.getItem('tmdb_api_key') || CONFIG.publicDemoKey;
let currentActiveItem = null;
let catalog = {};
let allMediaMap = new Map();
let searchTimeout = null;

let recentlyBrowsed = JSON.parse(localStorage.getItem('recently_browsed_media') || '[]');

const fallbackCatalog = {
    "Trending Now": [
        { id: "f1", title: "Arcane", type: "series", rating: 9.0, year: "2024", genre: "Animation", poster: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=500", banner: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=1600", synopsis: "Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions.", cast: "Hailee Steinfeld, Ella Purnell, Kevin Alejandro", genres: ["Animation", "Action", "Sci-Fi"], seasonsCount: 2 },
        { id: "f2", title: "Interstellar", type: "movie", rating: 8.7, year: "2014", genre: "Sci-Fi", poster: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=500", banner: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=1600", synopsis: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft.", cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain", genres: ["Sci-Fi", "Drama", "Adventure"] },
        { id: "f3", title: "Stranger Things", type: "series", rating: 8.7, year: "2022", genre: "Sci-Fi", poster: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=500", banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1600", synopsis: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.", cast: "Millie Bobby Brown, Finn Wolfhard, Winona Ryder", genres: ["Sci-Fi", "Horror", "Drama"], seasonsCount: 4 },
        { id: "f4", title: "Inception", type: "movie", rating: 8.8, year: "2010", genre: "Action", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=500", banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1600", synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.", cast: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page", genres: ["Action", "Sci-Fi", "Thriller"] },
        { id: "f5", title: "Breaking Bad", type: "series", rating: 9.5, year: "2013", genre: "Crime", poster: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=500", banner: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=1600", synopsis: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student.", cast: "Bryan Cranston, Aaron Paul, Anna Gunn", genres: ["Crime", "Drama", "Thriller"], seasonsCount: 5 }
    ],
    "Blockbuster Movies": [
        { id: "f6", title: "The Dark Knight", type: "movie", rating: 9.0, year: "2008", genre: "Action", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=500", banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1600", synopsis: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.", cast: "Christian Bale, Heath Ledger, Aaron Eckhart", genres: ["Action", "Crime", "Drama"] }
    ],
    "Top Rated TV Series": [
        { id: "f10", title: "Game of Thrones", type: "series", rating: 9.2, year: "2019", genre: "Fantasy", poster: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&q=80&w=500", banner: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&q=80&w=1600", synopsis: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.", cast: "Emilia Clarke, Peter Dinklage, Kit Harington", genres: ["Fantasy", "Drama", "Adventure"], seasonsCount: 8 }
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    catalog = JSON.parse(JSON.stringify(fallbackCatalog));
    
    initApiKeyModal();
    initNavbarEffect();
    initSearch();
    initModal();
    initVideoPlayerModal();
    initAccounts();
    initServers();

    populateMediaMap(catalog);
    renderHero();
    updateRecentlyBrowsedRow();
    renderCategories();

    await loadMasterCatalog();
});

function populateMediaMap(catData) {
    Object.keys(catData).forEach(categoryName => {
        catData[categoryName].forEach(item => {
            allMediaMap.set(String(item.id), item);
        });
    });
}

function trackRecentlyBrowsed(item) {
    recentlyBrowsed = recentlyBrowsed.filter(i => i.id !== item.id);
    recentlyBrowsed.unshift(item);
    if (recentlyBrowsed.length > 10) recentlyBrowsed.pop();
    localStorage.setItem('recently_browsed_media', JSON.stringify(recentlyBrowsed));
    updateRecentlyBrowsedRow();
}

function updateRecentlyBrowsedRow() {
    if (recentlyBrowsed.length > 0) {
        catalog["Recently Browsed"] = recentlyBrowsed;
    }
}

async function loadMasterCatalog() {
    try {
        const [trendingRes, topMoviesRes, popularTvRes, actionRes] = await Promise.all([
            fetch(`${CONFIG.tmdbBaseUrl}/trending/all/day?api_key=${userApiKey}`),
            fetch(`${CONFIG.tmdbBaseUrl}/movie/top_rated?api_key=${userApiKey}`),
            fetch(`${CONFIG.tmdbBaseUrl}/tv/popular?api_key=${userApiKey}`),
            fetch(`${CONFIG.tmdbBaseUrl}/discover/movie?api_key=${userApiKey}&with_genres=28`)
        ]);

        const trendingData = await trendingRes.json();
        const topMoviesData = await topMoviesRes.json();
        const popularTvData = await popularTvRes.json();
        const actionData = await actionRes.json();

        const newCatalog = {};
        if (recentlyBrowsed.length > 0) {
            newCatalog["Recently Browsed"] = recentlyBrowsed;
        }
        newCatalog["Trending Now"] = processResults(trendingData.results || []);
        newCatalog["Blockbuster Movies"] = processResults(topMoviesData.results || [], 'movie');
        newCatalog["Top Rated TV Series"] = processResults(popularTvData.results || [], 'series');
        newCatalog["Action Thrillers"] = processResults(actionData.results || [], 'movie');

        if (newCatalog["Trending Now"].length > 0) {
            catalog = newCatalog;
            allMediaMap.clear();
            populateMediaMap(catalog);
            renderHero();
            renderCategories();
        }
    } catch (err) {
        console.log("Using built-in offline/fallback cinematic catalog.");
    }
}

function processResults(results, forcedType = null) {
    return results.map(item => {
        const type = forcedType || (item.media_type === 'tv' || item.first_air_date ? 'series' : 'movie');
        const title = item.title || item.name || 'Untitled';
        const year = (item.release_date || item.first_air_date || '2026').substring(0, 4);
        const rating = parseFloat((item.vote_average || 8.2).toFixed(1));
        const poster = item.poster_path ? `${CONFIG.posterBaseUrl}${item.poster_path}` : 'https://placehold.co/400x600/181818/ffffff?text=No+Image';
        const banner = item.backdrop_path ? `${CONFIG.imageBaseUrl}${item.backdrop_path}` : poster;
        const synopsis = item.overview || 'No synopsis available.';

        return {
            id: String(item.id),
            title,
            type,
            rating,
            year,
            duration: type === 'series' ? 'Series' : '2h 0m',
            genre: type === 'series' ? 'Series' : 'Blockbuster',
            genres: [type.toUpperCase()],
            synopsis,
            cast: 'Starring ensemble cast',
            banner,
            poster,
            seasonsCount: 1
        };
    });
}

function initNavbarEffect() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('bg-netflixDark', 'shadow-xl');
            navbar.classList.remove('bg-gradient-to-b', 'from-black/90', 'via-black/50', 'to-transparent');
        } else {
            navbar.classList.remove('bg-netflixDark', 'shadow-xl');
            navbar.classList.add('bg-gradient-to-b', 'from-black/90', 'via-black/50', 'to-transparent');
        }
    });
}

function renderHero() {
    const list = catalog['Trending Now'] || catalog[Object.keys(catalog)[0]];
    if (!list || list.length === 0) return;
    const feat = list[0];

    document.getElementById('hero-banner').style.backgroundImage = `url('${feat.banner}')`;
    document.getElementById('hero-rating').textContent = feat.rating;
    document.getElementById('hero-year').textContent = feat.year;
    document.getElementById('hero-title').textContent = feat.title;
    document.getElementById('hero-desc').textContent = feat.synopsis;

    heroFeatId = feat.id;
    document.getElementById('hero-list-btn').onclick = () => openListPicker(null, feat.id);
    document.getElementById('hero-info-btn').onclick = () => openModal(feat.id);
    document.getElementById('hero-play-btn').onclick = () => {
        trackRecentlyBrowsed(feat);
        if (feat.type === 'series') {
            openModal(feat.id);
        } else {
            openVideoPlayer(movieUrl(feat.id), `${feat.title} (Movie)`, feat);
        }
    };
    refreshListUI();
}

function addButtonHtml(id) {
    return `<button type="button" class="list-add-btn" data-id="${id}" onclick="openListPicker(event, '${id}')" title="Add to a list"><i class="fa-solid fa-plus"></i></button>`;
}

function rowCardHtml(item) {
    return `
        <div onclick="openModal('${item.id}')" class="movie-card flex-shrink-0 w-44 md:w-56 bg-[#1f1f1f] rounded-md overflow-hidden cursor-pointer shadow-md group/card">
            <div class="relative h-64 md:h-80 w-full overflow-hidden bg-gray-900">
                <img src="${item.poster}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" loading="lazy" onerror="this.src='https://placehold.co/400x600/181818/ffffff?text=No+Image'">
                ${addButtonHtml(item.id)}
                <div class="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-yellow-400 border border-yellow-500/30 flex items-center shadow">
                    <i class="fa-solid fa-star text-[10px] mr-1"></i> IMDb ${item.rating}
                </div>
            </div>
            <div class="p-3 space-y-1">
                <h3 class="font-semibold text-sm text-white truncate">${escapeHtml(item.title)}</h3>
                <div class="flex items-center justify-between text-xs text-gray-400">
                    <span>${item.year}</span>
                    <span class="border border-gray-600 px-1 rounded text-[10px] uppercase">${escapeHtml(item.genre || '')}</span>
                </div>
            </div>
        </div>`;
}

function buildRow(cat, items) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'space-y-3 px-4 md:px-12';
    if (cat.includes('TV')) rowDiv.id = 'series-row';
    if (cat.includes('Movies')) rowDiv.id = 'movies-row';
    if (cat.includes('Trending')) rowDiv.id = 'trending-row';

    rowDiv.innerHTML = `
        <h2 class="text-lg md:text-xl font-bold text-white hover:text-gray-300 transition cursor-pointer flex items-center group">
            <span>${cat}</span>
            <i class="fa-solid fa-angle-right ml-2 text-xs opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1"></i>
        </h2>
        <div class="relative group">
            <div class="flex space-x-4 overflow-x-auto no-scrollbar pb-6 pt-2 px-1">
                ${items.map(rowCardHtml).join('')}
            </div>
        </div>
    `;
    return rowDiv;
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    Object.keys(catalog).forEach(cat => {
        const items = catalog[cat];
        if (!items || items.length === 0) return;
        container.appendChild(buildRow(cat, items));
    });

    updateMyListRow();   // puts "My List" first when it has titles + sets the +/✓ buttons
    refreshListUI();
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchIconBtn = document.getElementById('search-icon-btn');
    const searchSection = document.getElementById('search-results-section');
    const searchTitle = document.getElementById('search-results-title');
    const categoriesContainer = document.getElementById('categories-container');
    const heroBanner = document.getElementById('hero-banner');

    searchIconBtn.addEventListener('click', () => searchInput.focus());

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);

        if (query.length === 0) {
            clearSearch();
            return;
        }

        heroBanner.style.display = 'none';
        categoriesContainer.style.display = 'none';
        searchSection.classList.remove('hidden');
        searchTitle.textContent = `Search Results for "${query}"`;

        let matched = [];
        allMediaMap.forEach(item => {
            if (item.title.toLowerCase().includes(query.toLowerCase()) || 
                (item.genre && item.genre.toLowerCase().includes(query.toLowerCase()))) {
                matched.push(item);
            }
        });

        renderSearchResults(matched);

        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`${CONFIG.tmdbBaseUrl}/search/multi?api_key=${userApiKey}&query=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.results) {
                    data.results.forEach(item => {
                        if (item.media_type === 'movie' || item.media_type === 'tv') {
                            const id = String(item.id);
                            if (!allMediaMap.has(id)) {
                                const type = item.media_type === 'tv' ? 'series' : 'movie';
                                const title = item.title || item.name || 'Untitled';
                                const year = (item.release_date || item.first_air_date || '2026').substring(0, 4);
                                const rating = parseFloat((item.vote_average || 7.8).toFixed(1));
                                const poster = item.poster_path ? `${CONFIG.posterBaseUrl}${item.poster_path}` : 'https://placehold.co/400x600/181818/ffffff?text=No+Image';
                                const banner = item.backdrop_path ? `${CONFIG.imageBaseUrl}${item.backdrop_path}` : poster;
                                
                                const mediaObj = {
                                    id,
                                    title,
                                    type,
                                    rating,
                                    year,
                                    duration: type === 'series' ? 'Series' : '2h 0m',
                                    genre: type.toUpperCase(),
                                    genres: [type],
                                    synopsis: item.overview || 'No synopsis.',
                                    cast: 'Ensemble cast',
                                    banner,
                                    poster,
                                    seasonsCount: 1
                                };
                                allMediaMap.set(id, mediaObj);
                                matched.push(mediaObj);
                            }
                        }
                    });
                    renderSearchResults(matched);
                }
            } catch (err) {
                console.log("Search API error:", err);
            }
        }, 300);
    });
}

function renderSearchResults(items) {
    const grid = document.getElementById('search-results-grid');
    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-16 text-center text-gray-400 text-lg">No movies or series found matching your query.</div>`;
        return;
    }

    grid.innerHTML = items.map(item => `
        <div onclick="openModal('${item.id}')" class="movie-card bg-[#1f1f1f] rounded-md overflow-hidden cursor-pointer shadow-md">
            <div class="relative h-64 sm:h-72 w-full bg-gray-900">
                <img src="${item.poster}" alt="${item.title}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='https://placehold.co/400x600/181818/ffffff?text=No+Image'">
                ${addButtonHtml(item.id)}
                <div class="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs font-bold text-yellow-400 border border-yellow-500/30 flex items-center">
                    <i class="fa-solid fa-star text-[10px] mr-1"></i> IMDb ${item.rating}
                </div>
            </div>
            <div class="p-3 space-y-1">
                <h3 class="font-semibold text-sm text-white truncate">${item.title}</h3>
                <div class="flex items-center justify-between text-xs text-gray-400">
                    <span>${item.year}</span>
                    <span class="border border-gray-600 px-1 rounded text-[10px] uppercase">${item.genre}</span>
                </div>
            </div>
        </div>
    `).join('');
    refreshListUI();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-results-section').classList.add('hidden');
    document.getElementById('hero-banner').style.display = 'flex';
    document.getElementById('categories-container').style.display = 'block';
}

function resetHomeView(e) {
    if (e) e.preventDefault();
    clearSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initModal() {
    const modal = document.getElementById('details-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    const seasonSelect = document.getElementById('season-select');
    seasonSelect.addEventListener('change', (e) => {
        if (currentActiveItem && currentActiveItem.type === 'series') {
            loadEpisodesForSeason(currentActiveItem.id, e.target.value);
        }
    });
}

async function openModal(id) {
    id = String(id);
    let item = getMedia(id);
    if (!item) return;
    currentActiveItem = item;
    trackRecentlyBrowsed(item);

    if (!isNaN(id) && !id.startsWith('f')) {
        try {
            const typeEndpoint = item.type === 'series' ? 'tv' : 'movie';
            const [detailRes, creditsRes] = await Promise.all([
                fetch(`${CONFIG.tmdbBaseUrl}/${typeEndpoint}/${id}?api_key=${userApiKey}`),
                fetch(`${CONFIG.tmdbBaseUrl}/${typeEndpoint}/${id}/credits?api_key=${userApiKey}`)
            ]);
            const detail = await detailRes.json();
            const credits = await creditsRes.json();

            if (detail.id) {
                item.synopsis = detail.overview || item.synopsis;
                item.rating = parseFloat((detail.vote_average || item.rating).toFixed(1));
                if (detail.number_of_seasons) {
                    item.duration = `${detail.number_of_seasons} Seasons`;
                    item.seasonsCount = detail.number_of_seasons;
                } else if (detail.runtime) {
                    item.duration = `${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m`;
                }
                if (credits.cast) item.cast = credits.cast.slice(0, 4).map(c => c.name).join(', ');
            }
        } catch (e) {
            console.log("Detail fetch error");
        }
    }

    const modal = document.getElementById('details-modal');
    const box = document.getElementById('modal-content-box');

    document.getElementById('modal-banner').style.backgroundImage = `url('${item.banner}')`;
    document.getElementById('modal-title').textContent = item.title;
    document.getElementById('modal-rating').innerHTML = `<i class="fa-solid fa-star mr-1"></i> IMDb ${item.rating}`;
    document.getElementById('modal-year').textContent = item.year;
    document.getElementById('modal-duration').textContent = item.duration;
    document.getElementById('modal-genre').textContent = item.genre;
    document.getElementById('modal-synopsis').textContent = item.synopsis;
    document.getElementById('modal-cast').textContent = item.cast;
    document.getElementById('modal-genres-list').textContent = (item.genres || []).join(', ');
    document.getElementById('modal-list-btn').onclick = () => openListPicker(null, item.id);
    updateModalListBtn();

    const epSection = document.getElementById('modal-episodes-section');
    const mainPlayBtn = document.getElementById('modal-main-play-btn');
    const playBtnText = document.getElementById('modal-play-btn-text');

    if (item.type === 'series') {
        epSection.classList.remove('hidden');
        playBtnText.textContent = 'Play Season 1 Ep 1';
        mainPlayBtn.onclick = () => {
            playEpisode(item.id, '1', '1', 'Pilot');
        };
        setupSeasonsDropdown(item.id, item.seasonsCount || 1);
    } else {
        epSection.classList.add('hidden');
        playBtnText.textContent = 'Play Movie';
        mainPlayBtn.onclick = () => {
            closeModal();
            openVideoPlayer(movieUrl(item.id), `${item.title} (Movie)`, item);
        };
    }

    modal.classList.remove('opacity-0', 'pointer-events-none');
    box.classList.remove('scale-95');
    box.classList.add('scale-100');
    document.body.style.overflow = 'hidden';
}

function setupSeasonsDropdown(tvId, count) {
    const seasonSelect = document.getElementById('season-select');
    seasonSelect.innerHTML = '';
    for (let s = 1; s <= count; s++) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `Season ${s}`;
        seasonSelect.appendChild(opt);
    }
    loadEpisodesForSeason(tvId, 1);
}

async function loadEpisodesForSeason(tvId, seasonNum) {
    const episodesList = document.getElementById('episodes-list');
    episodesList.innerHTML = `<div class="py-4 text-center text-gray-400 text-sm">Loading episodes for Season ${seasonNum}...</div>`;

    if (String(tvId).startsWith('f')) {
        episodesList.innerHTML = `
            <div onclick="playEpisode('${tvId}', '${seasonNum}', '1', 'Pilot')" class="flex items-center justify-between p-3 bg-black/40 hover:bg-black/70 rounded-lg text-sm text-gray-300 border border-gray-800 transition cursor-pointer group">
                <div class="flex items-center space-x-3">
                    <span class="text-gray-400 font-bold">1</span>
                    <div>
                        <h4 class="font-semibold text-white group-hover:text-netflixRed transition">Episode 1: Pilot</h4>
                        <p class="text-xs text-gray-400">The journey begins in Season ${seasonNum}, Episode 1.</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-xs text-gray-500">45m</span>
                    <div class="bg-white/10 group-hover:bg-netflixRed text-white w-7 h-7 rounded-full flex items-center justify-center transition">
                        <i class="fa-solid fa-play text-xs"></i>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch(`${CONFIG.tmdbBaseUrl}/tv/${tvId}/season/${seasonNum}?api_key=${userApiKey}`);
        const data = await res.json();
        
        if (data.episodes && data.episodes.length > 0) {
            episodesList.innerHTML = data.episodes.map(ep => `
                <div onclick="playEpisode('${tvId}', '${seasonNum}', '${ep.episode_number}')" class="flex items-center justify-between p-3 bg-black/40 hover:bg-black/70 rounded-lg text-sm text-gray-300 border border-gray-800 transition cursor-pointer group">
                    <div class="flex items-center space-x-3 pr-2">
                        <span class="text-gray-400 font-bold w-6 text-center">${ep.episode_number}</span>
                        <div>
                            <h4 class="font-semibold text-white group-hover:text-netflixRed transition">Episode ${ep.episode_number}: ${ep.name || 'Untitled'}</h4>
                            <p class="text-xs text-gray-400 line-clamp-1">${ep.overview || 'No description available.'}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3 flex-shrink-0">
                        <span class="text-xs text-gray-500">${ep.runtime ? ep.runtime + 'm' : '40m'}</span>
                        <div class="bg-white/10 group-hover:bg-netflixRed text-white w-7 h-7 rounded-full flex items-center justify-center transition">
                            <i class="fa-solid fa-play text-xs"></i>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            episodesList.innerHTML = `<div class="py-4 text-center text-gray-400 text-sm">No episodes available for this season.</div>`;
        }
    } catch (err) {
        episodesList.innerHTML = `<div class="py-4 text-center text-red-400 text-sm">Could not load episodes.</div>`;
    }
}

// =====================================================================
// VIDEO PLAYER
// =====================================================================
const seasonCache = new Map();

let player = {
    open: false,
    item: null,
    tvId: null,
    title: '',
    isSeries: false,
    season: 1,
    episode: 1,
    viewSeason: 1,     // season currently listed in the sidebar (can differ from the playing one)
    totalSeasons: 1,
    token: 0,          // bumps on every navigation so stale async results are ignored
    loadTimer: null
};

const plEl = (id) => document.getElementById(id);
const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function episodeUrl(tvId, season, episode) {
    return `${CONFIG.domain}/tv/${tvId}/${season}/${episode}`;
}

// Fetch (and cache) the episode list of one season.
async function fetchSeason(tvId, seasonNum) {
    const key = `${tvId}:${seasonNum}`;
    if (seasonCache.has(key)) return seasonCache.get(key);

    let episodes = null;
    if (String(tvId).startsWith('f')) {
        // Offline fallback shows: generate a placeholder list
        episodes = Array.from({ length: 8 }, (_, i) => ({
            episode_number: i + 1, name: `Episode ${i + 1}`, runtime: 45
        }));
    } else {
        try {
            const res = await fetch(`${CONFIG.tmdbBaseUrl}/tv/${tvId}/season/${seasonNum}?api_key=${userApiKey}`);
            const data = await res.json();
            if (Array.isArray(data.episodes) && data.episodes.length) episodes = data.episodes;
        } catch (e) { /* network error -> return [] below, not cached */ }
    }

    if (episodes) seasonCache.set(key, episodes);
    return episodes || [];
}

// Called from the details modal. Resolves the show BEFORE closing the modal
// (closeModal() clears currentActiveItem, which is what used to break the player).
function playEpisode(tvId, seasonNum, episodeNum) {
    const item = allMediaMap.get(String(tvId)) || currentActiveItem;
    closeModal();
    openVideoPlayer(null, item ? item.title : 'Now Playing', item, seasonNum, episodeNum);
}

async function openVideoPlayer(url, titleText, item, activeSeason = 1, activeEpisode = 1) {
    const isSeries = !!item && item.type === 'series';
    const season = Number(activeSeason) || 1;

    player = {
        ...player,
        open: true,
        item,
        tvId: item ? item.id : null,
        title: isSeries ? item.title : titleText,
        isSeries,
        season,
        episode: Number(activeEpisode) || 1,
        viewSeason: season,
        totalSeasons: (item && item.seasonsCount) || 1,
        token: player.token + 1
    };

    plEl('player-title').textContent = player.title;
    plEl('player-subtitle').textContent = '';
    plEl('player-controls').classList.toggle('hidden', !isSeries);
    plEl('player-top-nav').classList.toggle('hidden', !isSeries);
    plEl('player-menu-btn').classList.toggle('hidden', !isSeries);
    plEl('player-sidebar').classList.toggle('hidden', !isSeries);

    plEl('video-player-modal').classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';

    if (!isSeries) {
        setPlayerSidebar(false);
        setPlayerSource(url);
        return;
    }

    setupPlayerSeasonsDropdown();
    setPlayerSidebar(isDesktop());
    await loadEpisode(player.season, player.episode);
}

// Load a specific episode into the iframe and refresh title, buttons and sidebar.
async function loadEpisode(season, episode) {
    const token = ++player.token;
    player.season = season;
    player.episode = episode;
    player.viewSeason = season;

    setPlayerSource(episodeUrl(player.tvId, season, episode));
    plEl('player-subtitle').textContent = `Season ${season} · Episode ${episode}`;
    syncSeasonSelect();
    setNavButtons(false, false, '', '');
    plEl('player-sidebar-episodes-list').innerHTML = `<div class="pl-empty">Loading…</div>`;

    const eps = await fetchSeason(player.tvId, season);
    if (token !== player.token) return;

    const current = eps.find(e => e.episode_number === episode);
    plEl('player-subtitle').textContent =
        `Season ${season} · Episode ${episode}` + (current && current.name ? ` — ${current.name}` : '');

    updateNavButtons(eps);
    renderSidebarEpisodes(eps, season);
}

function updateNavButtons(eps) {
    const { season, episode, totalSeasons } = player;
    const idx = eps.findIndex(e => e.episode_number === episode);
    const label = (ep) => `E${ep.episode_number}: ${ep.name || 'Episode ' + ep.episode_number}`;

    let hasPrev, hasNext, prevText = '', nextText = '';

    if (eps.length === 0) {                // episode list failed to load: still allow stepping
        hasPrev = episode > 1 || season > 1;
        hasNext = true;
    } else {
        hasPrev = idx > 0 || season > 1;
        hasNext = idx < eps.length - 1 || season < totalSeasons;
        if (idx > 0) prevText = label(eps[idx - 1]);
        else if (season > 1) prevText = `Season ${season - 1}`;
        if (idx >= 0 && idx < eps.length - 1) nextText = label(eps[idx + 1]);
        else if (season < totalSeasons) nextText = `Season ${season + 1}`;
    }
    setNavButtons(hasPrev, hasNext, prevText, nextText);
}

function setNavButtons(hasPrev, hasNext, prevText, nextText) {
    plEl('player-prev-btn').disabled = !hasPrev;
    plEl('player-next-btn').disabled = !hasNext;
    plEl('player-prev-top').disabled = !hasPrev;
    plEl('player-next-top').disabled = !hasNext;
    plEl('prev-label').textContent = prevText;
    plEl('next-label').textContent = nextText;
}

// dir: +1 = next episode, -1 = previous episode. Crosses season boundaries.
async function stepEpisode(dir) {
    if (!player.isSeries) return;
    const { tvId, season, episode, totalSeasons } = player;
    const eps = await fetchSeason(tvId, season);
    const idx = eps.findIndex(e => e.episode_number === episode);

    if (dir > 0) {
        if (eps.length === 0) return loadEpisode(season, episode + 1);
        if (idx >= 0 && idx < eps.length - 1) return loadEpisode(season, eps[idx + 1].episode_number);
        if (season < totalSeasons) {
            const nextEps = await fetchSeason(tvId, season + 1);
            return loadEpisode(season + 1, nextEps.length ? nextEps[0].episode_number : 1);
        }
    } else {
        if (eps.length === 0 && episode > 1) return loadEpisode(season, episode - 1);
        if (idx > 0) return loadEpisode(season, eps[idx - 1].episode_number);
        if (season > 1) {
            const prevEps = await fetchSeason(tvId, season - 1);
            return loadEpisode(season - 1, prevEps.length ? prevEps[prevEps.length - 1].episode_number : 1);
        }
    }
}

function playNextEpisode() { stepEpisode(1); }
function playPrevEpisode() { stepEpisode(-1); }

// ---- Sidebar -------------------------------------------------------
function setupPlayerSeasonsDropdown() {
    const select = plEl('player-season-select');
    select.innerHTML = '';
    for (let s = 1; s <= player.totalSeasons; s++) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `Season ${s}`;
        select.appendChild(opt);
    }
    select.value = player.season;
}

function syncSeasonSelect() {
    const select = plEl('player-season-select');
    if (select) select.value = player.viewSeason;
}

function renderSidebarEpisodes(eps, seasonNum) {
    if (player.viewSeason !== seasonNum) return;   // user switched seasons meanwhile
    const list = plEl('player-sidebar-episodes-list');

    if (!eps.length) {
        list.innerHTML = `<div class="pl-empty">No episodes found for this season.</div>`;
        return;
    }

    list.innerHTML = eps.map(ep => {
        const active = seasonNum === player.season && ep.episode_number === player.episode;
        return `
            <button type="button" class="pl-ep ${active ? 'is-active' : ''}" data-season="${seasonNum}" data-ep="${ep.episode_number}">
                <span class="pl-ep-num">${ep.episode_number}</span>
                <span class="pl-ep-info">
                    <b>${escapeHtml(ep.name || 'Episode ' + ep.episode_number)}</b>
                    <small>${ep.runtime ? ep.runtime + ' min' : '40 min'}</small>
                </span>
                <i class="fa-solid fa-play"></i>
            </button>`;
    }).join('');

    const activeEl = list.querySelector('.is-active');
    if (activeEl) activeEl.scrollIntoView({ block: 'center' });
}

async function showSeasonInSidebar(seasonNum) {
    player.viewSeason = seasonNum;
    plEl('player-sidebar-episodes-list').innerHTML = `<div class="pl-empty">Loading…</div>`;
    const eps = await fetchSeason(player.tvId, seasonNum);
    renderSidebarEpisodes(eps, seasonNum);
}

function setPlayerSidebar(open) {
    plEl('player-sidebar').classList.toggle('is-collapsed', !open);
    plEl('player-sidebar-backdrop').classList.toggle('is-hidden', !open);
    plEl('sidebar-collapse-btn').querySelector('i').className =
        `fa-solid ${open ? 'fa-chevron-left' : 'fa-chevron-right'}`;
}

function togglePlayerSidebar() {
    if (!player.isSeries) return;
    setPlayerSidebar(plEl('player-sidebar').classList.contains('is-collapsed'));
}

// ---- Iframe / lifecycle -------------------------------------------
function setPlayerSource(url) {
    const iframe = plEl('video-iframe');
    const loading = plEl('player-loading');
    clearTimeout(player.loadTimer);
    loading.classList.remove('is-hidden');
    iframe.onload = () => loading.classList.add('is-hidden');
    player.loadTimer = setTimeout(() => loading.classList.add('is-hidden'), 8000);
    applyIframeSandbox();
    iframe.src = url;
}

function initVideoPlayerModal() {
    const modal = plEl('video-player-modal');

    plEl('player-close-btn').addEventListener('click', closeVideoPlayer);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeVideoPlayer(); });

    plEl('sidebar-collapse-btn').addEventListener('click', togglePlayerSidebar);
    plEl('player-menu-btn').addEventListener('click', togglePlayerSidebar);
    plEl('player-episodes-btn').addEventListener('click', togglePlayerSidebar);
    plEl('player-sidebar-backdrop').addEventListener('click', () => setPlayerSidebar(false));

    plEl('player-prev-btn').addEventListener('click', playPrevEpisode);
    plEl('player-prev-top').addEventListener('click', playPrevEpisode);
    plEl('player-next-top').addEventListener('click', playNextEpisode);
    plEl('player-next-btn').addEventListener('click', playNextEpisode);

    plEl('player-season-select').addEventListener('change', (e) => {
        if (player.isSeries) showSeasonInSidebar(Number(e.target.value));
    });

    plEl('player-sidebar-episodes-list').addEventListener('click', (e) => {
        const row = e.target.closest('[data-ep]');
        if (!row) return;
        loadEpisode(Number(row.dataset.season), Number(row.dataset.ep));
        if (!isDesktop()) setPlayerSidebar(false);
    });

    document.addEventListener('keydown', (e) => {
        if (!player.open) return;
        if (e.key === 'Escape') {
            if (!byId('server-modal').classList.contains('pointer-events-none')) return;
            closeVideoPlayer();
            return;
        }
        if (!player.isSeries || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target.matches && e.target.matches('input, textarea, select')) return;
        const k = e.key.toLowerCase();
        if (k === 'n') playNextEpisode();
        else if (k === 'p') playPrevEpisode();
        else if (k === 'e') togglePlayerSidebar();
    });
}

function closeVideoPlayer() {
    const iframe = plEl('video-iframe');
    clearTimeout(player.loadTimer);
    player.open = false;
    player.token++;              // cancel any in-flight episode loads

    plEl('video-player-modal').classList.add('opacity-0', 'pointer-events-none');
    iframe.onload = null;
    iframe.src = 'about:blank';
    document.body.style.overflow = 'auto';
}

function closeModal() {
    const modal = document.getElementById('details-modal');
    const box = document.getElementById('modal-content-box');
    modal.classList.add('opacity-0', 'pointer-events-none');
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
    document.body.style.overflow = 'auto';
    currentActiveItem = null;
}

function initApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    const openBtn = document.getElementById('api-key-modal-btn');
    const closeBtn = document.getElementById('api-modal-close');
    const saveBtn = document.getElementById('api-save-btn');
    const clearBtn = document.getElementById('api-clear-btn');
    const input = document.getElementById('tmdb-api-input');

    input.value = userApiKey === CONFIG.publicDemoKey ? '' : userApiKey;
    openBtn.addEventListener('click', () => modal.classList.remove('opacity-0', 'pointer-events-none'));
    closeBtn.addEventListener('click', () => modal.classList.add('opacity-0', 'pointer-events-none'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('opacity-0', 'pointer-events-none'); });
    
    saveBtn.addEventListener('click', () => {
        userApiKey = input.value.trim() || CONFIG.publicDemoKey;
        localStorage.setItem('tmdb_api_key', userApiKey);
        modal.classList.add('opacity-0', 'pointer-events-none');
        loadMasterCatalog();
    });

    clearBtn.addEventListener('click', () => {
        localStorage.removeItem('tmdb_api_key');
        userApiKey = CONFIG.publicDemoKey;
        input.value = '';
        modal.classList.add('opacity-0', 'pointer-events-none');
        loadMasterCatalog();
    });
}

// =====================================================================
// ACCOUNTS (Firebase Auth + Firestore), PROFILE & LISTS
// =====================================================================
const firebaseConfigured =
    typeof firebase !== 'undefined' &&
    !!FIREBASE_CONFIG.apiKey &&
    !String(FIREBASE_CONFIG.apiKey).startsWith('YOUR_');

let fbAuth = null;
let fbDb = null;

const DEFAULT_LIST_ID = 'my-list';
const LOCAL_FLAG_KEY = 'nx_local_guest';

// account.user    = { uid, email, isGuest, local }   (null when signed out)
// account.profile = { displayName, avatar, lists: [{ id, name, items: [media...] }] }
let account = { user: null, profile: null };
let pendingAfterAuth = null;   // action to run once the person is signed in
let pendingSignupName = null;  // username typed on the sign-up form
let authMode = 'signin';
let authBusy = false;
let pickerMediaId = null;
let activeListId = DEFAULT_LIST_ID;
let listFormMode = null;       // 'create' | 'rename' | null
let deleteArmed = false;
let heroFeatId = null;
let selectedAvatar = 'cat';
const listMediaCache = new Map();

// ---------------------------------------------------------------------
// Cute pixel-art avatars (10x10 grids, '.' = transparent)
// ---------------------------------------------------------------------
const AVATARS = {
    cat: {
        name: 'Cat', bg: '#ffe2b8',
        pal: { O: '#f59e42', K: '#2b2b3a', P: '#ff8fb1' },
        grid: [
            '.O......O.', '.OO....OO.', '.OOOOOOOO.', 'OOOOOOOOOO', 'OOKOOOOKOO',
            'OOOOOOOOOO', 'OPOOPPOOPO', '.OOOOOOOO.', '..OOOOOO..', '..........'
        ]
    },
    bear: {
        name: 'Bear', bg: '#cfe8ff',
        pal: { B: '#a8683a', K: '#2b2b3a', T: '#e8c9a0' },
        grid: [
            '.BB....BB.', '.BBBBBBBB.', 'BBBBBBBBBB', 'BBKBBBBKBB', 'BBBBBBBBBB',
            'BBBTTTTBBB', 'BBBTKKTBBB', '.BBTTTTBB.', '..BBBBBB..', '..........'
        ]
    },
    ghost: {
        name: 'Ghost', bg: '#2d2250',
        pal: { W: '#f1edff', K: '#2b2b3a', P: '#ff9ec4' },
        grid: [
            '...WWWW...', '..WWWWWW..', '.WWWWWWWW.', '.WWKWWKWW.', '.WWKWWKWW.',
            '.WWWWWWWW.', '.WPWKKWPW.', '.WWWWWWWW.', '.WW.WW.WW.', '..........'
        ]
    },
    frog: {
        name: 'Frog', bg: '#d9f7c8',
        pal: { G: '#4caf50', W: '#ffffff', K: '#2b2b3a', P: '#ff8fb1' },
        grid: [
            '.GGG..GGG.', 'GWKWGGWKWG', 'GGGGGGGGGG', 'GGGGGGGGGG', 'GGPGGGGPGG',
            'GGGGGGGGGG', 'GGKGGGGKGG', 'GGGKKKKGGG', '.GGGGGGGG.', '..........'
        ]
    },
    robot: {
        name: 'Robot', bg: '#e3e8f5',
        pal: { S: '#9aa8c7', R: '#ff4d5e', C: '#38e1ff', K: '#2b2b3a' },
        grid: [
            '....RR....', '....SS....', '.SSSSSSSS.', '.SCCSSCCS.', '.SCCSSCCS.',
            '.SSSSSSSS.', '.SKKKKKKS.', '.SSSSSSSS.', '..SS..SS..', '..........'
        ]
    },
    bunny: {
        name: 'Bunny', bg: '#ffe0ef',
        pal: { W: '#ffffff', P: '#ff9ec4', K: '#2b2b3a' },
        grid: [
            '..WW..WW..', '..WP..PW..', '..WP..PW..', '.WWWWWWWW.', 'WWKWWWWKWW',
            'WWWWWWWWWW', 'WWPWPPWPWW', '.WWWWWWWW.', '..WWWWWW..', '..........'
        ]
    },
    alien: {
        name: 'Alien', bg: '#2a1f4a',
        pal: { G: '#7ee081', K: '#12121c', W: '#ffffff' },
        grid: [
            '..........', '..GGGGGG..', '.GGGGGGGG.', 'GGGGGGGGGG', 'GKWKGGKWKG',
            'GGKKGGKKGG', '.GGGGGGGG.', '..GGKKGG..', '...GGGG...', '....GG....'
        ]
    },
    chick: {
        name: 'Chick', bg: '#fff3b0',
        pal: { Y: '#ffd93d', K: '#2b2b3a', O: '#ff8c42', P: '#ff9ec4' },
        grid: [
            '....YY....', '...YYYY...', '..YYYYYY..', '..YKYYKY..', '..PYYYYP..',
            '.YYYOOYYY.', '.YYYYYYYY.', '..YYYYYY..', '...O..O...', '..........'
        ]
    },
    dog: {
        name: 'Dog', bg: '#ffe9c9',
        pal: { D: '#8a5a33', T: '#e0a96d', W: '#fff1dc', K: '#2b2b3a' },
        grid: [
            '..........', '.DD....DD.', 'DDDTTTTDDD', 'DDTTTTTTDD', 'DDTKTTKTDD',
            '.DTTTTTTD.', '..TWWWWT..', '..TWKKWT..', '...TWWT...', '..........'
        ]
    }
};

function pixelAvatar(key) {
    const a = AVATARS[key] || AVATARS.cat;
    let rects = '';
    a.grid.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const col = a.pal[row[x]];
            if (col) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`;
        }
    });
    return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect width="10" height="10" fill="${a.bg}"/>${rects}</svg>`;
}

// ---------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------
const OVERLAY_IDS = ['server-modal', 'details-modal', 'video-player-modal', 'api-key-modal', 'auth-modal', 'profile-modal', 'lists-modal', 'list-picker-modal'];

function anyOverlayOpen() {
    return OVERLAY_IDS.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('pointer-events-none');
    });
}
function openOverlay(id) {
    document.getElementById(id).classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
}
function closeOverlay(id) {
    document.getElementById(id).classList.add('opacity-0', 'pointer-events-none');
    if (!anyOverlayOpen()) document.body.style.overflow = 'auto';
}
function showToast(message) {
    const el = document.createElement('div');
    el.className = 'nx-toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
}
const byId = (id) => document.getElementById(id);

// ---------------------------------------------------------------------
// Profile data helpers + persistence
// ---------------------------------------------------------------------
function defaultProfile(name) {
    return { displayName: name || 'Guest', avatar: 'cat', lists: [{ id: DEFAULT_LIST_ID, name: 'My List', items: [] }] };
}

function normalizeProfile(p, fallbackName) {
    const base = defaultProfile(fallbackName);
    const out = {
        displayName: (p && p.displayName) || base.displayName,
        avatar: p && AVATARS[p.avatar] ? p.avatar : 'cat',
        lists: Array.isArray(p && p.lists) && p.lists.length ? p.lists : base.lists
    };
    out.lists.forEach(l => { l.items = Array.isArray(l.items) ? l.items : []; });
    if (!out.lists.some(l => l.id === DEFAULT_LIST_ID)) out.lists.unshift(base.lists[0]);
    return out;
}

const cacheKey = (uid) => `nx_profile_${uid}`;
function readCache(uid) {
    try { return JSON.parse(localStorage.getItem(cacheKey(uid)) || 'null'); } catch (e) { return null; }
}
function writeCache(uid, profile) {
    try { localStorage.setItem(cacheKey(uid), JSON.stringify(profile)); } catch (e) {}
}

let saveTimer = null;
function persistProfile(immediate = false) {
    if (!account.user || !account.profile) return;
    const { uid, local } = account.user;
    const snapshot = JSON.parse(JSON.stringify(account.profile));
    writeCache(uid, snapshot);
    if (local || !fbDb) return;

    const write = () => fbDb.collection('users').doc(uid).set(snapshot)
        .catch(err => { console.warn('Firestore save failed:', err); showToast('Could not sync to the cloud — check your Firestore rules.'); });

    clearTimeout(saveTimer);
    if (immediate) write(); else saveTimer = setTimeout(write, 400);
}

// ---------------------------------------------------------------------
// Auth state
// ---------------------------------------------------------------------
function initAccounts() {
    if (firebaseConfigured) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
            fbAuth = firebase.auth();
            fbDb = firebase.firestore();
        } catch (err) {
            console.error('Firebase init failed:', err);
            fbAuth = null; fbDb = null;
        }
    }

    buildAvatarGrid();
    wireAccountUI();
    renderNavAccount();

    if (fbAuth) {
        fbAuth.onAuthStateChanged(handleAuthChange);
    } else if (localStorage.getItem(LOCAL_FLAG_KEY)) {
        startLocalGuest();
    }
}

async function handleAuthChange(user) {
    if (!user) {
        account = { user: null, profile: null };
        afterAccountChange();
        return;
    }
    const fallbackName = pendingSignupName || user.displayName ||
        (user.isAnonymous ? 'Guest' + String(user.uid).slice(0, 4).toUpperCase() : (user.email || 'Viewer').split('@')[0]);

    let data = null;
    let cloudOk = true;
    try {
        const snap = await fbDb.collection('users').doc(user.uid).get();
        data = snap.exists ? snap.data() : null;
    } catch (err) {
        cloudOk = false;
        console.warn('Could not read profile from Firestore:', err);
    }

    account = {
        user: { uid: user.uid, email: user.email || '', isGuest: user.isAnonymous, local: false },
        profile: normalizeProfile(data || readCache(user.uid), fallbackName)
    };
    if (!data && cloudOk) persistProfile(true);   // first time: create the document
    afterAccountChange();
}

function startLocalGuest() {
    account = {
        user: { uid: 'local-guest', email: '', isGuest: true, local: true },
        profile: normalizeProfile(readCache('local-guest'), 'Guest')
    };
    localStorage.setItem(LOCAL_FLAG_KEY, '1');
    persistProfile(true);
    afterAccountChange();
}

function afterAccountChange() {
    listMediaCache.clear();
    if (account.profile) {
        account.profile.lists.forEach(l => l.items.forEach(i => listMediaCache.set(String(i.id), i)));
    }
    renderNavAccount();
    renderCategories();
    refreshListUI();

    if (account.user && pendingAfterAuth) {
        const action = pendingAfterAuth;
        pendingAfterAuth = null;
        action();
    }
}

function renderNavAccount() {
    const av = byId('nav-avatar');
    const nm = byId('nav-username');
    if (account.profile) {
        av.innerHTML = pixelAvatar(account.profile.avatar);
        nm.textContent = account.profile.displayName;
    } else {
        av.innerHTML = '<i class="fa-solid fa-user text-gray-300 text-sm"></i>';
        nm.textContent = 'Sign in';
    }
}

async function signOutNow() {
    try {
        if (fbAuth) await fbAuth.signOut();
        else {
            localStorage.removeItem(LOCAL_FLAG_KEY);
            account = { user: null, profile: null };
            afterAccountChange();
        }
    } catch (err) { console.warn(err); }
    closeOverlay('profile-modal');
    closeOverlay('lists-modal');
    showToast('Signed out');
}

function friendlyAuthError(err) {
    const map = {
        'auth/email-already-in-use': 'That email already has an account — try signing in instead.',
        'auth/invalid-email': 'That email address doesn\'t look right.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-credential': 'Wrong email or password.',
        'auth/wrong-password': 'Wrong email or password.',
        'auth/user-not-found': 'Wrong email or password.',
        'auth/too-many-requests': 'Too many attempts. Please wait a bit and try again.',
        'auth/network-request-failed': 'Network error — check your connection.',
        'auth/operation-not-allowed': 'This sign-in method isn\'t enabled in your Firebase console yet.',
        'auth/admin-restricted-operation': 'Guest sign-in isn\'t enabled in your Firebase console yet.',
        'auth/credential-already-in-use': 'That email is already linked to another account.',
        'auth/unauthorized-domain': 'This website\'s domain isn\'t authorized in Firebase yet — add it under Authentication → Settings → Authorized domains.',
        'auth/popup-blocked': 'Your browser blocked the Google pop-up. Allow pop-ups for this site and try again.',
        'auth/account-exists-with-different-credential': 'An account with that email already exists — sign in with your password instead.'
    };
    return map[err && err.code] || (err && err.message) || 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------
// Auth modal
// ---------------------------------------------------------------------
function openAuthModal(mode = 'signin', contextText = '') {
    setAuthMode(mode);
    const ctx = byId('auth-context');
    ctx.textContent = contextText;
    ctx.classList.toggle('hidden', !contextText);
    byId('auth-config-warning').classList.toggle('hidden', !!fbAuth);
    showAuthError('');
    openOverlay('auth-modal');
}

function closeAuthModal(cancelled = true) {
    if (cancelled) pendingAfterAuth = null;
    closeOverlay('auth-modal');
}

function setAuthMode(mode) {
    authMode = mode;
    document.querySelectorAll('#auth-tabs [data-mode]').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });
    byId('auth-username-wrap').classList.toggle('hidden', mode !== 'signup');
    byId('auth-submit').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    byId('auth-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    showAuthError('');
}

function showAuthError(msg) {
    const el = byId('auth-error');
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
}

function setAuthBusy(busy) {
    authBusy = busy;
    byId('auth-submit').disabled = busy;
    byId('auth-guest-btn').disabled = busy;
    byId('auth-google-btn').disabled = busy;
    byId('auth-submit').classList.toggle('opacity-60', busy);
}

async function submitAuth(e) {
    e.preventDefault();
    if (authBusy) return;
    const username = byId('auth-username').value.trim();
    const email = byId('auth-email').value.trim();
    const password = byId('auth-password').value;

    if (!fbAuth) {
        showAuthError('Firebase isn\'t set up yet — paste your config into app.js. You can still continue as a guest.');
        return;
    }
    if (authMode === 'signup' && (username.length < 2 || username.length > 24)) {
        showAuthError('Pick a username between 2 and 24 characters.');
        return;
    }
    if (!email || !password) {
        showAuthError('Please enter your email and password.');
        return;
    }

    setAuthBusy(true);
    showAuthError('');
    try {
        if (authMode === 'signup') await signUpWithEmail(username, email, password);
        else await fbAuth.signInWithEmailAndPassword(email, password);
        byId('auth-form').reset();
        closeAuthModal(false);
        showToast(authMode === 'signup' ? 'Welcome aboard! 🎉' : 'Welcome back!');
    } catch (err) {
        showAuthError(friendlyAuthError(err));
    } finally {
        setAuthBusy(false);
    }
}

async function signUpWithEmail(username, email, password) {
    const current = fbAuth.currentUser;

    // A guest upgrading to a real account keeps their lists.
    if (current && current.isAnonymous) {
        const cred = firebase.auth.EmailAuthProvider.credential(email, password);
        const res = await current.linkWithCredential(cred);
        await res.user.updateProfile({ displayName: username });
        account.user = { uid: res.user.uid, email: res.user.email || '', isGuest: false, local: false };
        if (!account.profile) account.profile = normalizeProfile(readCache(res.user.uid), username);
        account.profile.displayName = username;
        persistProfile(true);
        afterAccountChange();
        return;
    }

    pendingSignupName = username;
    try {
        const res = await fbAuth.createUserWithEmailAndPassword(email, password);
        await res.user.updateProfile({ displayName: username });
    } finally {
        pendingSignupName = null;
    }
}

async function continueAsGuest() {
    if (authBusy) return;
    setAuthBusy(true);
    showAuthError('');
    try {
        if (fbAuth) await fbAuth.signInAnonymously();
        else startLocalGuest();
        closeAuthModal(false);
        showToast('Signed in as guest');
    } catch (err) {
        showAuthError(friendlyAuthError(err));
    } finally {
        setAuthBusy(false);
    }
}

// ---------------------------------------------------------------------
// Google sign-in
// ---------------------------------------------------------------------
async function signInWithGoogle() {
    if (authBusy) return;
    if (!fbAuth) {
        showAuthError('Firebase isn\'t set up yet — paste your config into app.js to enable Google sign-in.');
        return;
    }
    if (location.protocol === 'file:') {
        showAuthError('Google sign-in needs the site to run over http(s). Open it from your GitHub Pages link or a local server (like VS Code Live Server), not by double-clicking the file.');
        return;
    }

    setAuthBusy(true);
    showAuthError('');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        const current = fbAuth.currentUser;
        if (current && current.isAnonymous) {
            // A guest signing in keeps their lists (the guest account is upgraded).
            try {
                const res = await current.linkWithPopup(provider);
                finishGoogleLink(res.user);
            } catch (err) {
                if (err.code === 'auth/credential-already-in-use' && err.credential) {
                    await fbAuth.signInWithCredential(err.credential);   // that Google account already exists: switch to it
                } else throw err;
            }
        } else {
            await fbAuth.signInWithPopup(provider);
        }
        closeAuthModal(false);
        showToast('Signed in with Google');
    } catch (err) {
        if (err.code === 'auth/popup-blocked') {
            try { await fbAuth.signInWithRedirect(provider); return; } catch (e) { /* fall through to message */ }
        }
        const quiet = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
        if (!quiet.includes(err.code)) showAuthError(friendlyAuthError(err));
    } finally {
        setAuthBusy(false);
    }
}

function finishGoogleLink(user) {
    account.user = { uid: user.uid, email: user.email || '', isGuest: false, local: false };
    if (!account.profile) account.profile = normalizeProfile(readCache(user.uid), user.displayName);
    if (/^Guest/i.test(account.profile.displayName) && user.displayName) {
        account.profile.displayName = user.displayName.slice(0, 24);
    }
    persistProfile(true);
    afterAccountChange();
}

function requireAccount(action, contextText) {
    if (account.user) { action(); return; }
    pendingAfterAuth = action;
    openAuthModal('signin', contextText || 'Sign in or continue as a guest to save shows and movies to your lists.');
}

// ---------------------------------------------------------------------
// Profile modal (display name + pixel avatar)
// ---------------------------------------------------------------------
function buildAvatarGrid() {
    byId('avatar-grid').innerHTML = Object.keys(AVATARS).map(key => `
        <button type="button" class="avatar-opt" data-avatar="${key}" title="${AVATARS[key].name}" aria-label="${AVATARS[key].name}">
            ${pixelAvatar(key)}
        </button>`).join('');
}

function selectAvatar(key) {
    selectedAvatar = key;
    byId('profile-avatar-preview').innerHTML = pixelAvatar(key);
    document.querySelectorAll('#avatar-grid .avatar-opt').forEach(b => {
        b.classList.toggle('is-selected', b.dataset.avatar === key);
    });
}

function openProfileModal() {
    if (!account.profile) return;
    byId('profile-name').value = account.profile.displayName;
    byId('profile-error').classList.add('hidden');
    byId('profile-email').textContent = account.user.isGuest ? 'Guest account' : account.user.email;
    byId('profile-guest-note').classList.toggle('hidden', !account.user.isGuest);
    selectAvatar(account.profile.avatar);
    openOverlay('profile-modal');
}

function saveProfile() {
    const name = byId('profile-name').value.trim();
    const err = byId('profile-error');
    if (name.length < 2 || name.length > 24) {
        err.textContent = 'Display name must be 2–24 characters.';
        err.classList.remove('hidden');
        return;
    }
    account.profile.displayName = name;
    account.profile.avatar = selectedAvatar;
    if (fbAuth && fbAuth.currentUser) fbAuth.currentUser.updateProfile({ displayName: name }).catch(() => {});
    persistProfile(true);
    renderNavAccount();
    closeOverlay('profile-modal');
    showToast('Profile saved');
}

// ---------------------------------------------------------------------
// Lists: data operations
// ---------------------------------------------------------------------
const getLists = () => (account.profile ? account.profile.lists : []);
const defaultListItems = () => {
    const l = getLists().find(x => x.id === DEFAULT_LIST_ID);
    return l ? l.items : [];
};
const getMedia = (id) => allMediaMap.get(String(id)) || listMediaCache.get(String(id)) || null;
const isSaved = (id) => getLists().some(l => l.items.some(i => String(i.id) === String(id)));

function mediaSnapshot(item) {
    return {
        id: String(item.id),
        title: item.title,
        type: item.type,
        poster: item.poster,
        banner: item.banner || item.poster,
        year: item.year,
        rating: item.rating,
        genre: item.genre || '',
        genres: item.genres || [],
        synopsis: String(item.synopsis || '').slice(0, 400),
        cast: item.cast || '',
        duration: item.duration || '',
        seasonsCount: item.seasonsCount || 1
    };
}

function listHas(list, id) { return list.items.some(i => String(i.id) === String(id)); }

function toggleInList(listId, mediaId) {
    const list = getLists().find(l => l.id === listId);
    const media = getMedia(mediaId);
    if (!list || !media) return;
    if (listHas(list, mediaId)) {
        list.items = list.items.filter(i => String(i.id) !== String(mediaId));
    } else {
        const snap = mediaSnapshot(media);
        list.items.unshift(snap);
        listMediaCache.set(snap.id, snap);
    }
    persistProfile();
    refreshListUI();
}

function removeFromList(listId, mediaId) {
    const list = getLists().find(l => l.id === listId);
    if (!list) return;
    list.items = list.items.filter(i => String(i.id) !== String(mediaId));
    persistProfile();
    refreshListUI();
}

function createList(rawName) {
    const name = rawName.trim().slice(0, 30);
    if (!name) { showToast('Give your list a name first'); return null; }
    if (getLists().some(l => l.name.toLowerCase() === name.toLowerCase())) {
        showToast('You already have a list with that name');
        return null;
    }
    const list = { id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, items: [] };
    account.profile.lists.push(list);
    persistProfile();
    return list;
}

function renameList(listId, rawName) {
    const name = rawName.trim().slice(0, 30);
    const list = getLists().find(l => l.id === listId);
    if (!list || !name) return false;
    if (getLists().some(l => l.id !== listId && l.name.toLowerCase() === name.toLowerCase())) {
        showToast('You already have a list with that name');
        return false;
    }
    list.name = name;
    persistProfile();
    return true;
}

function deleteList(listId) {
    if (listId === DEFAULT_LIST_ID) return;
    account.profile.lists = account.profile.lists.filter(l => l.id !== listId);
    persistProfile();
}

// ---------------------------------------------------------------------
// Lists: UI (add buttons everywhere, picker, My Lists page)
// ---------------------------------------------------------------------
function openListPicker(ev, mediaId) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    requireAccount(() => showListPicker(mediaId));
}

function showListPicker(mediaId) {
    const media = getMedia(mediaId);
    if (!media) return;
    pickerMediaId = String(mediaId);
    byId('picker-media-title').textContent = media.title;
    byId('new-list-name-input').value = '';
    renderPickerRows();
    openOverlay('list-picker-modal');
}

function renderPickerRows() {
    if (!pickerMediaId) return;
    byId('list-picker-rows').innerHTML = getLists().map(l => {
        const on = listHas(l, pickerMediaId);
        return `
            <button type="button" class="picker-row ${on ? 'is-on' : ''}" data-list="${l.id}">
                <i class="fa-solid ${on ? 'fa-square-check' : 'fa-square'}"></i>
                <span class="picker-name">${escapeHtml(l.name)}</span>
                <span class="picker-count">${l.items.length}</span>
            </button>`;
    }).join('');
}

function refreshListUI() {
    // + / check buttons on cards
    document.querySelectorAll('.list-add-btn').forEach(btn => {
        const saved = isSaved(btn.dataset.id);
        btn.classList.toggle('is-saved', saved);
        btn.title = saved ? 'Saved — manage lists' : 'Add to a list';
        btn.innerHTML = `<i class="fa-solid ${saved ? 'fa-check' : 'fa-plus'}"></i>`;
    });

    // hero button
    const heroBtn = byId('hero-list-btn');
    if (heroBtn && heroFeatId) {
        const saved = isSaved(heroFeatId);
        heroBtn.classList.toggle('is-saved', saved);
        heroBtn.innerHTML = `<i class="fa-solid ${saved ? 'fa-check' : 'fa-plus'}"></i>`;
    }

    updateModalListBtn();
    updateMyListRow();
    if (pickerMediaId) renderPickerRows();
    if (!byId('lists-modal').classList.contains('pointer-events-none')) renderListsPage();
}

function updateModalListBtn() {
    const btn = byId('modal-list-btn');
    if (!btn || !currentActiveItem) return;
    const saved = isSaved(currentActiveItem.id);
    byId('modal-list-btn-icon').className = `fa-solid ${saved ? 'fa-check' : 'fa-plus'}`;
    byId('modal-list-btn-text').textContent = saved ? 'Saved' : 'Add to List';
}

function updateMyListRow() {
    const container = byId('categories-container');
    if (!container) return;
    const existing = byId('my-list-row');
    const items = defaultListItems();
    if (!items.length) { if (existing) existing.remove(); return; }
    const fresh = buildRow('My List', items);
    fresh.id = 'my-list-row';
    if (existing) existing.replaceWith(fresh); else container.prepend(fresh);
    // new cards need their button state
    fresh.querySelectorAll('.list-add-btn').forEach(btn => {
        btn.classList.add('is-saved');
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    });
}

// ---- My Lists page ----
function openListsPage() {
    requireAccount(() => {
        renderListsPage();
        openOverlay('lists-modal');
    }, 'Sign in or continue as a guest to create lists.');
}

function renderListsPage() {
    const lists = getLists();
    if (!lists.length) return;
    if (!lists.some(l => l.id === activeListId)) activeListId = lists[0].id;
    const active = lists.find(l => l.id === activeListId);

    byId('lists-tabs').innerHTML = lists.map(l => `
        <button type="button" class="list-tab ${l.id === activeListId ? 'is-active' : ''}" data-list="${l.id}">
            ${escapeHtml(l.name)} <span>${l.items.length}</span>
        </button>`).join('') +
        `<button type="button" class="list-tab list-tab-new" id="lists-new-btn"><i class="fa-solid fa-plus"></i> New list</button>`;

    byId('lists-active-name').textContent = active.name;
    byId('lists-active-count').textContent = `${active.items.length} title${active.items.length === 1 ? '' : 's'}`;
    byId('lists-rename-btn').classList.toggle('hidden', active.id === DEFAULT_LIST_ID);
    byId('lists-delete-btn').classList.toggle('hidden', active.id === DEFAULT_LIST_ID);
    byId('lists-delete-btn').innerHTML = deleteArmed
        ? '<i class="fa-solid fa-triangle-exclamation"></i> Click again to delete'
        : '<i class="fa-solid fa-trash"></i> Delete list';

    byId('lists-name-form').classList.toggle('hidden', !listFormMode);

    byId('lists-grid').innerHTML = active.items.length ? active.items.map(item => `
        <div class="list-item group/li" data-open="${item.id}">
            <div class="relative aspect-[2/3] overflow-hidden rounded-md bg-gray-900">
                <img src="${item.poster}" alt="${escapeHtml(item.title)}" loading="lazy" class="w-full h-full object-cover transition duration-300 group-hover/li:scale-105" onerror="this.src='https://placehold.co/400x600/181818/ffffff?text=No+Image'">
                <button type="button" class="list-remove-btn" data-remove="${item.id}" title="Remove from this list"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="mt-2 text-sm font-semibold text-white truncate">${escapeHtml(item.title)}</p>
            <p class="text-xs text-gray-400">${item.year} · ${item.type === 'series' ? 'Series' : 'Movie'}</p>
        </div>`).join('') : `
        <div class="col-span-full py-20 text-center text-gray-400">
            <i class="fa-regular fa-bookmark text-4xl mb-4 text-gray-600"></i>
            <p class="text-lg font-semibold text-gray-300">This list is empty</p>
            <p class="text-sm mt-1">Tap the <i class="fa-solid fa-plus mx-1"></i> on any show or movie to add it here.</p>
        </div>`;
}

function closeListsPage() {
    listFormMode = null;
    deleteArmed = false;
    closeOverlay('lists-modal');
}

function openNameForm(mode) {
    listFormMode = mode;
    const input = byId('lists-name-input');
    const active = getLists().find(l => l.id === activeListId);
    input.value = mode === 'rename' && active ? active.name : '';
    byId('lists-name-submit').textContent = mode === 'rename' ? 'Rename' : 'Create';
    renderListsPage();
    input.focus();
}

function submitNameForm() {
    const value = byId('lists-name-input').value;
    if (listFormMode === 'create') {
        const list = createList(value);
        if (!list) return;
        activeListId = list.id;
    } else if (listFormMode === 'rename') {
        if (!renameList(activeListId, value)) return;
    }
    listFormMode = null;
    renderListsPage();
}

// ---------------------------------------------------------------------
// Wire everything up
// ---------------------------------------------------------------------
function wireAccountUI() {
    // navbar
    byId('profile-btn').addEventListener('click', () => {
        if (account.user) openProfileModal();
        else openAuthModal('signin');
    });
    byId('lists-nav-btn').addEventListener('click', openListsPage);

    // auth modal
    const authModal = byId('auth-modal');
    authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(true); });
    byId('auth-close-btn').addEventListener('click', () => closeAuthModal(true));
    byId('auth-form').addEventListener('submit', submitAuth);
    byId('auth-guest-btn').addEventListener('click', continueAsGuest);
    byId('auth-google-btn').addEventListener('click', signInWithGoogle);
    byId('auth-tabs').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-mode]');
        if (btn) setAuthMode(btn.dataset.mode);
    });

    // profile modal
    const profileModal = byId('profile-modal');
    profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeOverlay('profile-modal'); });
    byId('profile-close-btn').addEventListener('click', () => closeOverlay('profile-modal'));
    byId('avatar-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-avatar]');
        if (btn) selectAvatar(btn.dataset.avatar);
    });
    byId('profile-save-btn').addEventListener('click', saveProfile);
    byId('profile-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveProfile(); });
    byId('profile-signout-btn').addEventListener('click', signOutNow);
    byId('profile-upgrade-btn').addEventListener('click', () => {
        closeOverlay('profile-modal');
        openAuthModal('signup', 'Create an account to keep your lists and use them on any device.');
    });

    // list picker
    const picker = byId('list-picker-modal');
    const closePicker = () => { pickerMediaId = null; closeOverlay('list-picker-modal'); };
    picker.addEventListener('click', (e) => { if (e.target === picker) closePicker(); });
    byId('picker-close-btn').addEventListener('click', closePicker);
    byId('list-picker-rows').addEventListener('click', (e) => {
        const row = e.target.closest('[data-list]');
        if (row && pickerMediaId) toggleInList(row.dataset.list, pickerMediaId);
    });
    const createFromPicker = () => {
        const input = byId('new-list-name-input');
        const list = createList(input.value);
        if (!list) return;
        input.value = '';
        if (pickerMediaId) toggleInList(list.id, pickerMediaId);
        else refreshListUI();
        showToast(`Created “${list.name}”`);
    };
    byId('create-list-btn').addEventListener('click', createFromPicker);
    byId('new-list-name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') createFromPicker(); });

    // My Lists page
    byId('lists-close-btn').addEventListener('click', closeListsPage);
    byId('lists-tabs').addEventListener('click', (e) => {
        if (e.target.closest('#lists-new-btn')) { openNameForm('create'); return; }
        const tab = e.target.closest('[data-list]');
        if (tab) { activeListId = tab.dataset.list; listFormMode = null; deleteArmed = false; renderListsPage(); }
    });
    byId('lists-rename-btn').addEventListener('click', () => openNameForm('rename'));
    byId('lists-delete-btn').addEventListener('click', () => {
        if (!deleteArmed) {
            deleteArmed = true;
            renderListsPage();
            setTimeout(() => { if (deleteArmed) { deleteArmed = false; renderListsPage(); } }, 3000);
            return;
        }
        deleteList(activeListId);
        deleteArmed = false;
        activeListId = DEFAULT_LIST_ID;
        refreshListUI();
        renderListsPage();
        showToast('List deleted');
    });
    byId('lists-name-submit').addEventListener('click', submitNameForm);
    byId('lists-name-cancel').addEventListener('click', () => { listFormMode = null; renderListsPage(); });
    byId('lists-name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitNameForm(); });
    byId('lists-grid').addEventListener('click', (e) => {
        const rm = e.target.closest('[data-remove]');
        if (rm) { e.stopPropagation(); removeFromList(activeListId, rm.dataset.remove); return; }
        const card = e.target.closest('[data-open]');
        if (card) {
            const id = card.dataset.open;
            closeListsPage();
            openModal(id);
        }
    });

    // Escape closes the top-most account overlay
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const open = (id) => !byId(id).classList.contains('pointer-events-none');
        if (open('list-picker-modal')) { pickerMediaId = null; closeOverlay('list-picker-modal'); }
        else if (open('auth-modal')) closeAuthModal(true);
        else if (open('profile-modal')) closeOverlay('profile-modal');
        else if (open('lists-modal')) closeListsPage();
    });
}

// =====================================================================
// VIDEO SERVERS
// =====================================================================
const SERVER_KEY = 'nx_server_url';
const CUSTOM_SERVERS_KEY = 'nx_custom_servers';
let customServers = [];

// ---- Pop-up / redirect blocking ----
// A sandboxed iframe can't open new tabs/windows or navigate the page you're on
// (no allow-popups / allow-top-navigation), which is what ad-heavy servers abuse.
const BLOCK_POPUPS_KEY = 'nx_block_popups';
const SANDBOX_FLAGS = 'allow-scripts allow-same-origin allow-forms allow-presentation';
const popupsBlocked = () => localStorage.getItem(BLOCK_POPUPS_KEY) !== '0';

function applyIframeSandbox() {
    const frame = byId('video-iframe');
    if (!frame) return;
    if (popupsBlocked()) frame.setAttribute('sandbox', SANDBOX_FLAGS);
    else frame.removeAttribute('sandbox');
}

const movieUrl = (id) => `${CONFIG.domain}/movie/${id}`;

function normalizeServerUrl(raw) {
    let u = String(raw || '').trim();
    if (!u) return null;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try {
        const p = new URL(u);
        if (!p.hostname.includes('.') && p.hostname !== 'localhost') return null;
        return p.origin + p.pathname.replace(/\/+$/, '');
    } catch (e) { return null; }
}

const hostOf = (url) => { try { return new URL(url).host; } catch (e) { return url; } };

function getPresetServers() {
    return SERVER_PRESETS
        .map(s => ({ name: s.name || '', url: normalizeServerUrl(s.url), custom: false }))
        .filter(s => s.url)
        .map(s => ({ ...s, name: s.name || hostOf(s.url) }));
}

function getAllServers() {
    const seen = new Set();
    return [...getPresetServers(), ...customServers].filter(s => {
        if (seen.has(s.url)) return false;
        seen.add(s.url);
        return true;
    });
}

function defaultServerUrl() {
    const first = getPresetServers()[0];
    return first ? first.url : CONFIG.domain;
}

function saveCustomServers() {
    try { localStorage.setItem(CUSTOM_SERVERS_KEY, JSON.stringify(customServers)); } catch (e) {}
}

function initServers() {
    try {
        const stored = JSON.parse(localStorage.getItem(CUSTOM_SERVERS_KEY) || '[]');
        customServers = (Array.isArray(stored) ? stored : [])
            .map(s => ({ name: String(s.name || ''), url: normalizeServerUrl(s.url), custom: true }))
            .filter(s => s.url)
            .map(s => ({ ...s, name: s.name || hostOf(s.url) }));
    } catch (e) { customServers = []; }

    const saved = localStorage.getItem(SERVER_KEY);
    CONFIG.domain = saved && getAllServers().some(s => s.url === saved) ? saved : defaultServerUrl();

    const modal = byId('server-modal');
    byId('server-btn').addEventListener('click', openServerModal);
    byId('player-server-btn').addEventListener('click', openServerModal);
    byId('server-close-btn').addEventListener('click', closeServerModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeServerModal(); });

    byId('server-list').addEventListener('click', (e) => {
        const del = e.target.closest('[data-del]');
        if (del) { e.stopPropagation(); removeCustomServer(del.dataset.del); return; }
        const row = e.target.closest('[data-url]');
        if (row) setServer(row.dataset.url);
    });
    byId('server-add-btn').addEventListener('click', addCustomServer);
    byId('server-url-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomServer(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) closeServerModal();
    });

    const toggle = byId('block-popups-toggle');
    toggle.checked = popupsBlocked();
    toggle.addEventListener('change', () => {
        try { localStorage.setItem(BLOCK_POPUPS_KEY, toggle.checked ? '1' : '0'); } catch (e) {}
        applyIframeSandbox();
        reloadPlayerSource();   // sandbox changes only apply after a reload
        showToast(toggle.checked ? 'Pop-up blocking on' : 'Pop-up blocking off');
    });

    applyIframeSandbox();
    renderServerList();
}

function openServerModal() {
    byId('server-error').classList.add('hidden');
    renderServerList();
    openOverlay('server-modal');
}
function closeServerModal() { closeOverlay('server-modal'); }

function renderServerList() {
    const list = byId('server-list');
    if (!list) return;
    list.innerHTML = getAllServers().map(s => {
        const on = s.url === CONFIG.domain;
        return `
            <div class="picker-row server-row ${on ? 'is-on' : ''}" data-url="${escapeHtml(s.url)}" role="button" tabindex="0">
                <i class="fa-solid ${on ? 'fa-circle-dot' : 'fa-circle'} server-radio"></i>
                <span class="picker-name">${escapeHtml(s.name)}<small class="server-host">${escapeHtml(hostOf(s.url))}</small></span>
                ${s.custom ? `<button type="button" class="server-del" data-del="${escapeHtml(s.url)}" title="Remove server"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>`;
    }).join('');
}

function setServer(url, silent = false) {
    CONFIG.domain = url;
    try { localStorage.setItem(SERVER_KEY, url); } catch (e) {}
    renderServerList();
    reloadPlayerSource();
    if (!silent) {
        const s = getAllServers().find(x => x.url === url);
        showToast(`Server: ${s ? s.name : hostOf(url)}`);
    }
}

// If something is already playing, reload it from the newly chosen server.
function reloadPlayerSource() {
    if (!player.open) return;
    if (player.isSeries) setPlayerSource(episodeUrl(player.tvId, player.season, player.episode));
    else if (player.item) setPlayerSource(movieUrl(player.item.id));
}

function addCustomServer() {
    const err = byId('server-error');
    const url = normalizeServerUrl(byId('server-url-input').value);
    if (!url) {
        err.textContent = 'Enter a valid domain, e.g. https://your-domain.com';
        err.classList.remove('hidden');
        return;
    }
    if (getAllServers().some(s => s.url === url)) {
        err.textContent = 'That server is already in your list.';
        err.classList.remove('hidden');
        return;
    }
    const name = byId('server-name-input').value.trim() || hostOf(url);
    customServers.push({ name, url, custom: true });
    saveCustomServers();
    byId('server-name-input').value = '';
    byId('server-url-input').value = '';
    err.classList.add('hidden');
    setServer(url);   // use it right away
}

function removeCustomServer(url) {
    customServers = customServers.filter(s => s.url !== url);
    saveCustomServers();
    if (CONFIG.domain === url) setServer(defaultServerUrl(), true);
    else renderServerList();
}
