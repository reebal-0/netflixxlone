/**
 * Netflix IMDb Explorer - Application Logic
 */

// --- CONFIGURATION ---
const CONFIG = {
    domain: 'https://player.vidzee.wtf/embed', // Replace with your domain when ready
    publicDemoKey: '2993855ff9655e88d076d338f71295fc',
    tmdbBaseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/original',
    posterBaseUrl: 'https://image.tmdb.org/t/p/w500'
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

    document.getElementById('hero-info-btn').onclick = () => openModal(feat.id);
    document.getElementById('hero-play-btn').onclick = () => {
        trackRecentlyBrowsed(feat);
        if (feat.type === 'series') {
            openModal(feat.id);
        } else {
            openVideoPlayer(`${CONFIG.domain}/movie/${feat.id}`, `${feat.title} (Movie)`, feat);
        }
    };
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    Object.keys(catalog).forEach(cat => {
        const items = catalog[cat];
        if (!items || items.length === 0) return;

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
                    ${items.map(item => `
                        <div onclick="openModal('${item.id}')" class="movie-card flex-shrink-0 w-44 md:w-56 bg-[#1f1f1f] rounded-md overflow-hidden cursor-pointer shadow-md group/card">
                            <div class="relative h-64 md:h-80 w-full overflow-hidden bg-gray-900">
                                <img src="${item.poster}" alt="${item.title}" class="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" loading="lazy" onerror="this.src='https://placehold.co/400x600/181818/ffffff?text=No+Image'">
                                <div class="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-yellow-400 border border-yellow-500/30 flex items-center shadow">
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
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(rowDiv);
    });
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
    let item = allMediaMap.get(id);
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
            openVideoPlayer(`${CONFIG.domain}/movie/${item.id}`, `${item.title} (Movie)`, item);
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
        if (e.key === 'Escape') { closeVideoPlayer(); return; }
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
