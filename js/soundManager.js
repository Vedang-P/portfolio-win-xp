const SoundManager = {
    enabled: true,
    unlocked: false,
    storageKey: 'xp-sound-enabled',
    volumeStorageKey: 'xp-sound-volume',
    defaultVolume: 0.85,
    masterVolume: 1,

    files: {
        click: 'assets/sounds/Windows XP Menu Command.wav',
        open: 'assets/sounds/Windows XP Start.wav',
        minimize: 'assets/sounds/Windows XP Minimize.wav',
        restore: 'assets/sounds/Windows XP Restore.wav',
        close: 'assets/sounds/Windows XP Default.wav',
        startup: 'assets/sounds/Windows XP Startup.wav',
        login: 'assets/sounds/Windows XP Logon Sound.wav',
        logoff: 'assets/sounds/Windows XP Logoff Sound.wav',
        shutdown: 'assets/sounds/Windows XP Shutdown.wav',
        stop: 'assets/sounds/Windows XP Critical Stop.wav',
        error: 'assets/sounds/Windows XP Error.wav',
        notify: 'assets/sounds/Windows XP Notify.wav',
        recycle: 'assets/sounds/Windows XP Recycle.wav'
    },
    volumes: {
        startup: 0.2125
    },

    init() {
        const stored = localStorage.getItem(this.storageKey);
        this.enabled = stored !== '0';
        const storedVolume = Number.parseFloat(localStorage.getItem(this.volumeStorageKey));
        if (Number.isFinite(storedVolume)) {
            this.masterVolume = Math.max(0, Math.min(1, storedVolume));
        }

        Object.values(this.files).forEach(path => {
            const audio = new Audio(path);
            audio.preload = 'auto';
        });

        const unlock = () => {
            this.unlocked = true;
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
        };

        document.addEventListener('pointerdown', unlock);
        document.addEventListener('keydown', unlock);

        this.updateTrayIcon();
    },

    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        localStorage.setItem(this.storageKey, this.enabled ? '1' : '0');
        this.updateTrayIcon();

        document.dispatchEvent(new CustomEvent('xp:sound-change', {
            detail: { enabled: this.enabled, volume: this.masterVolume }
        }));
    },

    setMasterVolume(volume) {
        const nextVolume = Math.max(0, Math.min(1, Number(volume)));
        this.masterVolume = Number.isFinite(nextVolume) ? nextVolume : this.masterVolume;
        localStorage.setItem(this.volumeStorageKey, String(this.masterVolume));
        this.updateTrayIcon();

        document.dispatchEvent(new CustomEvent('xp:sound-change', {
            detail: { enabled: this.enabled, volume: this.masterVolume }
        }));
    },

    getMasterVolume() {
        return this.masterVolume;
    },

    toggle() {
        const enabled = !this.enabled;
        this.setEnabled(enabled);
        if (enabled) {
            this.play('click');
        }
    },

    isEnabled() {
        return this.enabled;
    },

    play(name) {
        if (!this.enabled || !this.unlocked) return;

        const file = this.files[name] || this.files.click;
        const audio = new Audio(file);
        const baseVolume = this.volumes[name] ?? this.defaultVolume;
        audio.volume = Math.max(0, Math.min(1, baseVolume * this.masterVolume));

        audio.play().catch(() => {
            /* Autoplay/user-gesture restrictions can still fail intermittently. */
        });
    },

    updateTrayIcon() {
        const trayIcon = document.querySelector('[data-tray="sound"]');
        if (!trayIcon) return;

        trayIcon.classList.toggle('muted', !this.enabled);
        const percent = Math.round(this.masterVolume * 100);
        trayIcon.title = this.enabled ? `Volume (On) ${percent}%` : `Volume (Muted) ${percent}%`;
    }
};
