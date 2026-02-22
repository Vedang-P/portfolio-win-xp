const WindowManager = {
    windows: {},
    activeId: null,
    zIndex: 100,
    counter: 0,
    selectedIcon: null,
    clickTimer: null,
    iconGrid: {
        slotWidth: 106,
        slotHeight: 92
    },
    iconPositions: {},
    iconDrag: {
        active: false,
        pointerId: null,
        iconEl: null,
        appId: '',
        startX: 0,
        startY: 0,
        iconStartX: 0,
        iconStartY: 0,
        startSlotCol: 0,
        startSlotRow: 0,
        moved: false
    },
    suppressIconOpen: '',
    selection: {
        active: false,
        started: false,
        startX: 0,
        startY: 0,
        desktopRect: null,
        boxEl: null,
        moved: false
    },

    init() {
        DragController.init();
        this.loadIconPositions();
        this.setupDesktopInteraction();
        this.setupKeyboardShortcuts();
        this.renderIcons();
        window.addEventListener('resize', () => this.clampAllIconsToDesktop());
    },

    setupDesktopInteraction() {
        const desktop = document.getElementById('desktop');
        const iconContainer = document.getElementById('desktop-icons');

        desktop.addEventListener('click', (event) => {
            if (this.selection.moved) {
                this.selection.moved = false;
                return;
            }

            if (event.target === desktop || event.target === iconContainer) {
                this.clearIconSelection();
            }
        });

        desktop.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            if (event.target.closest('.desktop-icon')) return;
            if (event.target.closest('.window')) return;
            this.beginSelection(event);
        });

        document.addEventListener('mousemove', (event) => this.updateSelection(event));
        document.addEventListener('mouseup', () => this.finishSelection());
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (!SessionManager.loggedIn) return;

            const target = event.target;
            const typing = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            );

            if (event.key === 'Escape') {
                Taskbar.closeStartMenu();
                ContextMenu.close();
                Clock.hidePopup();
                return;
            }

            if (typing) return;

            if (event.ctrlKey && event.key === 'Escape') {
                event.preventDefault();
                const menu = document.getElementById('start-menu');
                if (menu.classList.contains('visible')) {
                    Taskbar.closeStartMenu();
                } else {
                    Taskbar.openStartMenu();
                    SoundManager.play('click');
                }
                return;
            }

            if (event.altKey && event.key === 'F4') {
                event.preventDefault();
                if (this.activeId) {
                    this.close(this.activeId);
                } else {
                    SoundManager.play('stop');
                }
                return;
            }

            if (event.ctrlKey && event.key.toLowerCase() === 'd') {
                event.preventDefault();
                this.minimizeAll();
                return;
            }

            if (event.key === 'Enter' && this.selectedIcon) {
                event.preventDefault();
                this.open(this.selectedIcon.dataset.app);
                return;
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                this.moveIconSelection(event.key);
            }
        });
    },

    beginSelection(event) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        const rect = desktop.getBoundingClientRect();
        this.selection.active = true;
        this.selection.started = false;
        this.selection.desktopRect = rect;
        this.selection.startX = Math.max(rect.left, Math.min(event.clientX, rect.right));
        this.selection.startY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));

        if (this.selection.boxEl) {
            this.selection.boxEl.remove();
            this.selection.boxEl = null;
        }
    },

    updateSelection(event) {
        if (!this.selection.active) return;
        if (!this.selection.desktopRect) return;

        const rect = this.selection.desktopRect;
        const clampedX = Math.max(rect.left, Math.min(event.clientX, rect.right));
        const clampedY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));

        const dx = Math.abs(clampedX - this.selection.startX);
        const dy = Math.abs(clampedY - this.selection.startY);

        if (!this.selection.started && dx < 3 && dy < 3) {
            return;
        }

        if (!this.selection.started) {
            this.selection.started = true;
            this.selection.moved = true;
            this.clearIconSelection();

            const box = document.createElement('div');
            box.className = 'desktop-selection-box';
            document.getElementById('desktop').appendChild(box);
            this.selection.boxEl = box;
        }

        const left = Math.min(this.selection.startX, clampedX);
        const top = Math.min(this.selection.startY, clampedY);
        const width = Math.abs(clampedX - this.selection.startX);
        const height = Math.abs(clampedY - this.selection.startY);

        const box = this.selection.boxEl;
        if (!box) return;

        box.style.left = `${left - rect.left}px`;
        box.style.top = `${top - rect.top}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;

        this.selectIconsInRect({ left, top, right: left + width, bottom: top + height });
    },

    finishSelection() {
        if (!this.selection.active) return;

        this.selection.active = false;
        this.selection.started = false;
        this.selection.desktopRect = null;

        if (this.selection.boxEl) {
            this.selection.boxEl.remove();
            this.selection.boxEl = null;
        }
    },

    selectIconsInRect(rect) {
        let first = null;

        document.querySelectorAll('.desktop-icon').forEach(icon => {
            const iconRect = icon.getBoundingClientRect();
            const intersects = !(
                iconRect.right < rect.left ||
                iconRect.left > rect.right ||
                iconRect.bottom < rect.top ||
                iconRect.top > rect.bottom
            );

            icon.classList.toggle('selected', intersects);

            if (intersects && !first) {
                first = icon;
            }
        });

        this.selectedIcon = first;
    },

    clearIconSelection() {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.classList.remove('selected');
        });
        this.selectedIcon = null;
    },

    selectIcon(iconEl) {
        this.clearIconSelection();
        iconEl.classList.add('selected');
        this.selectedIcon = iconEl;
    },

    moveIconSelection(direction) {
        const icons = Array.from(document.querySelectorAll('.desktop-icon'));
        if (!icons.length) return;

        let index = icons.indexOf(this.selectedIcon);
        if (index < 0) {
            index = 0;
        } else if (direction === 'ArrowUp' || direction === 'ArrowLeft') {
            index = Math.max(0, index - 1);
        } else {
            index = Math.min(icons.length - 1, index + 1);
        }

        this.selectIcon(icons[index]);
    },

    handleIconClick(iconEl) {
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
        }

        this.selectIcon(iconEl);
        SoundManager.play('click');

        this.clickTimer = setTimeout(() => {
            this.clickTimer = null;
        }, 300);
    },

    handleIconDoubleClick(appId) {
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
        }

        this.open(appId);
    },

    loadIconPositions() {
        this.iconPositions = {};
        // Clear any old persisted icon layout from previous builds.
        window.localStorage.removeItem('xp-desktop-icon-positions-v1');
    },

    saveIconPositions() {
        // Intentionally no-op: icon layout should reset on refresh/restart/shutdown.
    },

    getDesktopMetrics() {
        const desktop = document.getElementById('desktop');
        const iconContainer = document.getElementById('desktop-icons');
        const desktopRect = desktop ? desktop.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        const taskbarHeight = Number.parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height'),
            10
        ) || 38;
        const fallbackWidth = Math.max(220, window.innerWidth - 24);
        const fallbackHeight = Math.max(180, window.innerHeight - taskbarHeight - 24);

        const containerWidth = iconContainer && iconContainer.clientWidth > 0
            ? iconContainer.clientWidth
            : Math.max(220, (desktopRect.width > 0 ? desktopRect.width : fallbackWidth) - 24);
        const containerHeight = iconContainer && iconContainer.clientHeight > 0
            ? iconContainer.clientHeight
            : Math.max(180, (desktopRect.height > 0 ? desktopRect.height : fallbackHeight) - 24);
        return { containerWidth, containerHeight };
    },

    getDefaultIconPosition(index) {
        const { containerHeight } = this.getDesktopMetrics();
        const { slotWidth, slotHeight } = this.iconGrid;
        const rows = Math.max(1, Math.floor(containerHeight / slotHeight));
        const col = Math.floor(index / rows);
        const row = index % rows;

        return {
            x: col * slotWidth,
            y: row * slotHeight
        };
    },

    getIconGridBounds(iconEl) {
        const { containerWidth, containerHeight } = this.getDesktopMetrics();
        const { slotWidth, slotHeight } = this.iconGrid;
        const iconWidth = iconEl ? iconEl.offsetWidth : 98;
        const iconHeight = iconEl ? iconEl.offsetHeight : 86;
        const cols = Math.max(1, Math.floor((Math.max(0, containerWidth - iconWidth)) / slotWidth) + 1);
        const rows = Math.max(1, Math.floor((Math.max(0, containerHeight - iconHeight)) / slotHeight) + 1);
        return { slotWidth, slotHeight, cols, rows };
    },

    getIconSlotFromCoords(x, y, iconEl) {
        const { slotWidth, slotHeight, cols, rows } = this.getIconGridBounds(iconEl);
        return {
            col: Math.max(0, Math.min(Math.round(x / slotWidth), cols - 1)),
            row: Math.max(0, Math.min(Math.round(y / slotHeight), rows - 1))
        };
    },

    getIconSlotFromElement(iconEl) {
        const x = Number.parseInt(iconEl.style.left, 10) || 0;
        const y = Number.parseInt(iconEl.style.top, 10) || 0;
        return this.getIconSlotFromCoords(x, y, iconEl);
    },

    findIconAtSlot(targetSlot, excludeAppId = '') {
        const icons = Array.from(document.querySelectorAll('.desktop-icon'));
        for (const icon of icons) {
            const appId = icon.dataset.app || '';
            if (!appId || appId === excludeAppId) continue;
            const slot = this.getIconSlotFromElement(icon);
            if (slot.col === targetSlot.col && slot.row === targetSlot.row) {
                return icon;
            }
        }
        return null;
    },

    getOccupiedIconSlots(excludeAppId = '') {
        const { slotWidth, slotHeight } = this.iconGrid;
        const occupied = new Set();

        document.querySelectorAll('.desktop-icon').forEach(iconEl => {
            const appId = iconEl.dataset.app;
            if (!appId || appId === excludeAppId) return;
            const x = Number.parseInt(iconEl.style.left, 10) || 0;
            const y = Number.parseInt(iconEl.style.top, 10) || 0;
            const col = Math.round(x / slotWidth);
            const row = Math.round(y / slotHeight);
            occupied.add(`${col},${row}`);
        });

        return occupied;
    },

    findNearestFreeSlot(targetCol, targetRow, cols, rows, occupied) {
        let best = { col: targetCol, row: targetRow };
        let bestDist = Number.POSITIVE_INFINITY;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const key = `${col},${row}`;
                if (occupied.has(key)) continue;
                const dx = col - targetCol;
                const dy = row - targetRow;
                const dist = (dx * dx) + (dy * dy);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = { col, row };
                }
            }
        }

        return best;
    },

    snapIconPosition(x, y, iconEl, excludeAppId = '') {
        const { slotWidth, slotHeight, cols, rows } = this.getIconGridBounds(iconEl);
        const targetCol = Math.max(0, Math.min(Math.round(x / slotWidth), cols - 1));
        const targetRow = Math.max(0, Math.min(Math.round(y / slotHeight), rows - 1));
        const occupied = this.getOccupiedIconSlots(excludeAppId);
        const targetKey = `${targetCol},${targetRow}`;

        let slot = { col: targetCol, row: targetRow };
        if (occupied.has(targetKey)) {
            slot = this.findNearestFreeSlot(targetCol, targetRow, cols, rows, occupied);
        }

        return this.clampIconPosition(slot.col * slotWidth, slot.row * slotHeight, iconEl);
    },

    clampIconPosition(x, y, iconEl) {
        const { containerWidth, containerHeight } = this.getDesktopMetrics();
        const iconWidth = iconEl ? iconEl.offsetWidth : 98;
        const iconHeight = iconEl ? iconEl.offsetHeight : 86;
        return {
            x: Math.max(0, Math.min(Math.round(x), Math.max(0, containerWidth - iconWidth))),
            y: Math.max(0, Math.min(Math.round(y), Math.max(0, containerHeight - iconHeight)))
        };
    },

    setIconPosition(iconEl, position) {
        const clamped = this.clampIconPosition(position.x, position.y, iconEl);
        iconEl.style.left = `${clamped.x}px`;
        iconEl.style.top = `${clamped.y}px`;
        return clamped;
    },

    beginIconDrag(event, iconEl, appId) {
        if (event.button !== 0) return;

        const currentX = Number.parseInt(iconEl.style.left, 10) || 0;
        const currentY = Number.parseInt(iconEl.style.top, 10) || 0;
        const startSlot = this.getIconSlotFromCoords(currentX, currentY, iconEl);

        this.iconDrag.active = true;
        this.iconDrag.pointerId = event.pointerId;
        this.iconDrag.iconEl = iconEl;
        this.iconDrag.appId = appId;
        this.iconDrag.startX = event.clientX;
        this.iconDrag.startY = event.clientY;
        this.iconDrag.iconStartX = currentX;
        this.iconDrag.iconStartY = currentY;
        this.iconDrag.startSlotCol = startSlot.col;
        this.iconDrag.startSlotRow = startSlot.row;
        this.iconDrag.moved = false;

        iconEl.classList.add('dragging');
        iconEl.setPointerCapture(event.pointerId);
    },

    updateIconDrag(event) {
        if (!this.iconDrag.active || this.iconDrag.pointerId !== event.pointerId) return;
        if (!this.iconDrag.iconEl) return;

        const dx = event.clientX - this.iconDrag.startX;
        const dy = event.clientY - this.iconDrag.startY;
        if (!this.iconDrag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
            return;
        }

        this.iconDrag.moved = true;
        const x = this.iconDrag.iconStartX + dx;
        const y = this.iconDrag.iconStartY + dy;
        this.setIconPosition(this.iconDrag.iconEl, { x, y });
    },

    endIconDrag(event) {
        if (!this.iconDrag.active || this.iconDrag.pointerId !== event.pointerId) return;
        if (!this.iconDrag.iconEl) return;

        const iconEl = this.iconDrag.iconEl;
        const appId = this.iconDrag.appId;

        if (this.iconDrag.moved) {
            const x = Number.parseInt(iconEl.style.left, 10) || 0;
            const y = Number.parseInt(iconEl.style.top, 10) || 0;
            const targetSlot = this.getIconSlotFromCoords(x, y, iconEl);
            const startSlot = {
                col: this.iconDrag.startSlotCol,
                row: this.iconDrag.startSlotRow
            };
            const { slotWidth, slotHeight } = this.iconGrid;

            const occupant = this.findIconAtSlot(targetSlot, appId);
            if (occupant) {
                const occupantAppId = occupant.dataset.app || '';
                const swapped = this.clampIconPosition(startSlot.col * slotWidth, startSlot.row * slotHeight, occupant);
                occupant.style.left = `${swapped.x}px`;
                occupant.style.top = `${swapped.y}px`;
                if (occupantAppId) {
                    this.iconPositions[occupantAppId] = swapped;
                }
            }

            const snapped = this.clampIconPosition(targetSlot.col * slotWidth, targetSlot.row * slotHeight, iconEl);
            iconEl.style.left = `${snapped.x}px`;
            iconEl.style.top = `${snapped.y}px`;
            this.iconPositions[appId] = snapped;
            this.saveIconPositions();
            this.suppressIconOpen = appId;
        }

        if (iconEl.hasPointerCapture(event.pointerId)) {
            iconEl.releasePointerCapture(event.pointerId);
        }
        iconEl.classList.remove('dragging');

        this.iconDrag.active = false;
        this.iconDrag.pointerId = null;
        this.iconDrag.iconEl = null;
        this.iconDrag.appId = '';
        this.iconDrag.startSlotCol = 0;
        this.iconDrag.startSlotRow = 0;
        this.iconDrag.moved = false;
    },

    clampAllIconsToDesktop() {
        const icons = Array.from(document.querySelectorAll('.desktop-icon'));
        if (!icons.length) return;

        let changed = false;
        icons.forEach(iconEl => {
            const appId = iconEl.dataset.app;
            const x = Number.parseInt(iconEl.style.left, 10) || 0;
            const y = Number.parseInt(iconEl.style.top, 10) || 0;
            const snapped = this.snapIconPosition(x, y, iconEl, appId);

            if (snapped.x !== x || snapped.y !== y) {
                iconEl.style.left = `${snapped.x}px`;
                iconEl.style.top = `${snapped.y}px`;
                changed = true;
            }

            if (appId) {
                this.iconPositions[appId] = snapped;
            }
        });

        if (changed) {
            this.saveIconPositions();
        }
    },

    resetIconsToDefaultPositions() {
        const icons = Array.from(document.querySelectorAll('.desktop-icon'));
        if (!icons.length) return;

        const order = AppsRegistry.getDesktopApps();
        const indexByAppId = new Map(order.map((app, index) => [app.appId, index]));

        this.iconPositions = {};
        icons.forEach(iconEl => {
            const appId = iconEl.dataset.app || '';
            if (!appId || !indexByAppId.has(appId)) return;

            const defaultPos = this.getDefaultIconPosition(indexByAppId.get(appId));
            const snapped = this.snapIconPosition(defaultPos.x, defaultPos.y, iconEl, appId);
            iconEl.style.left = `${snapped.x}px`;
            iconEl.style.top = `${snapped.y}px`;
            this.iconPositions[appId] = snapped;
        });

        this.clearIconSelection();
        this.suppressIconOpen = '';
    },

    renderIcons() {
        const container = document.getElementById('desktop-icons');
        container.innerHTML = '';

        const desktopApps = AppsRegistry.getDesktopApps();
        const appIds = new Set(desktopApps.map(app => app.appId));
        Object.keys(this.iconPositions).forEach(appId => {
            if (!appIds.has(appId)) {
                delete this.iconPositions[appId];
            }
        });

        desktopApps.forEach((app, index) => {
            const el = document.createElement('div');
            el.className = 'desktop-icon';
            el.dataset.app = app.appId;
            el.dataset.index = String(index);
            el.innerHTML = `
                <div class="icon-img">
                    <img src="${app.icon}" alt="${app.name}">
                </div>
                <div class="icon-label">${app.name}</div>
            `;

            container.appendChild(el);

            const savedPosition = this.iconPositions[app.appId];
            const desired = savedPosition || this.getDefaultIconPosition(index);
            const positioned = this.snapIconPosition(desired.x, desired.y, el, app.appId);
            el.style.left = `${positioned.x}px`;
            el.style.top = `${positioned.y}px`;
            this.iconPositions[app.appId] = positioned;

            el.addEventListener('pointerdown', (event) => {
                event.stopPropagation();
                if (event.button !== 0) return;
                this.selectIcon(el);
                this.beginIconDrag(event, el, app.appId);
            });

            el.addEventListener('pointermove', (event) => this.updateIconDrag(event));
            el.addEventListener('pointerup', (event) => this.endIconDrag(event));
            el.addEventListener('pointercancel', (event) => this.endIconDrag(event));

            el.addEventListener('click', (event) => {
                event.stopPropagation();
                if (this.suppressIconOpen === app.appId) {
                    this.suppressIconOpen = '';
                    return;
                }
                this.handleIconClick(el);
            });

            el.addEventListener('dblclick', (event) => {
                event.stopPropagation();
                if (this.suppressIconOpen === app.appId) {
                    this.suppressIconOpen = '';
                    return;
                }
                this.handleIconDoubleClick(app.appId);
            });
        });

        this.saveIconPositions();
    },

    open(appId) {
        const existing = Object.values(this.windows).find(w => w.appId === appId && !w.closed);
        if (existing) {
            existing.minimized ? this.restore(existing.id) : this.focus(existing.id);
            return;
        }

        const app = AppsRegistry.getApp(appId);
        if (!app) {
            SoundManager.play('stop');
            return;
        }

        if (app.externalUrl) {
            window.location.assign(app.externalUrl);
            return;
        }

        const id = `win-${++this.counter}`;
        const win = document.createElement('div');
        win.className = 'window active';
        win.dataset.windowId = id;

        const desktopRect = document.getElementById('desktop').getBoundingClientRect();
        const maxWidth = Math.max(260, desktopRect.width - 24);
        const maxHeight = Math.max(200, desktopRect.height - 24);
        const width = Math.min(app.width, maxWidth);
        const height = Math.min(app.height, maxHeight);

        const offset = Object.keys(this.windows).length;
        const x = Math.max(0, Math.min(70 + (offset * 25) % 150, desktopRect.width - width));
        const y = Math.max(0, Math.min(48 + (offset * 25) % 100, desktopRect.height - height));

        win.style.left = `${x}px`;
        win.style.top = `${y}px`;
        win.style.width = `${width}px`;
        win.style.height = `${height}px`;
        win.style.zIndex = ++this.zIndex;

        win.innerHTML = `
            <div class="window-titlebar">
                <div class="window-title">
                    <img src="${app.icon}" alt="">
                    <span>${app.name}</span>
                </div>
                <div class="window-controls">
                    <button class="window-btn minimize-btn" title="Minimize" aria-label="Minimize">
                        <span class="window-icon window-icon-minimize" aria-hidden="true"></span>
                    </button>
                    <button class="window-btn maximize-btn" title="Maximize" aria-label="Maximize">
                        <span class="window-icon window-icon-maximize" aria-hidden="true"></span>
                    </button>
                    <button class="window-btn close-btn" title="Close" aria-label="Close">
                        <span class="window-icon window-icon-close" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <div class="window-content">${AppsRegistry.generateContent(app)}</div>
        `;

        const titlebar = win.querySelector('.window-titlebar');
        titlebar.addEventListener('mousedown', event => {
            if (!event.target.closest('.window-btn')) {
                this.focus(id);
                DragController.start(win, event);
            }
        });

        titlebar.addEventListener('dblclick', event => {
            if (!event.target.closest('.window-btn')) {
                this.toggleMaximize(id);
            }
        });

        win.addEventListener('mousedown', () => this.focus(id));

        win.querySelector('.minimize-btn').onclick = () => this.minimize(id);
        win.querySelector('.maximize-btn').onclick = () => this.toggleMaximize(id);
        win.querySelector('.close-btn').onclick = () => this.close(id);

        if (app.id === 'projects') {
            setTimeout(() => this.initProjects(win), 0);
        }

        if (app.id === 'control') {
            setTimeout(() => this.initControlPanel(win), 0);
        }

        if (app.id === 'paint') {
            setTimeout(() => this.initPaint(win), 0);
        }

        if (app.id === 'about') {
            setTimeout(() => this.initNotepad(win, id), 0);
        }

        if (app.isTerminal) {
            setTimeout(() => this.initTerminal(win, id), 0);
        }

        document.getElementById('windows-container').appendChild(win);

        this.windows[id] = {
            id,
            appId,
            el: win,
            x,
            y,
            width,
            height,
            zIndex: this.zIndex,
            active: true,
            minimized: false,
            maximized: false,
            closed: false
        };

        this.focus(id);
        Taskbar.addButton(id, app.name, app.icon);
        SoundManager.play('open');
    },

    initProjects(win) {
        win.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => {
                win.querySelectorAll('.project-item').forEach(node => node.classList.remove('selected'));
                item.classList.add('selected');
            });

            item.addEventListener('dblclick', () => {
                const link = item.dataset.link;
                if (link) {
                    window.open(link, '_blank');
                }
            });
        });
    },

    initControlPanel(win) {
        const panel = win.querySelector('.control-panel');
        if (!panel) return;

        const sync = () => {
            panel.querySelectorAll('[data-theme]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === Personalization.getTheme());
            });

            panel.querySelectorAll('[data-wallpaper-key]').forEach(btn => {
                const key = btn.dataset.wallpaperKey;
                const wallpaper = Personalization.getWallpaperByKey(key);
                btn.classList.toggle('active', wallpaper === Personalization.getWallpaper());
            });

            const soundBtn = panel.querySelector('[data-sound-toggle]');
            if (soundBtn) {
                soundBtn.textContent = SoundManager.isEnabled() ? 'Disable Sounds' : 'Enable Sounds';
            }
        };

        panel.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                Personalization.applyTheme(btn.dataset.theme);
                SoundManager.play('click');
                sync();
            });
        });

        panel.querySelectorAll('[data-wallpaper-key]').forEach(btn => {
            btn.addEventListener('click', () => {
                const wallpaper = Personalization.getWallpaperByKey(btn.dataset.wallpaperKey);
                if (wallpaper) {
                    Personalization.applyWallpaper(wallpaper);
                    SoundManager.play('click');
                    sync();
                }
            });
        });

        const soundBtn = panel.querySelector('[data-sound-toggle]');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                SoundManager.toggle();
                sync();
            });
        }

        sync();
    },

    initPaint(win) {
        const canvas = win.querySelector('.paint-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let drawing = false;
        let brushColor = '#000000';
        let brushSize = 4;

        const getCanvasPoint = (event) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (event.clientX - rect.left) * scaleX,
                y: (event.clientY - rect.top) * scaleY
            };
        };

        const startDraw = (event) => {
            drawing = true;
            const point = getCanvasPoint(event);
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            canvas.setPointerCapture(event.pointerId);
        };

        const draw = (event) => {
            if (!drawing) return;
            const point = getCanvasPoint(event);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        };

        const stopDraw = (event) => {
            if (!drawing) return;
            drawing = false;
            ctx.closePath();
            if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
                canvas.releasePointerCapture(event.pointerId);
            }
        };

        canvas.addEventListener('pointerdown', startDraw);
        canvas.addEventListener('pointermove', draw);
        canvas.addEventListener('pointerup', stopDraw);
        canvas.addEventListener('pointercancel', stopDraw);
        canvas.addEventListener('pointerleave', stopDraw);

        win.querySelectorAll('.paint-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                win.querySelectorAll('.paint-swatch').forEach(node => node.classList.remove('active'));
                btn.classList.add('active');
                brushColor = btn.dataset.color;
            });
        });

        const sizeSelect = win.querySelector('[data-paint-size]');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', () => {
                brushSize = parseInt(sizeSelect.value, 10);
            });
        }

        win.querySelectorAll('[data-paint-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.paintAction;

                if (action === 'eraser') {
                    brushColor = '#ffffff';
                    win.querySelectorAll('.paint-swatch').forEach(node => node.classList.remove('active'));
                } else if (action === 'clear') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else if (action === 'save') {
                    const link = document.createElement('a');
                    link.download = 'paint-drawing.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            });
        });
    },

    initNotepad(win, id) {
        const shell = win.querySelector('[data-notepad-shell]');
        const editor = win.querySelector('[data-notepad-editor]');
        if (!shell || !editor) return;
        const windowContent = win.querySelector('.window-content');

        const menuGroups = Array.from(shell.querySelectorAll('.notepad-menu-group'));
        const menuButtons = Array.from(shell.querySelectorAll('[data-notepad-menu]'));
        const actionButtons = Array.from(shell.querySelectorAll('[data-notepad-action]'));
        const wordWrapButton = shell.querySelector('[data-notepad-action="word-wrap"]');
        let openMenu = '';
        let wordWrapEnabled = false;

        const closeMenus = () => {
            openMenu = '';
            menuGroups.forEach(group => group.classList.remove('open'));
        };

        const openMenuByName = (menuName) => {
            openMenu = menuName;
            menuGroups.forEach(group => {
                group.classList.toggle('open', group.dataset.notepadGroup === menuName);
            });
        };

        const applyWordWrap = () => {
            editor.classList.toggle('word-wrap', wordWrapEnabled);
            editor.setAttribute('wrap', wordWrapEnabled ? 'soft' : 'off');
            if (wordWrapButton) {
                wordWrapButton.classList.toggle('checked', wordWrapEnabled);
            }
        };

        const saveFile = () => {
            const blob = new Blob([editor.value], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Untitled.txt';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        };

        const insertTextAtCursor = (text) => {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const current = editor.value;
            editor.value = `${current.slice(0, start)}${text}${current.slice(end)}`;
            const cursor = start + text.length;
            editor.selectionStart = cursor;
            editor.selectionEnd = cursor;
            editor.focus();
        };

        const getTimeDateStamp = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            const date = now.toLocaleDateString('en-US');
            return `${time} ${date}`;
        };

        const showDialog = (title, message) => {
            if (!windowContent) return;

            const existing = windowContent.querySelector('.notepad-dialog-backdrop');
            if (existing) existing.remove();

            const backdrop = document.createElement('div');
            backdrop.className = 'notepad-dialog-backdrop';
            backdrop.innerHTML = `
                <div class="notepad-dialog" role="dialog" aria-modal="true" aria-label="${title}">
                    <div class="notepad-dialog-title">${title}</div>
                    <div class="notepad-dialog-body">${message}</div>
                    <div class="notepad-dialog-actions">
                        <button type="button" class="notepad-dialog-ok">OK</button>
                    </div>
                </div>
            `;

            const closeDialog = () => {
                backdrop.remove();
                editor.focus();
            };

            const okButton = backdrop.querySelector('.notepad-dialog-ok');
            if (okButton) {
                okButton.addEventListener('click', () => {
                    SoundManager.play('click');
                    closeDialog();
                });
                setTimeout(() => okButton.focus(), 0);
            }

            backdrop.addEventListener('click', (event) => {
                if (event.target === backdrop) {
                    SoundManager.play('click');
                    closeDialog();
                }
            });

            backdrop.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' || event.key === 'Enter') {
                    event.preventDefault();
                    SoundManager.play('click');
                    closeDialog();
                }
            });

            windowContent.appendChild(backdrop);
        };

        const runAction = (action, event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (!action) return;

            if (action === 'new') {
                editor.value = '';
                editor.focus();
                SoundManager.play('click');
                return;
            }

            if (action === 'save') {
                saveFile();
                SoundManager.play('click');
                return;
            }

            if (action === 'select-all') {
                editor.focus();
                editor.select();
                SoundManager.play('click');
                return;
            }

            if (action === 'time-date') {
                insertTextAtCursor(getTimeDateStamp());
                SoundManager.play('click');
                return;
            }

            if (action === 'word-wrap') {
                wordWrapEnabled = !wordWrapEnabled;
                applyWordWrap();
                SoundManager.play('click');
                return;
            }

            if (action === 'about-notepad') {
                showDialog('About Notepad', 'Simple plain text editor for your desktop shell.');
                SoundManager.play('click');
                return;
            }

            if (action === 'exit') {
                this.close(id);
            }
        };

        menuButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const menuName = button.dataset.notepadMenu;
                if (openMenu === menuName) {
                    closeMenus();
                } else {
                    openMenuByName(menuName);
                }
                event.stopPropagation();
            });
        });

        menuGroups.forEach(group => {
            group.addEventListener('mouseenter', () => {
                if (!openMenu) return;
                openMenuByName(group.dataset.notepadGroup);
            });
        });

        actionButtons.forEach(button => {
            button.addEventListener('click', event => {
                const action = button.dataset.notepadAction;
                closeMenus();
                runAction(action, event);
            });
        });

        win.addEventListener('mousedown', event => {
            if (!event.target.closest('.notepad-menu-group')) {
                closeMenus();
            }
        });

        editor.addEventListener('keydown', event => {
            if (event.key === 'F5') {
                runAction('time-date', event);
                return;
            }

            if (!event.ctrlKey || event.altKey) return;

            const key = event.key.toLowerCase();
            if (key === 'n') {
                runAction('new', event);
            } else if (key === 's') {
                runAction('save', event);
            } else if (key === 'a') {
                runAction('select-all', event);
            }
        });

        applyWordWrap();
        setTimeout(() => editor.focus(), 0);
    },

    initTerminal(win, id) {
        const term = win.querySelector('.cmd-terminal');
        const input = win.querySelector('.cmd-input');
        if (!input) return;

        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                const cmd = input.value;
                this.runCommand(cmd, id);
                input.value = '';
            }
        });

        term.addEventListener('click', () => input.focus());
    },

    runCommand(cmd, id) {
        const win = this.windows[id];
        if (!win) return;

        const term = win.el.querySelector('.cmd-terminal');
        const inputText = cmd.trim();
        if (!inputText) return;

        const cmdLine = document.createElement('div');
        cmdLine.className = 'cmd-line';
        cmdLine.innerHTML = `<span class="cmd-prompt">C:\\>${inputText}</span>`;
        term.insertBefore(cmdLine, term.querySelector('.cmd-input-line'));

        let output = '';
        let isError = false;
        let feedbackSound = '';

        const [baseCommand, ...args] = inputText.split(/\s+/);
        const command = baseCommand.toLowerCase();
        const argument = args.join(' ').toLowerCase();

        if (command === 'help') {
            output = `Available commands:\n  help        - Show this help message\n  whoami      - Display profile name\n  about       - Show summary\n  skills      - List core skills\n  projects    - List projects\n  contact     - List contact links\n  resume      - Show resume file title\n  theme       - Set theme [blue]\n  wallpaper   - Set wallpaper [bliss|redbull|redcar|verstappen]\n  sound       - Set sound [on|off]\n  open        - Open app (about/projects/skills/resume/contact/control/paint/spotify)\n  clear       - Clear the terminal\n  date        - Show current date\n  time        - Show current time\n  hostname    - Display computer name`;
        } else if (command === 'whoami') {
            output = AppsRegistry.profile.displayName;
        } else if (command === 'about') {
            output = `${AppsRegistry.profile.displayName} - ${AppsRegistry.profile.role}\n${AppsRegistry.profile.summary}`;
        } else if (command === 'skills') {
            output = `Core Skills:\n${AppsRegistry.profile.skills.map(skill => `  - ${skill}`).join('\n')}`;
        } else if (command === 'projects') {
            output = `Projects:\n${AppsRegistry.profile.projects.map(project => `  - ${project.name}`).join('\n')}`;
        } else if (command === 'contact') {
            output = `Contact:\n${AppsRegistry.profile.contacts.map(contact => `  - ${contact.label}: ${contact.value}`).join('\n')}`;
        } else if (command === 'resume') {
            output = AppsRegistry.profile.resume.title;
        } else if (command === 'theme') {
            const map = { blue: 'luna-blue' };
            const theme = map[argument];
            if (theme) {
                Personalization.applyTheme(theme);
                output = `Theme set to ${theme}.`;
            } else {
                output = 'Usage: theme [blue]';
                isError = true;
                feedbackSound = 'stop';
            }
        } else if (command === 'wallpaper') {
            const wallpaper = Personalization.getWallpaperByKey(argument);
            if (wallpaper) {
                Personalization.applyWallpaper(wallpaper);
                output = `Wallpaper set to ${argument}.`;
            } else {
                output = 'Usage: wallpaper [bliss|redbull|redcar|verstappen]';
                isError = true;
                feedbackSound = 'stop';
            }
        } else if (command === 'sound') {
            if (argument === 'on') {
                SoundManager.setEnabled(true);
                SoundManager.play('click');
                output = 'Sounds enabled.';
            } else if (argument === 'off') {
                SoundManager.setEnabled(false);
                output = 'Sounds muted.';
            } else {
                output = 'Usage: sound [on|off]';
                isError = true;
                feedbackSound = 'stop';
            }
        } else if (command === 'open') {
            const appAliases = {
                about: 'about',
                projects: 'projects',
                skills: 'skills',
                resume: 'resume',
                contact: 'contact',
                control: 'control',
                paint: 'paint',
                spotify: 'spotify'
            };

            const appId = appAliases[argument];
            if (appId) {
                this.open(appId);
                output = `Opening ${AppsRegistry.getApp(appId).name}...`;
            } else {
                output = 'Usage: open [about|projects|skills|resume|contact|control|paint|spotify]';
                isError = true;
                feedbackSound = 'stop';
            }
        } else if (command === 'clear') {
            win.el.querySelector('.window-content').innerHTML = AppsRegistry.generateContent(AppsRegistry.getApp(win.appId));
            setTimeout(() => this.initTerminal(win.el, id), 0);
            return;
        } else if (command === 'date') {
            output = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (command === 'time') {
            output = new Date().toLocaleTimeString();
        } else if (command === 'hostname') {
            output = 'XP-DESKTOP';
        } else {
            output = `'${command}' is not recognized as an internal or external command, operable program or batch file.`;
            isError = true;
            feedbackSound = 'error';
        }

        const outLine = document.createElement('div');
        outLine.className = `cmd-output ${isError ? 'error' : ''}`;
        outLine.textContent = output;
        term.insertBefore(outLine, term.querySelector('.cmd-input-line'));
        term.scrollTop = term.scrollHeight;

        if (isError) {
            SoundManager.play(feedbackSound || 'error');
        }
    },

    focus(id) {
        const win = this.windows[id];
        if (!win || win.minimized || win.closed) return;

        if (this.activeId && this.windows[this.activeId]) {
            this.windows[this.activeId].el.classList.remove('active');
            this.windows[this.activeId].el.classList.add('inactive');
            this.windows[this.activeId].active = false;
        }

        win.el.classList.remove('inactive');
        win.el.classList.add('active');
        win.el.style.zIndex = ++this.zIndex;
        win.zIndex = this.zIndex;
        win.active = true;
        this.activeId = id;
        Taskbar.setActive(id);
    },

    minimize(id, playSound = true) {
        const win = this.windows[id];
        if (!win) return;

        win.minimized = true;
        win.el.classList.add('minimized');
        Taskbar.setMinimized(id, true);

        if (playSound) {
            SoundManager.play('minimize');
        }

        if (this.activeId === id) {
            this.activeId = null;
            const visible = Object.values(this.windows).filter(w => !w.minimized && !w.closed);
            if (visible.length) {
                this.focus(visible[visible.length - 1].id);
            }
        }
    },

    restore(id) {
        const win = this.windows[id];
        if (!win) return;

        win.minimized = false;
        win.el.classList.remove('minimized');
        Taskbar.setMinimized(id, false);
        this.focus(id);
        SoundManager.play('restore');
    },

    toggleMaximize(id) {
        const win = this.windows[id];
        if (!win) return;

        const maxBtn = win.el.querySelector('.maximize-btn');

        if (win.maximized) {
            win.el.classList.remove('maximized');
            win.el.style.left = `${win.x}px`;
            win.el.style.top = `${win.y}px`;
            win.el.style.width = `${win.width}px`;
            win.el.style.height = `${win.height}px`;
            win.maximized = false;
            if (maxBtn) {
                maxBtn.classList.remove('restore-mode');
                maxBtn.title = 'Maximize';
                maxBtn.setAttribute('aria-label', 'Maximize');
            }
        } else {
            win.x = parseInt(win.el.style.left, 10);
            win.y = parseInt(win.el.style.top, 10);
            win.el.classList.add('maximized');
            win.maximized = true;
            if (maxBtn) {
                maxBtn.classList.add('restore-mode');
                maxBtn.title = 'Restore';
                maxBtn.setAttribute('aria-label', 'Restore');
            }
        }
    },

    close(id, playSound = true) {
        const win = this.windows[id];
        if (!win) return;

        win.closed = true;
        win.el.remove();
        Taskbar.removeButton(id);

        if (playSound) {
            SoundManager.play('close');
        }

        if (this.activeId === id) {
            this.activeId = null;
            const visible = Object.values(this.windows).filter(w => !w.minimized && !w.closed);
            if (visible.length) {
                this.focus(visible[visible.length - 1].id);
            }
        }

        delete this.windows[id];
    },

    toggle(id) {
        const win = this.windows[id];
        if (!win) return;

        if (win.minimized) {
            this.restore(id);
        } else if (this.activeId === id) {
            this.minimize(id);
        } else {
            this.focus(id);
        }
    },

    minimizeAll() {
        let minimizedAny = false;

        Object.keys(this.windows).forEach(id => {
            const win = this.windows[id];
            if (win && !win.minimized && !win.closed) {
                this.minimize(id, false);
                minimizedAny = true;
            }
        });

        if (minimizedAny) {
            SoundManager.play('minimize');
        }
    },

    closeAll(playSound = false) {
        Object.keys(this.windows).forEach(id => {
            if (this.windows[id]) {
                this.close(id, playSound);
            }
        });
        this.activeId = null;
    }
};
