const ContextMenu = {
    init() {
        this.desktop = document.getElementById('desktop');
        this.menu = document.getElementById('desktop-context-menu');
        if (!this.desktop || !this.menu) return;

        this.desktop.addEventListener('contextmenu', (event) => {
            if (!SessionManager.loggedIn) return;
            event.preventDefault();
            WindowManager.clearIconSelection();
            this.open(event.clientX, event.clientY);
        });

        this.menu.addEventListener('click', (event) => {
            event.stopPropagation();

            const disabledItem = event.target.closest('.context-item.disabled');
            if (disabledItem) {
                SoundManager.play('error');
                return;
            }

            const actionItem = event.target.closest('[data-action]');
            if (!actionItem) return;

            this.handleAction(actionItem.dataset.action);
            this.close();
        });

        document.addEventListener('click', (event) => {
            if (!this.menu.contains(event.target)) {
                this.close();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.close();
        });
    },

    open(x, y) {
        Taskbar.closeStartMenu();
        Clock.hidePopup();

        this.menu.classList.add('visible');

        const rect = this.menu.getBoundingClientRect();
        const submenu = this.menu.querySelector('.context-submenu');
        const submenuWidth = submenu ? 324 : 0;
        const submenuHeight = submenu ? 278 : rect.height;
        const totalHeight = Math.max(rect.height, submenuHeight);
        const maxX = window.innerWidth - rect.width - submenuWidth - 8;
        const maxY = window.innerHeight - totalHeight - 8;

        this.menu.style.left = `${Math.max(8, Math.min(x, maxX))}px`;
        this.menu.style.top = `${Math.max(8, Math.min(y, maxY))}px`;
    },

    close() {
        this.menu.classList.remove('visible');
    },

    handleAction(action) {
        if (action === 'refresh') {
            SoundManager.play('click');
            const icons = document.getElementById('desktop-icons');
            icons.classList.remove('desktop-refresh');
            void icons.offsetWidth;
            icons.classList.add('desktop-refresh');
        } else if (action === 'personalize') {
            SoundManager.play('click');
            WindowManager.open('control');
        } else if (
            action === 'new-folder' ||
            action === 'new-shortcut' ||
            action === 'new-briefcase' ||
            action === 'new-bitmap' ||
            action === 'new-text' ||
            action === 'new-wave' ||
            action === 'new-zip'
        ) {
            SoundManager.play('error');
        } else {
            SoundManager.play('stop');
        }
    }
};
