const SoundManager = {
    enabled: true,
    unlocked: false,
    storageKey: 'xp-sound-enabled',
    defaultVolume: 0.85,

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
        notify: 'assets/sounds/Windows XP Notify.wav'
    },
    volumes: {
        startup: 0.2125
    },

    init() {
        const stored = localStorage.getItem(this.storageKey);
        this.enabled = stored !== '0';

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
            detail: { enabled: this.enabled }
        }));
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
        audio.volume = this.volumes[name] ?? this.defaultVolume;

        audio.play().catch(() => {
            /* Autoplay/user-gesture restrictions can still fail intermittently. */
        });
    },

    updateTrayIcon() {
        const trayIcon = document.querySelector('[data-tray="sound"]');
        if (!trayIcon) return;

        trayIcon.classList.toggle('muted', !this.enabled);
        trayIcon.title = this.enabled ? 'Volume (On)' : 'Volume (Muted)';
    }
};
