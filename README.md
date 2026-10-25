<div align="center">

# 🎬 NetflixxClone

**A Netflix-inspired streaming catalog built with HTML, CSS, and vanilla JavaScript.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-E50914?style=for-the-badge&logo=github)](https://reebal-0.github.io/netflixxlone/)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TMDb](https://img.shields.io/badge/Data-TMDb-01B4E4?style=for-the-badge)

<img src="assets/home.png" alt="NetflixxClone homepage with live TMDb catalog" width="900">

</div>

---

## ✨ Features

- Featured title, trending and top 10 shelves, and movie and TV categories
- Live TMDb catalog, multi-title search, title details, cast, genres, and episode guides
- Full-screen episode player with season picker, episode drawer, navigation controls, and server selection
- Continue watching and recently browsed shelves saved in the browser
- Guest profile, profile avatar choices, sign-in and sign-up screens, and custom lists
- Built-in TMDb fallback data and optional personal API key

## 📸 Screenshots

The full homepage is available in [full-site.png](assets/full-site.png). Focused screenshots cover each main view:

| View | Screenshot |
| --- | --- |
| Homepage | ![Homepage](assets/home.png) |
| Movies and TV browse | ![Browse](assets/browse.png) |
| Live search results | ![Search](assets/search.png) |
| Movie details | ![Movie details](assets/details.png) |
| TV details and seasons | ![TV details](assets/details-series.png) |
| Episode player | ![Player](assets/player.png) |
| Episode list | ![Episodes](assets/episodes.png) |
| Video server settings | ![Video servers](assets/video-servers.png) |
| TMDb API configuration | ![API configuration](assets/api-config.png) |
| Sign in and sign up | ![Authentication](assets/sign-in.png) |
| Guest profile | ![Profile](assets/profile.png) |
| Save to list | ![List picker](assets/list-picker.png) |
| My Lists | ![My Lists](assets/my-lists.png) |

## 🚀 Run locally

No build step is required. Clone the repository and open `index.html` in a browser, or use VS Code Live Server:

```bash
git clone https://github.com/reebal-0/netflixxlone.git
cd netflixxlone
```

### Activate the built-in TMDb demo key

Enter `netflix` in the app's search field. The shortcut activates the demo TMDb key and reloads the live catalog. A successful fetch requires an internet connection.

### Use your own TMDb API key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/) and request an API key.
2. Open **API Config** in the app, enter your TMDb API v3 key, and select **Save Key**.
3. The key is stored in your browser's `localStorage`.

## 🗂️ Project structure

```text
netflixxlone/
├── index.html          # Page structure and dialogs
├── style.css           # Layout, cards, and player styling
├── app.js              # Catalog, search, lists, profiles, and player behavior
└── assets/             # App icons and README screenshots
```

## ⚠️ Disclaimer

This is a learning project and is not affiliated with, endorsed by, or connected to Netflix. Movie and TV metadata and artwork come from [TMDb](https://www.themoviedb.org/); this product uses the TMDb API but is not endorsed or certified by TMDb. This repository does not host video content.

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">
Made by <a href="https://github.com/reebal-0">reebal-0</a> · If you like it, drop a ⭐
</div>
