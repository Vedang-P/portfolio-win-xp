const SessionManager = {
    initialized: false,
    loggedIn: false,
    hasLoggedInOnce: false,
    selectedLoginUser: '',

    init() {
        this.cacheElements();
        Personalization.init();
        SoundManager.init();
        this.hideShell();
        this.bindLogin();

        BootScreen.init(() => {
            this.showLogin();
        });
    },

    cacheElements() {
        this.desktop = document.getElementById('desktop');
        this.taskbar = document.getElementById('taskbar');
        this.startMenu = document.getElementById('start-menu');
        this.loginScreen = document.getElementById('login-screen');
        this.loginName = document.getElementById('login-user-name');
        this.loginTiles = this.loginScreen ? Array.from(this.loginScreen.querySelectorAll('.login-tile')) : [];
        this.loginButton = document.getElementById('login-btn');
        this.shutdownScreen = document.getElementById('shutdown-screen');
        this.shutdownProgressFill = document.getElementById('shutdown-progress-fill');
        this.restartBtn = document.getElementById('restart-btn');
    },

    bindLogin() {
        const profileName = AppsRegistry.getProfileName();
        this.selectedLoginUser = profileName;

        if (this.loginName) {
            this.loginName.textContent = profileName;
        }

        if (this.loginTiles.length) {
            this.loginTiles.forEach((tile, index) => {
                const userName = tile.dataset.user || (index === 0 ? profileName : `User ${index + 1}`);
                tile.dataset.user = userName;

                tile.addEventListener('click', () => {
                    this.setActiveLoginUser(userName);
                });

                tile.addEventListener('dblclick', () => {
                    this.setActiveLoginUser(userName);
                    this.login();
                });
            });

            this.setActiveLoginUser(profileName);
        }

        if (this.loginButton) {
            this.loginButton.addEventListener('click', () => this.login());
        }

        document.addEventListener('keydown', (event) => {
            if (!this.loginScreen || !this.loginScreen.classList.contains('visible')) return;
            if (event.key === 'Enter') {
                this.login();
            }
        });
    },

    setActiveLoginUser(userName) {
        this.selectedLoginUser = userName || AppsRegistry.getProfileName();
        this.loginTiles.forEach(tile => {
            tile.classList.toggle('active', tile.dataset.user === this.selectedLoginUser);
        });
    },

    updateStartMenuUserLabel() {
        const userName = document.querySelector('.user-name');
        if (!userName) return;

        userName.textContent = this.selectedLoginUser || AppsRegistry.getProfileName();
    },

    showLogin() {
        if (!this.loginScreen) return;
        this.loginScreen.classList.remove('hidden');
        this.loginScreen.classList.add('visible');
    },

    hideLogin() {
        if (!this.loginScreen) return;
        this.loginScreen.classList.remove('visible');
        this.loginScreen.classList.add('hidden');
    },

    showShell() {
        this.desktop.classList.remove('session-hidden');
        this.taskbar.classList.remove('session-hidden');
        if (WindowManager && typeof WindowManager.resetIconsToDefaultPositions === 'function') {
            setTimeout(() => WindowManager.resetIconsToDefaultPositions(), 0);
        } else if (WindowManager && typeof WindowManager.clampAllIconsToDesktop === 'function') {
            setTimeout(() => WindowManager.clampAllIconsToDesktop(), 0);
        }
    },

    hideShell() {
        this.desktop.classList.add('session-hidden');
        this.taskbar.classList.add('session-hidden');
        this.startMenu.classList.remove('visible');
        Clock.hidePopup();
    },

    login() {
        if (this.loggedIn) return;

        if (!this.initialized) {
            WindowManager.init();
            Taskbar.init();
            Clock.init();
            ContextMenu.init();
            this.initialized = true;
        }

        this.updateStartMenuUserLabel();
        this.hideLogin();
        this.showShell();
        this.loggedIn = true;
        if (this.hasLoggedInOnce) {
            SoundManager.play('login');
        } else {
            SoundManager.play('startup');
            this.hasLoggedInOnce = true;
        }
    },

    logOff() {
        if (!this.loggedIn) return;
        ContextMenu.close();
        WindowManager.closeAll();
        this.hideShell();
        this.showLogin();
        this.loggedIn = false;
        SoundManager.play('logoff');
    },

    shutdown() {
        ContextMenu.close();
        WindowManager.closeAll();
        this.hideShell();
        this.hideLogin();
        this.loggedIn = false;

        this.shutdownScreen.classList.remove('power-stage');
        this.shutdownScreen.classList.add('visible');
        if (this.shutdownProgressFill) {
            this.shutdownProgressFill.style.transition = 'none';
            this.shutdownProgressFill.style.width = '0%';
            // Force style flush so transition restarts every shutdown cycle.
            void this.shutdownProgressFill.offsetWidth;
            this.shutdownProgressFill.style.transition = 'width 1.8s linear';
        }

        setTimeout(() => {
            SoundManager.play('shutdown');
        }, 120);

        setTimeout(() => {
            if (this.shutdownProgressFill) {
                this.shutdownProgressFill.style.width = '100%';
            }
        }, 80);

        setTimeout(() => {
            this.shutdownScreen.classList.add('power-stage');
        }, 2050);

        this.restartBtn.onclick = () => this.powerOn();
    },

    powerOn() {
        this.shutdownScreen.classList.remove('visible');
        this.shutdownScreen.classList.remove('power-stage');

        if (this.shutdownProgressFill) {
            this.shutdownProgressFill.style.transition = 'none';
            this.shutdownProgressFill.style.width = '0%';
        }

        BootScreen.init(() => {
            this.showLogin();
        });
    }
};
