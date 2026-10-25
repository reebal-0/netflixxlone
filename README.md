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

### Use your own TMDb API key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/) and request an API key.
2. Open **API Config** in the app, enter your TMDb API v3 key, and select **Save Key**.
3. Select **Save Key** to keep it in this browser across reloads. The field is masked when you reopen API Config; select **Clear Key** to remove it.

To use the built-in public demo key instead, enter `netflix` in API Config and select **Save Key**, or type it into the search box. Both shortcuts save the demo key in this browser and load live TMDb data.

## 🔐 Security notes

- The `netflix` shortcut activates a shared public demo key embedded in the frontend. Anyone can inspect or reuse it, and it may be revoked or rate-limited. It is not a private credential.
- Keys entered in API Config are masked and saved in this browser's local storage so they survive reloads. Since this is a static browser app, saved keys can be read by browser scripts and developer tools and are sent to TMDb. Use a server-side proxy for production; do not save a private key in frontend code.
- Firebase web configuration values are public identifiers, not private credentials. Protect the Firebase project with restrictive Firestore rules, authorized domains, API-key restrictions, and App Check before enabling public access. Never put service-account credentials in this repository.
- Previously published TMDb keys should be revoked in TMDb and replaced, since deleting a key from the current source does not remove it from old commits or published copies.

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
