/**
 * Netflix IMDb Explorer - Application Logic
 */

// --- CONFIGURATION ---
const CONFIG = {
    domain: 'https://vidrock.to', // Replace with your domain when ready
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

let currentPlayback = {
    tvId: null,
    seasonNum: 1,
    episodeNum: 1,
    title: '',
    maxEpisodesInSeason: 1
};

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
                <div onclick="playEpisode('${tvId}', '${seasonNum}', '${ep.episode_number}', '${ep.name || 'Untitled'}')" class="flex items-center justify-between p-3 bg-black/40 hover:bg-black/70 rounded-lg text-sm text-gray-300 border border-gray-800 transition cursor-pointer group">
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

function playEpisode(tvId, seasonNum, episodeNum, epTitle) {
    closeModal();
    const embedUrl = `${CONFIG.domain}/tv/${tvId}/${seasonNum}/${episodeNum}`;
    const displayTitle = currentActiveItem ? `${currentActiveItem.title} - S${seasonNum}E${episodeNum}: ${epTitle}` : `TV Show S${seasonNum}E${episodeNum}`;
    openVideoPlayer(embedUrl, displayTitle, currentActiveItem, seasonNum, Number(episodeNum));
}

function initVideoPlayerModal() {
    const modal = document.getElementById('video-player-modal');
    const closeBtn = document.getElementById('player-close-btn');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const sidebar = document.getElementById('player-sidebar');

    closeBtn.addEventListener('click', closeVideoPlayer);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeVideoPlayer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeVideoPlayer(); });

    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('md:w-0');
        sidebar.classList.toggle('md:opacity-0');
        collapseBtn.querySelector('i').classList.toggle('fa-chevron-left');
        collapseBtn.querySelector('i').classList.toggle('fa-chevron-right');
    });

    const playerSeasonSelect = document.getElementById('player-season-select');
    playerSeasonSelect.addEventListener('change', (e) => {
        if (currentActiveItem && currentActiveItem.type === 'series') {
            loadPlayerSidebarEpisodes(currentActiveItem.id, e.target.value);
        }
    });
}

async function openVideoPlayer(url, titleText, item, activeSeason = 1, activeEpisode = 1) {
    const modal = document.getElementById('video-player-modal');
    const iframe = document.getElementById('video-iframe');
    const titleEl = document.getElementById('player-title');
    const sidebar = document.getElementById('player-sidebar');

    currentPlayback = {
        tvId: item ? item.id : null,
        seasonNum: Number(activeSeason),
        episodeNum: Number(activeEpisode),
        title: item ? item.title : 'Show',
        maxEpisodesInSeason: 20
    };

    if (item && item.type === 'series' && !String(item.id).startsWith('f')) {
        try {
            const res = await fetch(`${CONFIG.tmdbBaseUrl}/tv/${item.id}/season/${activeSeason}?api_key=${userApiKey}`);
            const data = await res.json();
            if (data.episodes) {
                currentPlayback.maxEpisodesInSeason = data.episodes.length;
            }
        } catch (e) {}
    }

    titleEl.innerHTML = `
        <div class="flex items-center space-x-3">
            <span class="truncate max-w-[180px] sm:max-w-xs md:max-w-md">${titleText}</span>
            ${item && item.type === 'series' ? `
                <div class="flex items-center space-x-1.5 flex-shrink-0">
                    <button onclick="playPrevEpisode()" class="bg-gray-800 hover:bg-netflixRed text-white text-xs px-2 py-1 rounded transition flex items-center space-x-1 cursor-pointer">
                        <i class="fa-solid fa-backward-step text-[10px]"></i>
                        <span class="hidden sm:inline">Prev</span>
                    </button>
                    <button onclick="playNextEpisode()" class="bg-gray-800 hover:bg-netflixRed text-white text-xs px-2 py-1 rounded transition flex items-center space-x-1 cursor-pointer">
                        <span class="hidden sm:inline">Next</span>
                        <i class="fa-solid fa-forward-step text-[10px]"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    iframe.src = url;

    if (item && item.type === 'series') {
        sidebar.style.display = 'flex';
        setupPlayerSeasonsDropdown(item.id, item.seasonsCount || 1, activeSeason);
    } else {
        sidebar.style.display = 'none';
    }

    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
}

function playPrevEpisode() {
    if (currentPlayback.episodeNum > 1) {
        currentPlayback.episodeNum -= 1;
        updatePlayerState();
    } else if (currentPlayback.seasonNum > 1) {
        currentPlayback.seasonNum -= 1;
        currentPlayback.episodeNum = 1;
        updatePlayerState();
    }
}

function playNextEpisode() {
    if (currentPlayback.episodeNum < currentPlayback.maxEpisodesInSeason) {
        currentPlayback.episodeNum += 1;
        updatePlayerState();
    } else if (currentActiveItem && currentPlayback.seasonNum < (currentActiveItem.seasonsCount || 1)) {
        currentPlayback.seasonNum += 1;
        currentPlayback.episodeNum = 1;
        updatePlayerState();
    }
}

