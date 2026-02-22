const Personalization = {
    themeKey: 'xp-theme',
    wallpaperKey: 'xp-wallpaper',
    theme: 'luna-blue',
    wallpaper: 'assets/wallpapers/background_win_xp.jpg',

    themes: ['luna-blue'],

    wallpapers: {
        bliss: 'assets/wallpapers/background_win_xp.jpg',
        redbull: 'assets/wallpapers/redbull_car.jpg',
        redcar: 'assets/wallpapers/red_car.jpg',
        verstappen: 'assets/wallpapers/verstappen.webp'
    },

    wallpaperOptions: [
        { key: 'bliss', label: 'Bliss' },
        { key: 'redbull', label: 'Redbull' },
        { key: 'redcar', label: 'Redbull 2' },
        { key: 'verstappen', label: 'Mv33' }
    ],

    init() {
        const storedTheme = localStorage.getItem(this.themeKey);
        const storedWallpaper = localStorage.getItem(this.wallpaperKey);

        if (storedTheme && this.themes.includes(storedTheme)) {
            this.theme = storedTheme;
        }

        if (storedWallpaper && this.getWallpaperOptions().some(option => option.value === storedWallpaper)) {
            this.wallpaper = storedWallpaper;
        }

        this.applyTheme(this.theme, false);
        this.applyWallpaper(this.wallpaper, false);
    },

    getTheme() {
        return this.theme;
    },

    getWallpaper() {
        return this.wallpaper;
    },

    getWallpaperOptions() {
        return this.wallpaperOptions.map(option => ({
            ...option,
            value: this.wallpapers[option.key]
        }));
    },

    getWallpaperByKey(key) {
        return this.wallpapers[key] || null;
    },

    applyTheme(themeName, persist = true) {
        const normalized = this.themes.includes(themeName) ? themeName : 'luna-blue';
        this.theme = normalized;
        document.body.dataset.xpTheme = normalized;

        if (persist) {
            localStorage.setItem(this.themeKey, normalized);
        }

        document.dispatchEvent(new CustomEvent('xp:theme-change', {
            detail: { theme: normalized }
        }));
    },

    applyWallpaper(wallpaperValue, persist = true) {
        const desktop = document.getElementById('desktop');
        if (!desktop || !wallpaperValue) return;

        this.wallpaper = wallpaperValue;

        if (wallpaperValue.startsWith('linear-gradient')) {
            desktop.style.background = wallpaperValue;
            desktop.style.backgroundSize = 'cover';
            desktop.style.backgroundPosition = 'center center';
            desktop.style.backgroundRepeat = 'no-repeat';
        } else {
            desktop.style.background = `url('${wallpaperValue}') no-repeat center center`;
            desktop.style.backgroundSize = 'cover';
        }

        if (persist) {
            localStorage.setItem(this.wallpaperKey, wallpaperValue);
        }

        document.dispatchEvent(new CustomEvent('xp:wallpaper-change', {
            detail: { wallpaper: wallpaperValue }
        }));
    }
};