async function updatePlayerState() {
    const { tvId, seasonNum, episodeNum, title } = currentPlayback;
    const newUrl = `${CONFIG.domain}/tv/${tvId}/${seasonNum}/${episodeNum}`;
    
    let epName = `Episode ${episodeNum}`;
    if (!String(tvId).startsWith('f')) {
        try {
            const res = await fetch(`${CONFIG.tmdbBaseUrl}/tv/${tvId}/season/${seasonNum}?api_key=${userApiKey}`);
            const data = await res.json();
            if (data.episodes) {
                currentPlayback.maxEpisodesInSeason = data.episodes.length;
                const found = data.episodes.find(e => e.episode_number === episodeNum);
                if (found && found.name) epName = found.name;
            }
        } catch(e) {}
    }

    const displayTitle = `${title} - S${seasonNum}E${episodeNum}: ${epName}`;
    
    document.getElementById('video-iframe').src = newUrl;
    
    document.getElementById('player-title').innerHTML = `
        <div class="flex items-center space-x-3">
            <span class="truncate max-w-[180px] sm:max-w-xs md:max-w-md">${displayTitle}</span>
            <div class="flex items-center space-x-1.5 flex-shrink-0">
                <button onclick="playPrevEpisode()" class="bg-gray-800 hover:bg-netflixRed text-white text-xs px-2 py-1 rounded transition flex items-center space-x-1 cursor-pointer">
                    <i class="fa-solid fa-backward-step text-[10px]"></i>
                    <span class="hidden sm:inline">Prev</span>
                </button>
                <button onclick="playNextEpisode()" class="bg-gray-800 hover:bg-netflixRed text-white text-xs px-2 py-1 rounded transition flex items-center space-x-1 cursor-pointer">
                    <span class="hidden sm:inline">Next</span>
                    <i class="fa-solid fa-forward-step text-[10px]"></i>
                </button>
            </div>
        </div>
    `;

    const playerSeasonSelect = document.getElementById('player-season-select');
    if (playerSeasonSelect) playerSeasonSelect.value = seasonNum;
    loadPlayerSidebarEpisodes(tvId, seasonNum);
}

function setupPlayerSeasonsDropdown(tvId, count, activeSeason) {
    const select = document.getElementById('player-season-select');
    select.innerHTML = '';
    for (let s = 1; s <= count; s++) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `Season ${s}`;
        if (s == activeSeason) opt.selected = true;
        select.appendChild(opt);
    }
    loadPlayerSidebarEpisodes(tvId, activeSeason);
}

async function loadPlayerSidebarEpisodes(tvId, seasonNum) {
    const listEl = document.getElementById('player-sidebar-episodes-list');
    listEl.innerHTML = `<div class="text-white/70 text-center py-2">Loading...</div>`;

    if (String(tvId).startsWith('f')) {
        listEl.innerHTML = `
            <div onclick="playEpisode('${tvId}', '${seasonNum}', '1', 'Pilot')" class="p-2 bg-black/20 hover:bg-black/40 rounded cursor-pointer transition text-white">
                <p class="font-bold">Ep 1: Pilot</p>
            </div>
            <div onclick="playEpisode('${tvId}', '${seasonNum}', '2', 'Next Steps')" class="p-2 bg-black/20 hover:bg-black/40 rounded cursor-pointer transition text-white">
                <p class="font-bold">Ep 2: Next Steps</p>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch(`${CONFIG.tmdbBaseUrl}/tv/${tvId}/season/${seasonNum}?api_key=${userApiKey}`);
        const data = await res.json();
        
        if (data.episodes) {
            listEl.innerHTML = data.episodes.map(ep => `
                <div onclick="playEpisode('${tvId}', '${seasonNum}', '${ep.episode_number}', '${ep.name || 'Untitled'}')" class="p-2 ${ep.episode_number === currentPlayback.episodeNum && seasonNum === currentPlayback.seasonNum ? 'bg-black/60 border border-white/20' : 'bg-black/20'} hover:bg-black/40 rounded cursor-pointer transition text-white space-y-0.5">
                    <p class="font-bold text-xs truncate">${ep.episode_number}. ${ep.name || 'Episode'}</p>
                    <p class="text-[10px] text-white/70">${ep.runtime ? ep.runtime + 'm' : '40m'}</p>
                </div>
            `).join('');
        }
    } catch(err) {
        listEl.innerHTML = `<div class="text-white/70 text-center py-2">Failed to load</div>`;
    }
}

function closeVideoPlayer() {
    const modal = document.getElementById('video-player-modal');
    const iframe = document.getElementById('video-iframe');

    modal.classList.add('opacity-0', 'pointer-events-none');
    iframe.src = '';
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