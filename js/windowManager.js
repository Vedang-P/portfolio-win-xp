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
    recycledDesktopItems: [],
    deletedDesktopApps: new Set(),
    youtubeApiPromise: null,

    init() {
        DragController.init();
        this.loadIconPositions();
        this.setupDesktopInteraction();
        this.setupKeyboardShortcuts();
        this.renderIcons();
        window.addEventListener('resize', () => this.clampAllIconsToDesktop());
    },

    isMobileUI() {
        return window.matchMedia('(max-width: 980px)').matches ||
            window.matchMedia('(pointer: coarse)').matches;
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
            if (this.isMobileUI()) return;
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

            if (event.key === 'Delete') {
                event.preventDefault();
                this.recycleSelectedIcons();
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

    isRecyclableDesktopApp(appId) {
        return Boolean(appId) && appId !== 'recycle';
    },

    getDesktopAppMeta(appId) {
        return AppsRegistry.getDesktopApps().find(app => app.appId === appId) || null;
    },

    recycleSelectedIcons() {
        const selectedIcons = Array.from(document.querySelectorAll('.desktop-icon.selected'));
        if (!selectedIcons.length) {
            SoundManager.play('stop');
            return;
        }

        let recycledAny = false;
        selectedIcons.forEach(icon => {
            const appId = icon.dataset.app;
            if (this.recycleDesktopIcon(appId)) {
                recycledAny = true;
            }
        });

        if (recycledAny) {
            SoundManager.play('recycle');
        } else {
            SoundManager.play('error');
        }
    },

    recycleDesktopIcon(appId) {
        if (!this.isRecyclableDesktopApp(appId)) return false;
        if (this.deletedDesktopApps.has(appId)) return false;

        const appMeta = this.getDesktopAppMeta(appId);
        if (!appMeta) return false;

        const iconEl = document.querySelector(`.desktop-icon[data-app="${appId}"]`);
        const currentPosition = iconEl
            ? {
                x: Number.parseInt(iconEl.style.left, 10) || 0,
                y: Number.parseInt(iconEl.style.top, 10) || 0
            }
            : (this.iconPositions[appId] || { x: 0, y: 0 });

        this.recycledDesktopItems = this.recycledDesktopItems.filter(item => item.appId !== appId);
        this.recycledDesktopItems.push({
            appId,
            name: appMeta.name,
            icon: appMeta.icon,
            position: currentPosition,
            deletedAt: Date.now()
        });

        this.deletedDesktopApps.add(appId);

        Object.values(this.windows).forEach(win => {
            if (win.appId === appId && !win.closed) {
                this.close(win.id, false);
            }
        });

        if (this.selectedIcon && this.selectedIcon.dataset.app === appId) {
            this.selectedIcon = null;
        }

        this.renderIcons();
        this.updateRecycleBinVisuals();
        this.refreshRecycleBinWindows();
        return true;
    },

    restoreRecycleItem(appId) {
        const item = this.recycledDesktopItems.find(entry => entry.appId === appId);
        if (!item) return false;

        this.recycledDesktopItems = this.recycledDesktopItems.filter(entry => entry.appId !== appId);
        this.deletedDesktopApps.delete(appId);

        if (item.position) {
            this.iconPositions[appId] = { x: item.position.x, y: item.position.y };
        }

        this.renderIcons();
        this.updateRecycleBinVisuals();
        this.refreshRecycleBinWindows();
        SoundManager.play('restore');
        return true;
    },

    restoreAllRecycleItems() {
        if (!this.recycledDesktopItems.length) {
            SoundManager.play('stop');
            return false;
        }

        this.recycledDesktopItems.forEach(item => {
            this.deletedDesktopApps.delete(item.appId);
            if (item.position) {
                this.iconPositions[item.appId] = { x: item.position.x, y: item.position.y };
            }
        });
        this.recycledDesktopItems = [];

        this.renderIcons();
        this.updateRecycleBinVisuals();
        this.refreshRecycleBinWindows();
        SoundManager.play('restore');
        return true;
    },

    emptyRecycleBin() {
        if (!this.recycledDesktopItems.length) {
            SoundManager.play('stop');
            return false;
        }

        this.recycledDesktopItems = [];
        this.updateRecycleBinVisuals();
        this.refreshRecycleBinWindows();
        SoundManager.play('recycle');
        return true;
    },

    updateRecycleBinVisuals() {
        const emptyIcon = 'assets/icons/Windows XP Icons/0020 - Recycle Bin Empty.ico';
        const fullIcon = 'assets/icons/Windows XP Icons/0021 -  Recycle Bin Full.ico';
        const nextIcon = this.recycledDesktopItems.length ? fullIcon : emptyIcon;

        if (AppsRegistry.apps.recycle) {
            AppsRegistry.apps.recycle.icon = nextIcon;
        }

        document.querySelectorAll('.desktop-icon[data-app="recycle"] img').forEach(img => {
            img.src = nextIcon;
        });

        Object.values(this.windows).forEach(win => {
            if (win.appId !== 'recycle' || win.closed) return;
            const titleIcon = win.el.querySelector('.window-title img');
            if (titleIcon) titleIcon.src = nextIcon;

            const taskIcon = document.querySelector(`.taskbar-app[data-id="${win.id}"] .app-icon`);
            if (taskIcon) taskIcon.src = nextIcon;
        });
    },

    refreshRecycleBinWindows() {
        Object.values(this.windows).forEach(win => {
            if (win.appId === 'recycle' && !win.closed) {
                this.renderRecycleBinContents(win.el);
            }
        });
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
        this.recycledDesktopItems = [];
        this.deletedDesktopApps.clear();
        this.updateRecycleBinVisuals();
        this.renderIcons();

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
        this.refreshRecycleBinWindows();
    },

    renderIcons() {
        const container = document.getElementById('desktop-icons');
        container.innerHTML = '';

        const desktopApps = AppsRegistry.getDesktopApps()
            .filter(app => !this.deletedDesktopApps.has(app.appId));
        const appIds = new Set(desktopApps.map(app => app.appId));
        Object.keys(this.iconPositions).forEach(appId => {
            if (!appIds.has(appId) && !this.deletedDesktopApps.has(appId)) {
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
                if (this.isMobileUI()) {
                    this.selectIcon(el);
                    SoundManager.play('click');
                    this.open(app.appId);
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

        this.updateRecycleBinVisuals();
        this.saveIconPositions();
    },

    open(appId) {
        const app = AppsRegistry.getApp(appId);
        if (!app) {
            SoundManager.play('stop');
            return;
        }

        if (app.externalUrl) {
            window.location.assign(app.externalUrl);
            return;
        }

        const existing = Object.values(this.windows).find(w => w.appId === appId && !w.closed);
        if (existing) {
            existing.minimized ? this.restore(existing.id) : this.focus(existing.id);
            return;
        }

        const id = `win-${++this.counter}`;
        const win = document.createElement('div');
        win.className = 'window active';
        win.dataset.windowId = id;
        const mobileUI = this.isMobileUI();

        const desktopRect = document.getElementById('desktop').getBoundingClientRect();
        const frameInset = mobileUI ? 8 : 24;
        const maxWidth = Math.max(260, desktopRect.width - frameInset);
        const maxHeight = Math.max(200, desktopRect.height - frameInset);
        const width = mobileUI
            ? Math.min(maxWidth, Math.max(300, desktopRect.width - 8))
            : Math.min(app.width, maxWidth);
        const height = mobileUI
            ? Math.min(maxHeight, Math.max(220, desktopRect.height - 8))
            : Math.min(app.height, maxHeight);

        const offset = Object.keys(this.windows).length;
        const x = mobileUI
            ? Math.max(0, Math.min(4, desktopRect.width - width))
            : Math.max(0, Math.min(70 + (offset * 25) % 150, desktopRect.width - width));
        const y = mobileUI
            ? Math.max(0, Math.min(4, desktopRect.height - height))
            : Math.max(0, Math.min(48 + (offset * 25) % 100, desktopRect.height - height));

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
        titlebar.addEventListener('pointerdown', event => {
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

        win.addEventListener('pointerdown', () => this.focus(id));

        win.querySelector('.minimize-btn').onclick = () => this.minimize(id);
        win.querySelector('.maximize-btn').onclick = () => this.toggleMaximize(id);
        win.querySelector('.close-btn').onclick = () => this.close(id);

        if (app.id === 'projects') {
            setTimeout(() => this.initProjects(win), 0);
        }

        if (app.id === 'mycomputer') {
            setTimeout(() => this.initMyComputer(win), 0);
        }

        if (app.id === 'mydocs') {
            setTimeout(() => this.initDocuments(win), 0);
        }

        if (app.id === 'control') {
            setTimeout(() => this.initControlPanel(win), 0);
        }

        if (app.id === 'paint') {
            setTimeout(() => this.initPaint(win), 0);
        }

        if (app.id === 'spotify') {
            setTimeout(() => this.initSpotify(win), 0);
        }

        if (app.id === 'recycle') {
            setTimeout(() => this.initRecycleBin(win), 0);
        }

        if (app.id === 'about') {
            setTimeout(() => this.initNotepad(win, id), 0);
        }

        if (app.id === 'contact') {
            setTimeout(() => this.initContact(win), 0);
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

    initMyComputer(win) {
        const links = win.querySelectorAll('[data-mc-open-url]');
        if (!links.length) return;

        links.forEach(linkEl => {
            linkEl.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const url = linkEl.dataset.mcOpenUrl || '';
                if (!url) {
                    SoundManager.play('stop');
                    return;
                }
                SoundManager.play('open');
                window.location.assign(url);
            });
        });
    },

    initDocuments(win) {
        const root = win.querySelector('[data-docs-root]');
        if (!root || root.dataset.bound === '1') return;
        root.dataset.bound = '1';

        const itemsEl = root.querySelector('[data-docs-items]');
        const statusEl = root.querySelector('[data-docs-status]');
        const pathEl = root.querySelector('[data-docs-path]');
        const folderTitleEl = root.querySelector('[data-docs-folder-title]');
        const detailsEl = root.querySelector('[data-docs-selection-details]');
        const placesEl = root.querySelector('[data-docs-places]');
        const searchInput = root.querySelector('[data-docs-search]');
        const viewSelect = root.querySelector('[data-docs-view-select]');
        const columnsEl = root.querySelector('[data-docs-columns]');
        if (!itemsEl || !statusEl || !pathEl || !folderTitleEl || !detailsEl || !placesEl || !searchInput || !viewSelect || !columnsEl) {
            return;
        }

        const escapeHtml = (value) => {
            if (typeof AppsRegistry.escapeHTML === 'function') {
                return AppsRegistry.escapeHTML(value);
            }
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const iconSet = {
            folder: 'assets/icons/Windows XP Icons/0001 - Closed Folder.ico',
            mydocs: 'assets/icons/Windows XP Icons/0002 - My Documents.ico',
            pictures: 'assets/icons/Windows XP Icons/0003 - My Pictures.ico',
            music: 'assets/icons/Windows XP Icons/0004 - My Music.ico',
            text: 'assets/icons/Windows XP Icons/0047 - Text Document.ico',
            image: 'assets/icons/Windows XP Icons/0048 - Bitmap.ico',
            shortcut: 'assets/icons/Windows XP Icons/0033 - Shortcut.ico',
            ie: 'assets/icons/Windows XP Icons/0081 - Internet Explorer.ico',
            paint: 'assets/icons/Windows XP Icons/0071 - Microsoft Paint.ico',
            spotify: 'assets/icons/spotify.svg',
            projects: 'assets/icons/Windows XP Icons/0001 - Closed Folder.ico',
            mycomputer: 'assets/icons/Windows XP Icons/0018 - My Computer.ico'
        };

        const formatDate = (year, month, day, hour, minute) => {
            return new Date(year, month - 1, day, hour, minute).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        };

        const rootFolder = {
            id: 'docs-root',
            name: 'My Documents',
            kind: 'folder',
            icon: iconSet.mydocs,
            modified: formatDate(2026, 2, 22, 2, 35),
            children: [
                {
                    id: 'docs-portfolio',
                    name: 'Portfolio',
                    kind: 'folder',
                    icon: iconSet.folder,
                    modified: formatDate(2026, 2, 22, 1, 12),
                    children: [
                        {
                            id: 'docs-projects-shortcut',
                            name: 'Projects.lnk',
                            kind: 'shortcut',
                            icon: iconSet.projects,
                            size: '1 KB',
                            modified: formatDate(2026, 2, 21, 8, 4),
                            open: { type: 'app', appId: 'projects' }
                        },
                        {
                            id: 'docs-paint-shortcut',
                            name: 'Paint.lnk',
                            kind: 'shortcut',
                            icon: iconSet.paint,
                            size: '1 KB',
                            modified: formatDate(2026, 2, 20, 7, 55),
                            open: { type: 'app', appId: 'paint' }
                        },
                        {
                            id: 'docs-spotify-shortcut',
                            name: 'Spotify.lnk',
                            kind: 'shortcut',
                            icon: iconSet.spotify,
                            size: '1 KB',
                            modified: formatDate(2026, 2, 20, 9, 16),
                            open: { type: 'app', appId: 'spotify' }
                        }
                    ]
                },
                {
                    id: 'docs-notes',
                    name: 'Notes',
                    kind: 'folder',
                    icon: iconSet.folder,
                    modified: formatDate(2026, 2, 20, 11, 42),
                    children: [
                        {
                            id: 'docs-about-note',
                            name: 'About Vedang.txt',
                            kind: 'text',
                            icon: iconSet.text,
                            size: '2 KB',
                            modified: formatDate(2026, 2, 20, 11, 42),
                            content: `Vedang
Frontend engineer building nostalgic, fast interfaces.

This XP portfolio is a frontend-only recreation with desktop interactions, sounds, and app windows.`
                        },
                        {
                            id: 'docs-contact-note',
                            name: 'Contact.txt',
                            kind: 'text',
                            icon: iconSet.text,
                            size: '1 KB',
                            modified: formatDate(2026, 2, 19, 10, 21),
                            content: `Email: hello@example.com
GitHub: github.com/Vedang-P
X: x.com/vedangstwt`
                        }
                    ]
                },
                {
                    id: 'docs-pictures',
                    name: 'My Pictures',
                    kind: 'folder',
                    icon: iconSet.pictures,
                    modified: formatDate(2026, 2, 18, 3, 5),
                    children: [
                        {
                            id: 'docs-wallpaper-bliss',
                            name: 'Bliss.jpg',
                            kind: 'image',
                            icon: iconSet.image,
                            size: '1.6 MB',
                            modified: formatDate(2026, 2, 17, 8, 33)
                        },
                        {
                            id: 'docs-redbull-shot',
                            name: 'Redbull Grid.jpg',
                            kind: 'image',
                            icon: iconSet.image,
                            size: '2.1 MB',
                            modified: formatDate(2026, 2, 17, 8, 41)
                        }
                    ]
                },
                {
                    id: 'docs-music',
                    name: 'My Music',
                    kind: 'folder',
                    icon: iconSet.music,
                    modified: formatDate(2026, 2, 18, 4, 19),
                    children: [
                        {
                            id: 'docs-track-1',
                            name: 'Drive at Dusk.url',
                            kind: 'shortcut',
                            icon: iconSet.spotify,
                            size: '1 KB',
                            modified: formatDate(2026, 2, 18, 4, 20),
                            open: { type: 'app', appId: 'spotify' }
                        }
                    ]
                },
                {
                    id: 'docs-resume-link',
                    name: 'Resume.url',
                    kind: 'shortcut',
                    icon: iconSet.ie,
                    size: '1 KB',
                    modified: formatDate(2026, 2, 22, 2, 8),
                    open: { type: 'external', url: 'https://drive.google.com/file/d/11FwOpNWYdeqgq1Qvu_1DWlvqXRDnmrpr/view?usp=sharing' }
                },
                {
                    id: 'docs-github-link',
                    name: 'GitHub.url',
                    kind: 'shortcut',
                    icon: iconSet.ie,
                    size: '1 KB',
                    modified: formatDate(2026, 2, 22, 2, 10),
                    open: { type: 'external', url: 'https://github.com/Vedang-P' }
                },
                {
                    id: 'docs-internet-shortcut',
                    name: 'Internet Explorer.lnk',
                    kind: 'shortcut',
                    icon: iconSet.ie,
                    size: '1 KB',
                    modified: formatDate(2026, 2, 20, 6, 14),
                    open: { type: 'app', appId: 'ie' }
                }
            ]
        };

        let nodeIndex = new Map();
        let folderIndex = new Map();
        const reindex = () => {
            nodeIndex = new Map();
            folderIndex = new Map();

            const visit = (node, parentId = '') => {
                node.parentId = parentId;
                nodeIndex.set(node.id, node);
                if (node.kind === 'folder') {
                    folderIndex.set(node.id, node);
                    (node.children || []).forEach(child => visit(child, node.id));
                }
            };

            visit(rootFolder);
        };
        reindex();

        let currentFolderId = rootFolder.id;
        let selectedItemId = '';
        let searchQuery = '';
        let viewMode = 'details';
        let history = [rootFolder.id];
        let historyIndex = 0;
        let newFolderIndex = 1;

        const getNode = (nodeId) => nodeIndex.get(nodeId) || null;
        const getFolder = (folderId) => folderIndex.get(folderId) || null;
        const getCurrentFolder = () => getFolder(currentFolderId);
        const getSelectedItem = () => getNode(selectedItemId);

        const itemTypeLabel = (item) => {
            if (!item) return '';
            if (item.kind === 'folder') return 'File Folder';
            if (item.kind === 'text') return 'Text Document';
            if (item.kind === 'image') return 'JPEG Image';
            if (item.kind === 'shortcut') return 'Shortcut';
            return 'File';
        };

        const getPath = (folderId) => {
            const parts = [];
            let cursor = getFolder(folderId);

            while (cursor) {
                parts.unshift(cursor.name);
                cursor = cursor.parentId ? getFolder(cursor.parentId) : null;
            }

            return parts.join(' \\ ');
        };

        const getFolderItems = () => {
            const folder = getCurrentFolder();
            if (!folder || !Array.isArray(folder.children)) return [];

            const filtered = folder.children.filter(item => {
                if (!searchQuery) return true;
                return item.name.toLowerCase().includes(searchQuery);
            });

            return filtered.sort((a, b) => {
                const folderBias = Number(b.kind === 'folder') - Number(a.kind === 'folder');
                if (folderBias !== 0) return folderBias;
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            });
        };

        const syncActionStates = () => {
            const currentFolder = getCurrentFolder();
            const hasSelection = Boolean(getSelectedItem());
            const canGoBack = historyIndex > 0;
            const canGoForward = historyIndex < history.length - 1;
            const canGoUp = Boolean(currentFolder && currentFolder.parentId);

            root.querySelectorAll('button[data-docs-action="back"]').forEach(btn => {
                btn.disabled = !canGoBack;
            });
            root.querySelectorAll('button[data-docs-action="forward"]').forEach(btn => {
                btn.disabled = !canGoForward;
            });
            root.querySelectorAll('button[data-docs-action="up"]').forEach(btn => {
                btn.disabled = !canGoUp;
            });
            root.querySelectorAll('button[data-docs-action="open-selected"]').forEach(btn => {
                btn.disabled = !hasSelection;
            });
            root.querySelectorAll('button[data-docs-action="delete"]').forEach(btn => {
                btn.disabled = !hasSelection;
            });
        };

        const renderPlaces = () => {
            const places = [
                { id: rootFolder.id, name: 'My Documents', icon: iconSet.mydocs },
                { id: 'docs-mycomputer', name: 'My Computer', icon: iconSet.mycomputer, appId: 'mycomputer' },
                ...rootFolder.children
                    .filter(item => item.kind === 'folder')
                    .slice(0, 5)
                    .map(item => ({
                        id: item.id,
                        name: item.name,
                        icon: item.icon || iconSet.folder
                    }))
            ];

            placesEl.innerHTML = places.map(place => {
                const isActive = place.id === currentFolderId;
                const placeIdAttr = place.appId ? '' : `data-docs-place-id="${escapeHtml(place.id)}"`;
                const appAttr = place.appId ? `data-docs-open-app="${escapeHtml(place.appId)}"` : '';

                return `
                    <li class="mydocs-place ${isActive ? 'active' : ''}">
                        <button type="button" class="mydocs-place-btn" ${placeIdAttr} ${appAttr}>
                            <img src="${place.icon}" alt="">
                            <span>${escapeHtml(place.name)}</span>
                        </button>
                    </li>
                `;
            }).join('');
        };

        const renderDetailsPanel = () => {
            const selected = getSelectedItem();
            if (!selected) {
                detailsEl.textContent = 'Select a file or folder to see details.';
                return;
            }

            const summary = selected.kind === 'folder'
                ? `${(selected.children || []).length} object(s)`
                : (selected.size || '1 KB');
            const preview = selected.kind === 'text' && selected.content
                ? `<pre>${escapeHtml(selected.content.slice(0, 160))}</pre>`
                : '';

            detailsEl.innerHTML = `
                <div class="mydocs-detail-name">${escapeHtml(selected.name)}</div>
                <div class="mydocs-detail-meta">${itemTypeLabel(selected)}</div>
                <div class="mydocs-detail-meta">${escapeHtml(summary)}</div>
                <div class="mydocs-detail-meta">${escapeHtml(selected.modified || '')}</div>
                ${preview}
            `;
        };

        const renderItems = () => {
            const items = getFolderItems();
            itemsEl.dataset.view = viewMode;
            columnsEl.classList.toggle('hidden', viewMode !== 'details');

            if (!items.length) {
                itemsEl.innerHTML = `
                    <div class="mydocs-empty-state">
                        ${searchQuery ? 'No items match your search.' : 'This folder is empty.'}
                    </div>
                `;
                statusEl.textContent = searchQuery ? '0 objects found' : '0 objects';
                return;
            }

            const rows = items.map(item => {
                const selectedClass = item.id === selectedItemId ? 'selected' : '';
                const icon = item.icon || (item.kind === 'folder' ? iconSet.folder : iconSet.text);
                const size = item.kind === 'folder' ? '' : (item.size || '1 KB');

                if (viewMode === 'list') {
                    return `
                        <div class="mydocs-item mydocs-item-list ${selectedClass}" data-docs-item-id="${escapeHtml(item.id)}">
                            <img class="mydocs-item-icon" src="${icon}" alt="">
                            <span class="mydocs-item-name">${escapeHtml(item.name)}</span>
                        </div>
                    `;
                }

                return `
                    <div class="mydocs-item ${selectedClass}" data-docs-item-id="${escapeHtml(item.id)}">
                        <div class="mydocs-col mydocs-col-name">
                            <img class="mydocs-item-icon" src="${icon}" alt="">
                            <span class="mydocs-item-name">${escapeHtml(item.name)}</span>
                        </div>
                        <div class="mydocs-col mydocs-col-type">${itemTypeLabel(item)}</div>
                        <div class="mydocs-col mydocs-col-size">${escapeHtml(size)}</div>
                        <div class="mydocs-col mydocs-col-modified">${escapeHtml(item.modified || '')}</div>
                    </div>
                `;
            }).join('');

            itemsEl.innerHTML = rows;
            const selected = getSelectedItem();
            statusEl.textContent = `${items.length} object(s)${selected ? `, ${selected.name} selected` : ''}`;
        };

        const renderHeader = () => {
            const current = getCurrentFolder();
            if (!current) return;
            folderTitleEl.textContent = current.name;
            pathEl.textContent = getPath(current.id);
        };

        const renderAll = () => {
            renderHeader();
            renderPlaces();
            renderItems();
            renderDetailsPanel();
            syncActionStates();
        };

        const selectItem = (itemId) => {
            selectedItemId = itemId || '';
            renderAll();
        };

        const navigateToFolder = (folderId, pushHistory = true) => {
            const folder = getFolder(folderId);
            if (!folder) {
                SoundManager.play('stop');
                return;
            }

            currentFolderId = folder.id;
            selectedItemId = '';

            if (pushHistory) {
                history = history.slice(0, historyIndex + 1);
                history.push(folder.id);
                historyIndex = history.length - 1;
            }

            renderAll();
            itemsEl.focus();
        };

        const openTextFile = (item) => {
            if (!item) return;

            this.open('about');

            const syncEditor = (attempt = 0) => {
                const noteWindow = Object.values(this.windows).find(entry => entry.appId === 'about' && !entry.closed);
                if (!noteWindow) {
                    if (attempt < 8) setTimeout(() => syncEditor(attempt + 1), 35);
                    return;
                }

                const editor = noteWindow.el.querySelector('[data-notepad-editor]');
                const title = noteWindow.el.querySelector('.window-title span');
                if (!editor) {
                    if (attempt < 8) setTimeout(() => syncEditor(attempt + 1), 35);
                    return;
                }

                editor.value = item.content || '';
                editor.focus();
                if (title) {
                    title.textContent = `${item.name} - Notepad`;
                }
            };

            syncEditor();
        };

        const openItem = (item) => {
            if (!item) {
                SoundManager.play('stop');
                return;
            }

            if (item.kind === 'folder') {
                navigateToFolder(item.id, true);
                SoundManager.play('open');
                return;
            }

            if (item.open && item.open.type === 'app') {
                this.open(item.open.appId);
                SoundManager.play('open');
                return;
            }

            if (item.open && item.open.type === 'external' && item.open.url) {
                window.location.assign(item.open.url);
                SoundManager.play('open');
                return;
            }

            if (item.kind === 'text') {
                openTextFile(item);
                SoundManager.play('open');
                return;
            }

            if (item.kind === 'image') {
                this.open('paint');
                SoundManager.play('open');
                return;
            }

            SoundManager.play('stop');
        };

        const createFolder = () => {
            const folder = getCurrentFolder();
            if (!folder || !Array.isArray(folder.children)) {
                SoundManager.play('stop');
                return;
            }

            let name = 'New Folder';
            while (folder.children.some(item => item.name.toLowerCase() === name.toLowerCase())) {
                newFolderIndex += 1;
                name = `New Folder (${newFolderIndex})`;
            }

            const newId = `docs-folder-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            folder.children.unshift({
                id: newId,
                name,
                kind: 'folder',
                icon: iconSet.folder,
                modified: new Date().toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                }),
                children: []
            });

            reindex();
            selectedItemId = newId;
            renderAll();
            SoundManager.play('open');
        };

        const deleteSelected = () => {
            const folder = getCurrentFolder();
            if (!folder || !selectedItemId) {
                SoundManager.play('stop');
                return;
            }

            const index = folder.children.findIndex(item => item.id === selectedItemId);
            if (index < 0) {
                SoundManager.play('stop');
                return;
            }

            folder.children.splice(index, 1);
            selectedItemId = '';
            reindex();
            renderAll();
            SoundManager.play('recycle');
        };

        const moveSelection = (direction) => {
            const items = getFolderItems();
            if (!items.length) return;

            let index = items.findIndex(item => item.id === selectedItemId);
            if (index < 0) {
                index = direction > 0 ? -1 : 1;
            }

            index = Math.max(0, Math.min(items.length - 1, index + direction));
            selectedItemId = items[index].id;
            renderAll();
        };

        const handleAction = (action) => {
            if (!action) return;

            if (action === 'back') {
                if (historyIndex > 0) {
                    historyIndex -= 1;
                    navigateToFolder(history[historyIndex], false);
                    SoundManager.play('click');
                } else {
                    SoundManager.play('stop');
                }
                return;
            }

            if (action === 'forward') {
                if (historyIndex < history.length - 1) {
                    historyIndex += 1;
                    navigateToFolder(history[historyIndex], false);
                    SoundManager.play('click');
                } else {
                    SoundManager.play('stop');
                }
                return;
            }

            if (action === 'up') {
                const current = getCurrentFolder();
                if (current && current.parentId) {
                    navigateToFolder(current.parentId, true);
                    SoundManager.play('click');
                } else {
                    SoundManager.play('stop');
                }
                return;
            }

            if (action === 'new-folder') {
                createFolder();
                return;
            }

            if (action === 'delete') {
                deleteSelected();
                return;
            }

            if (action === 'open-selected') {
                openItem(getSelectedItem());
            }
        };

        root.addEventListener('click', (event) => {
            const actionButton = event.target.closest('button[data-docs-action]');
            if (actionButton) {
                event.preventDefault();
                handleAction(actionButton.dataset.docsAction);
                return;
            }

            const placeButton = event.target.closest('button[data-docs-place-id]');
            if (placeButton) {
                event.preventDefault();
                navigateToFolder(placeButton.dataset.docsPlaceId, true);
                SoundManager.play('click');
                return;
            }

            const appButton = event.target.closest('button[data-docs-open-app]');
            if (appButton) {
                event.preventDefault();
                const appId = appButton.dataset.docsOpenApp || '';
                if (appId) {
                    this.open(appId);
                    SoundManager.play('open');
                }
                return;
            }

            const row = event.target.closest('[data-docs-item-id]');
            if (row) {
                const itemId = row.dataset.docsItemId || '';
                selectItem(itemId);
                SoundManager.play('click');
                return;
            }

            if (event.target === itemsEl) {
                selectItem('');
            }
        });

        root.addEventListener('dblclick', (event) => {
            const row = event.target.closest('[data-docs-item-id]');
            if (!row) return;
            const itemId = row.dataset.docsItemId || '';
            if (!itemId) return;
            openItem(getNode(itemId));
        });

        itemsEl.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                moveSelection(1);
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                moveSelection(-1);
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                openItem(getSelectedItem());
                return;
            }

            if (event.key === 'Delete') {
                event.preventDefault();
                deleteSelected();
                return;
            }

            if (event.key === 'Backspace') {
                event.preventDefault();
                handleAction('up');
            }
        });

        itemsEl.addEventListener('mousedown', () => {
            itemsEl.focus();
        });

        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.trim().toLowerCase();
            if (selectedItemId && !getFolderItems().some(item => item.id === selectedItemId)) {
                selectedItemId = '';
            }
            renderAll();
        });

        searchInput.addEventListener('keydown', event => {
            event.stopPropagation();
        });

        viewSelect.addEventListener('change', () => {
            viewMode = viewSelect.value === 'list' ? 'list' : 'details';
            renderAll();
            SoundManager.play('click');
        });

        renderAll();
    },

    initControlPanel(win) {
        const panel = win.querySelector('[data-control-root]');
        if (!panel) return;
        if (panel.dataset.bound === '1') return;
        panel.dataset.bound = '1';

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

            const soundStatus = panel.querySelector('[data-sound-status]');
            if (soundStatus) {
                soundStatus.textContent = SoundManager.isEnabled() ? 'On' : 'Muted';
            }

            const soundVolumeValue = panel.querySelector('[data-sound-volume-value]');
            const volumePercent = Math.round(SoundManager.getMasterVolume() * 100);
            if (soundVolumeValue) {
                soundVolumeValue.textContent = `${volumePercent}%`;
            }

            const volumeSlider = panel.querySelector('[data-sound-volume]');
            if (volumeSlider) {
                const currentValue = String(volumePercent);
                if (volumeSlider.value !== currentValue) {
                    volumeSlider.value = currentValue;
                }
            }
        };

        panel.addEventListener('click', (event) => {
            const themeButton = event.target.closest('[data-theme]');
            if (themeButton) {
                Personalization.applyTheme(themeButton.dataset.theme);
                SoundManager.play('click');
                sync();
                return;
            }

            const wallpaperButton = event.target.closest('[data-wallpaper-key]');
            if (wallpaperButton) {
                const wallpaper = Personalization.getWallpaperByKey(wallpaperButton.dataset.wallpaperKey);
                if (wallpaper) {
                    Personalization.applyWallpaper(wallpaper);
                    SoundManager.play('click');
                    sync();
                }
                return;
            }

            const soundButton = event.target.closest('[data-sound-toggle]');
            if (soundButton) {
                SoundManager.toggle();
                sync();
                return;
            }

            const appButton = event.target.closest('[data-open-app]');
            if (appButton) {
                const appId = appButton.dataset.openApp || '';
                if (appId) {
                    SoundManager.play('click');
                    this.open(appId);
                }
                return;
            }

            const taskButton = event.target.closest('[data-control-action]');
            if (!taskButton) return;

            const action = taskButton.dataset.controlAction || '';
            if (action === 'show-desktop') {
                SoundManager.play('click');
                this.minimizeAll();
            } else if (action === 'reset-icons') {
                SoundManager.play('click');
                this.resetIconsToDefaultPositions();
            } else if (action === 'play-test-sound') {
                SoundManager.play('notify');
            }
        });

        const volumeSlider = panel.querySelector('[data-sound-volume]');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                const volume = Number.parseInt(volumeSlider.value, 10) / 100;
                SoundManager.setMasterVolume(volume);
                sync();
            });
        }

        panel.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const btn = event.target.closest('button');
                if (btn) {
                    event.preventDefault();
                    btn.click();
                }
            }
        });

        sync();
    },

    initPaint(win) {
        const canvas = win.querySelector('.paint-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const statusEl = win.querySelector('[data-paint-status]');
        const primaryChip = win.querySelector('[data-paint-primary-color]');
        const secondaryChip = win.querySelector('[data-paint-secondary-color]');
        const sizeSelect = win.querySelector('[data-paint-size]');
        const toolButtons = Array.from(win.querySelectorAll('[data-paint-tool]'));
        const swatches = Array.from(win.querySelectorAll('.paint-swatch'));
        const actionButtons = Array.from(win.querySelectorAll('[data-paint-action]'));
        if (!ctx) return;

        let drawing = false;
        let activeTool = 'brush';
        let brushSize = sizeSelect ? parseInt(sizeSelect.value, 10) : 4;
        let primaryColor = '#000000';
        let secondaryColor = '#ffffff';
        let strokeColor = primaryColor;

        const setStatus = (message) => {
            if (statusEl) statusEl.textContent = message;
        };

        const resetCanvas = (statusMessage = 'Canvas cleared') => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setStatus(statusMessage);
        };

        const setActiveTool = (tool) => {
            activeTool = tool || 'brush';
            toolButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.paintTool === activeTool);
            });
            setStatus(`Tool: ${activeTool}`);
        };

        const updateColorChips = () => {
            if (primaryChip) primaryChip.style.background = primaryColor;
            if (secondaryChip) secondaryChip.style.background = secondaryColor;
        };

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
            if (event.button !== 0 && event.button !== 2) return;
            event.preventDefault();
            drawing = true;
            const useSecondary = event.button === 2;
            if (activeTool === 'eraser') {
                strokeColor = '#ffffff';
            } else {
                strokeColor = useSecondary ? secondaryColor : primaryColor;
            }
            const point = getCanvasPoint(event);
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            canvas.setPointerCapture(event.pointerId);
            setStatus(`Drawing (${Math.round(point.x)}, ${Math.round(point.y)})`);
        };

        const draw = (event) => {
            const point = getCanvasPoint(event);
            if (!drawing) {
                setStatus(`${activeTool} @ ${Math.round(point.x)}, ${Math.round(point.y)}`);
                return;
            }

            const widthMap = {
                pencil: Math.max(1, Math.floor(brushSize / 2)),
                brush: brushSize,
                eraser: Math.max(4, brushSize * 2),
                line: brushSize,
                rect: brushSize,
                ellipse: brushSize
            };

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = widthMap[activeTool] || brushSize;
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            setStatus(`Drawing (${Math.round(point.x)}, ${Math.round(point.y)})`);
        };

        const stopDraw = (event) => {
            if (!drawing) return;
            drawing = false;
            ctx.closePath();
            if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
                canvas.releasePointerCapture(event.pointerId);
            }
            setStatus(`Tool: ${activeTool}`);
        };

        canvas.addEventListener('contextmenu', event => event.preventDefault());
        canvas.addEventListener('pointerdown', startDraw);
        canvas.addEventListener('pointermove', draw);
        canvas.addEventListener('pointerup', stopDraw);
        canvas.addEventListener('pointercancel', stopDraw);
        canvas.addEventListener('pointerleave', stopDraw);

        swatches.forEach(btn => {
            btn.addEventListener('click', () => {
                swatches.forEach(node => node.classList.remove('active'));
                btn.classList.add('active');
                primaryColor = btn.dataset.color || primaryColor;
                updateColorChips();
                setStatus(`Primary color: ${primaryColor}`);
            });

            btn.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                secondaryColor = btn.dataset.color || secondaryColor;
                updateColorChips();
                setStatus(`Secondary color: ${secondaryColor}`);
            });
        });

        if (sizeSelect) {
            sizeSelect.addEventListener('change', () => {
                brushSize = parseInt(sizeSelect.value, 10);
                setStatus(`Brush size: ${brushSize}px`);
            });
        }

        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                setActiveTool(btn.dataset.paintTool);
            });
        });

        actionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.paintAction;

                if (action === 'new') {
                    resetCanvas('New canvas');
                } else if (action === 'clear') {
                    resetCanvas('Canvas cleared');
                } else if (action === 'save') {
                    const link = document.createElement('a');
                    link.download = 'paint-drawing.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    setStatus('Saved: paint-drawing.png');
                }
                SoundManager.play('click');
            });
        });

        resetCanvas('Ready');
        updateColorChips();
        setActiveTool('brush');
    },

    getYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            return Promise.resolve(window.YT);
        }

        if (this.youtubeApiPromise) {
            return this.youtubeApiPromise;
        }

        this.youtubeApiPromise = new Promise((resolve, reject) => {
            let settled = false;
            let timeoutId = 0;
            let pollId = 0;

            const finishResolve = () => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeoutId);
                window.clearInterval(pollId);
                resolve(window.YT);
            };

            const finishReject = (error) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeoutId);
                window.clearInterval(pollId);
                reject(error);
            };

            const previousReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof previousReady === 'function') {
                    previousReady();
                }
                if (window.YT && window.YT.Player) {
                    finishResolve();
                }
            };

            let script = document.querySelector('script[data-youtube-iframe-api="1"]');
            if (!script) {
                script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                script.async = true;
                script.dataset.youtubeIframeApi = '1';
                document.head.appendChild(script);
            }

            script.addEventListener('error', () => {
                finishReject(new Error('Failed to load YouTube player API.'));
            }, { once: true });

            pollId = window.setInterval(() => {
                if (window.YT && window.YT.Player) {
                    finishResolve();
                }
            }, 120);

            timeoutId = window.setTimeout(() => {
                finishReject(new Error('Timed out while loading YouTube player API.'));
            }, 12000);
        }).catch((error) => {
            this.youtubeApiPromise = null;
            throw error;
        });

        return this.youtubeApiPromise;
    },

    initSpotify(win) {
        const root = win.querySelector('[data-spotify-app]');
        if (!root) return;

        const app = AppsRegistry.getApp('spotify');
        if (!app || !Array.isArray(app.tracks) || !app.tracks.length) return;
        const playerHost = root.querySelector('[data-spotify-player]');
        const searchForm = root.querySelector('[data-spotify-search-form]');
        const searchInput = root.querySelector('[data-spotify-search-input]');
        const trackListEl = root.querySelector('[data-spotify-track-list]');
        const recentListEl = root.querySelector('[data-spotify-recent-list]');
        const progress = root.querySelector('[data-spotify-progress]');
        const currentTimeEl = root.querySelector('[data-spotify-current]');
        const durationEl = root.querySelector('[data-spotify-duration]');
        const statusEl = root.querySelector('[data-spotify-status]');
        const nowTitleEl = root.querySelector('[data-spotify-now-title]');
        const nowArtistEl = root.querySelector('[data-spotify-now-artist]');
        const volumeSlider = root.querySelector('[data-spotify-volume]');
        const searchBtn = root.querySelector('.spotify-search-btn');
        const progressRow = root.querySelector('.spotify-progress-row');
        const controlsRow = root.querySelector('.spotify-controls');
        const volumeRow = root.querySelector('.spotify-volume-row');
        const playBtn = root.querySelector('[data-spotify-action="play"]');
        const shuffleBtn = root.querySelector('[data-spotify-action="shuffle"]');
        const repeatBtn = root.querySelector('[data-spotify-action="repeat"]');

        if (
            !playerHost ||
            !searchForm ||
            !searchInput ||
            !trackListEl ||
            !recentListEl ||
            !progress ||
            !currentTimeEl ||
            !durationEl ||
            !statusEl ||
            !nowTitleEl ||
            !nowArtistEl ||
            !volumeSlider ||
            !playBtn
        ) {
            return;
        }

        if (typeof win.__spotifyCleanup === 'function') {
            win.__spotifyCleanup();
        }

        const escapeHtml = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        const formatTime = (seconds) => {
            if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
            const total = Math.floor(seconds);
            const mins = Math.floor(total / 60);
            const secs = total % 60;
            return `${mins}:${String(secs).padStart(2, '0')}`;
        };

        const tracks = app.tracks.map((track) => ({
            title: track.title || 'Unknown Title',
            artist: track.artist || 'Unknown Artist',
            videoId: track.videoId || '',
            query: track.query || `${track.title || ''} ${track.artist || ''}`.trim()
        }));

        let currentIndex = 0;
        let shuffle = false;
        let repeat = false;
        let mode = 'quick';
        let recentSearches = [];
        let player = null;
        let progressTimer = 0;
        let seeking = false;
        let destroyed = false;
        const MAX_BLOCK_RETRIES = 8;
        let quickBlockStreak = 0;
        let activeSource = {
            type: 'quick',
            query: tracks[0]?.query || '',
            retries: 0,
            searchFallbackAttempted: false
        };

        const setStatus = (text) => {
            statusEl.textContent = text;
        };

        const setNowPlaying = (title, artist = '') => {
            nowTitleEl.textContent = title || 'Not Playing';
            nowArtistEl.textContent = artist || '';
        };

        const getPlayerState = () => {
            if (!player || typeof player.getPlayerState !== 'function') return -1;
            try {
                return player.getPlayerState();
            } catch (error) {
                return -1;
            }
        };

        const syncPlayButton = () => {
            const ytState = window.YT?.PlayerState;
            playBtn.textContent = getPlayerState() === ytState?.PLAYING ? 'Pause' : 'Play';
        };

        const syncToggleButtons = () => {
            if (shuffleBtn) {
                shuffleBtn.textContent = shuffle ? 'Shuffle On' : 'Shuffle Off';
                shuffleBtn.classList.toggle('active', shuffle);
            }
            if (repeatBtn) {
                repeatBtn.textContent = repeat ? 'Repeat On' : 'Repeat Off';
                repeatBtn.classList.toggle('active', repeat);
            }
        };

        const setTrackSelection = (index) => {
            trackListEl.querySelectorAll('[data-spotify-track-index]').forEach((button) => {
                const buttonIndex = Number.parseInt(button.dataset.spotifyTrackIndex, 10);
                button.classList.toggle('active', Number.isFinite(buttonIndex) && buttonIndex === index);
            });
        };

        const renderTrackList = () => {
            trackListEl.innerHTML = tracks.map((track, index) => `
                <button
                    type="button"
                    class="spotify-track-btn ${index === currentIndex && mode === 'quick' ? 'active' : ''}"
                    data-spotify-track-index="${index}"
                    title="${escapeHtml(`${track.title} - ${track.artist}`)}"
                >
                    <span class="spotify-track-title">${escapeHtml(track.title)}</span>
                    <span class="spotify-track-artist">${escapeHtml(track.artist)}</span>
                </button>
            `).join('');
        };

        const renderRecentSearches = () => {
            if (!recentSearches.length) {
                recentListEl.innerHTML = '<div class="spotify-empty-text">No recent searches.</div>';
                return;
            }

            recentListEl.innerHTML = recentSearches.map((query) => `
                <button type="button" class="spotify-recent-btn" data-spotify-search-query="${escapeHtml(query)}">
                    ${escapeHtml(query)}
                </button>
            `).join('');
        };

        const addRecentSearch = (query) => {
            const clean = query.trim();
            if (!clean) return;
            recentSearches = [clean, ...recentSearches.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
            renderRecentSearches();
        };

        const isMobileSpotify = window.matchMedia('(max-width: 980px)').matches ||
            (window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 1100);

        if (isMobileSpotify) {
            root.classList.add('spotify-mobile-mode');

            const mobileFrame = document.createElement('iframe');
            mobileFrame.className = 'spotify-mobile-frame';
            mobileFrame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
            mobileFrame.setAttribute('allowfullscreen', '');
            mobileFrame.setAttribute('loading', 'lazy');
            mobileFrame.setAttribute('title', 'Spotify Mobile Player');
            playerHost.textContent = '';
            playerHost.appendChild(mobileFrame);

            const makeVideoUrl = (videoId, autoplay = true) => (
                `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=${autoplay ? '1' : '0'}&rel=0&modestbranding=1&playsinline=1`
            );
            const makeSearchUrl = (query, autoplay = true) => (
                `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=${autoplay ? '1' : '0'}&rel=0&modestbranding=1&playsinline=1`
            );
            const navigateFrame = (url, statusText) => {
                mobileFrame.src = url;
                setStatus(statusText);
            };
            const playMobileTrack = (index, autoplay = true) => {
                currentIndex = (index + tracks.length) % tracks.length;
                setTrackSelection(currentIndex);
                const track = tracks[currentIndex];
                setNowPlaying(track.title, track.artist);
                const url = track.videoId ? makeVideoUrl(track.videoId, autoplay) : makeSearchUrl(track.query, autoplay);
                navigateFrame(url, `Loaded: ${track.title}`);
            };
            const runMobileSearch = (rawQuery) => {
                const query = rawQuery.trim();
                if (!query) {
                    setStatus('Type a song or artist, then press Play.');
                    SoundManager.play('stop');
                    return;
                }
                mode = 'search';
                setTrackSelection(-1);
                setNowPlaying(query, 'Search Results');
                addRecentSearch(query);
                navigateFrame(makeSearchUrl(query, true), `Searching: ${query}...`);
            };
            const submitSearch = () => {
                runMobileSearch(searchInput.value);
            };

            renderTrackList();
            renderRecentSearches();
            setTrackSelection(0);
            setNowPlaying(tracks[0].title, tracks[0].artist);
            playMobileTrack(0, false);
            setStatus('Mobile mode active. Use search or quick picks.');

            trackListEl.addEventListener('click', (event) => {
                const button = event.target.closest('[data-spotify-track-index]');
                if (!button) return;
                const index = Number.parseInt(button.dataset.spotifyTrackIndex, 10);
                if (!Number.isFinite(index)) return;
                mode = 'quick';
                playMobileTrack(index, true);
                SoundManager.play('click');
            });

            searchForm.addEventListener('submit', (event) => {
                event.preventDefault();
                submitSearch();
                SoundManager.play('click');
            });

            if (searchBtn) {
                searchBtn.addEventListener('touchend', (event) => {
                    event.preventDefault();
                    submitSearch();
                    SoundManager.play('click');
                }, { passive: false });
            }

            recentListEl.addEventListener('click', (event) => {
                const button = event.target.closest('[data-spotify-search-query]');
                if (!button) return;
                const query = button.dataset.spotifySearchQuery || '';
                if (!query) return;
                searchInput.value = query;
                submitSearch();
                SoundManager.play('click');
            });

            if (progressRow) progressRow.style.display = 'none';
            if (controlsRow) controlsRow.style.display = 'none';
            if (volumeRow) volumeRow.style.display = 'none';

            const cleanup = () => {
                if (destroyed) return;
                destroyed = true;
                mobileFrame.src = 'about:blank';
                win.__spotifyCleanup = null;
            };
            win.__spotifyCleanup = cleanup;
            return;
        }

        const syncVideoMeta = () => {
            if (!player || mode !== 'search') return;

            let data = null;
            try {
                data = player.getVideoData();
            } catch (error) {
                data = null;
            }

            const title = data?.title?.trim();
            if (!title) return;
            setNowPlaying(title, data?.author?.trim() || 'YouTube');
        };

        const syncProgress = () => {
            if (!player || seeking) return;

            let current = 0;
            let duration = 0;

            try {
                current = Number(player.getCurrentTime()) || 0;
                duration = Number(player.getDuration()) || 0;
            } catch (error) {
                current = 0;
                duration = 0;
            }

            const progressValue = duration > 0 ? (current / duration) * 100 : 0;
            progress.value = String(Math.max(0, Math.min(100, progressValue)));
            currentTimeEl.textContent = formatTime(current);
            durationEl.textContent = formatTime(duration);
            syncVideoMeta();
        };

        const stopProgressTimer = () => {
            if (progressTimer) {
                window.clearInterval(progressTimer);
                progressTimer = 0;
            }
        };

        const startProgressTimer = () => {
            stopProgressTimer();
            progressTimer = window.setInterval(syncProgress, 250);
        };

        const loadTrackAt = (index, autoplay = true) => {
            if (!player || !tracks.length) return;

            currentIndex = (index + tracks.length) % tracks.length;
            mode = 'quick';
            setTrackSelection(currentIndex);

            const track = tracks[currentIndex];
            activeSource = {
                type: 'quick',
                query: track.query || `${track.title} ${track.artist}`,
                retries: 0,
                searchFallbackAttempted: false
            };
            setNowPlaying(track.title, track.artist);
            setStatus(`Loading: ${track.title} - ${track.artist}`);

            try {
                if (track.videoId) {
                    if (autoplay) {
                        player.loadVideoById(track.videoId);
                    } else {
                        player.cueVideoById(track.videoId);
                    }
                } else {
                    const payload = { listType: 'search', list: track.query, index: 0 };
                    if (autoplay) {
                        player.loadPlaylist(payload);
                    } else {
                        player.cuePlaylist(payload);
                    }
                }
            } catch (error) {
                setStatus(`Could not load ${track.title}.`);
                SoundManager.play('error');
            }
        };

        const playNext = () => {
            if (!player) return;

            if (mode === 'search') {
                player.nextVideo();
                setStatus('Skipping forward...');
                return;
            }

            if (shuffle && tracks.length > 1) {
                let nextIndex = currentIndex;
                while (nextIndex === currentIndex) {
                    nextIndex = Math.floor(Math.random() * tracks.length);
                }
                loadTrackAt(nextIndex, true);
                return;
            }

            loadTrackAt(currentIndex + 1, true);
        };

        const playPrev = () => {
            if (!player) return;

            let currentTime = 0;
            try {
                currentTime = Number(player.getCurrentTime()) || 0;
            } catch (error) {
                currentTime = 0;
            }

            if (mode === 'search') {
                if (currentTime > 3) {
                    player.seekTo(0, true);
                } else {
                    player.previousVideo();
                }
                return;
            }

            if (currentTime > 3) {
                player.seekTo(0, true);
                return;
            }

            loadTrackAt(currentIndex - 1, true);
        };

        const runSearch = (rawQuery) => {
            const query = rawQuery.trim();
            if (!query) {
                setStatus('Type a song or artist, then press Play.');
                SoundManager.play('stop');
                return;
            }

            if (!player) {
                setStatus('Player is still loading...');
                return;
            }

            mode = 'search';
            setTrackSelection(-1);
            setNowPlaying(query, 'Search Results');
            setStatus(`Searching: ${query}...`);
            addRecentSearch(query);
            activeSource = {
                type: 'search',
                query,
                retries: 0,
                searchFallbackAttempted: true
            };

            try {
                player.loadPlaylist({ listType: 'search', list: query, index: 0 });
            } catch (error) {
                setStatus('Search failed. Try another query.');
                SoundManager.play('error');
            }
        };

        trackListEl.addEventListener('click', (event) => {
            const button = event.target.closest('[data-spotify-track-index]');
            if (!button) return;

            const index = Number.parseInt(button.dataset.spotifyTrackIndex, 10);
            if (!Number.isFinite(index)) return;
            loadTrackAt(index, true);
        });

        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            runSearch(searchInput.value);
        });

        if (searchBtn) {
            searchBtn.addEventListener('touchend', (event) => {
                event.preventDefault();
                runSearch(searchInput.value);
            }, { passive: false });
        }

        recentListEl.addEventListener('click', (event) => {
            const button = event.target.closest('[data-spotify-search-query]');
            if (!button) return;
            const query = button.dataset.spotifySearchQuery || '';
            if (!query) return;
            searchInput.value = query;
            runSearch(query);
        });

        root.querySelectorAll('[data-spotify-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.dataset.spotifyAction;

                if (!player && action !== 'shuffle' && action !== 'repeat') {
                    setStatus('Player is still loading...');
                    return;
                }

                if (action === 'play') {
                    const state = getPlayerState();
                    const ytState = window.YT?.PlayerState;

                    if (state === ytState?.PLAYING) {
                        player.pauseVideo();
                    } else if (state === ytState?.UNSTARTED || state === ytState?.CUED) {
                        if (mode === 'quick') {
                            loadTrackAt(currentIndex, true);
                        } else {
                            player.playVideo();
                        }
                    } else {
                        player.playVideo();
                    }
                } else if (action === 'next') {
                    playNext();
                } else if (action === 'prev') {
                    playPrev();
                } else if (action === 'shuffle') {
                    shuffle = !shuffle;
                    syncToggleButtons();
                } else if (action === 'repeat') {
                    repeat = !repeat;
                    syncToggleButtons();
                }

                SoundManager.play('click');
            });
        });

        progress.addEventListener('input', () => {
            if (!player) return;
            seeking = true;

            let duration = 0;
            try {
                duration = Number(player.getDuration()) || 0;
            } catch (error) {
                duration = 0;
            }

            const percent = Number.parseFloat(progress.value);
            const target = duration > 0 && Number.isFinite(percent) ? (percent / 100) * duration : 0;
            currentTimeEl.textContent = formatTime(target);
            durationEl.textContent = formatTime(duration);
        });

        progress.addEventListener('change', () => {
            if (!player) return;

            let duration = 0;
            try {
                duration = Number(player.getDuration()) || 0;
            } catch (error) {
                duration = 0;
            }

            const percent = Number.parseFloat(progress.value);
            const target = duration > 0 && Number.isFinite(percent) ? (percent / 100) * duration : 0;
            player.seekTo(target, true);
            seeking = false;
            syncProgress();
        });

        progress.addEventListener('pointerup', () => {
            if (!seeking) return;
            progress.dispatchEvent(new Event('change'));
        });

        volumeSlider.addEventListener('input', () => {
            const volume = Number.parseInt(volumeSlider.value, 10);
            const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) : 85;
            if (player) {
                player.setVolume(safeVolume);
            }
            setStatus(`Volume: ${safeVolume}%`);
        });

        const cleanup = () => {
            if (destroyed) return;
            destroyed = true;
            stopProgressTimer();
            if (player && typeof player.destroy === 'function') {
                player.destroy();
            }
            win.__spotifyCleanup = null;
        };

        win.__spotifyCleanup = cleanup;

        renderTrackList();
        renderRecentSearches();
        syncToggleButtons();
        syncPlayButton();
        setTrackSelection(currentIndex);
        setNowPlaying(tracks[0].title, tracks[0].artist);
        setStatus('Loading Spotify player...');

        this.getYouTubeAPI()
            .then((YT) => {
                if (destroyed) return;

                const playerId = `spotify-player-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                playerHost.id = playerId;

                player = new YT.Player(playerId, {
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        origin: window.location.origin
                    },
                    events: {
                        onReady: () => {
                            if (destroyed) return;

                            const volume = Number.parseInt(volumeSlider.value, 10);
                            player.setVolume(Number.isFinite(volume) ? volume : 85);
                            setStatus('Ready. Choose a song or search above.');
                            loadTrackAt(0, false);
                            syncPlayButton();
                            startProgressTimer();
                        },
                        onStateChange: (event) => {
                            if (destroyed) return;
                            syncPlayButton();
                            syncProgress();

                            const ytState = YT.PlayerState;
                            if (event.data === ytState.PLAYING) {
                                quickBlockStreak = 0;
                                activeSource.retries = 0;
                                syncVideoMeta();
                                setStatus(`Playing: ${nowTitleEl.textContent}`);
                                return;
                            }

                            if (event.data === ytState.PAUSED) {
                                setStatus('Paused');
                                return;
                            }

                            if (event.data === ytState.BUFFERING) {
                                setStatus('Buffering...');
                                return;
                            }

                            if (event.data === ytState.ENDED) {
                                if (repeat) {
                                    player.seekTo(0, true);
                                    player.playVideo();
                                    return;
                                }
                                playNext();
                            }
                        },
                        onError: (event) => {
                            const errorCode = Number(event?.data);

                            if (
                                activeSource.type === 'search' &&
                                activeSource.retries < MAX_BLOCK_RETRIES
                            ) {
                                activeSource.retries += 1;
                                const retryNum = activeSource.retries;
                                setStatus(`Track blocked (${errorCode || '?'}) - trying result ${retryNum}/${MAX_BLOCK_RETRIES}...`);
                                window.setTimeout(() => {
                                    if (destroyed || !player) return;
                                    try {
                                        player.nextVideo();
                                    } catch (error) {
                                        setStatus('Could not move to next result.');
                                    }
                                }, 250);
                                return;
                            }

                            if (activeSource.type === 'quick') {
                                quickBlockStreak += 1;
                                if (quickBlockStreak < tracks.length) {
                                    setStatus(`Track blocked (${errorCode || '?'}). Trying next quick pick...`);
                                    window.setTimeout(() => {
                                        if (destroyed || !player) return;
                                        playNext();
                                    }, 250);
                                    return;
                                }

                                if (!activeSource.searchFallbackAttempted && activeSource.query) {
                                    quickBlockStreak = 0;
                                    activeSource.type = 'search';
                                    activeSource.retries = 0;
                                    activeSource.searchFallbackAttempted = true;
                                    mode = 'search';
                                    setTrackSelection(-1);
                                    setStatus('Quick picks blocked. Trying alternate uploads...');
                                    try {
                                        player.loadPlaylist({ listType: 'search', list: activeSource.query, index: 0 });
                                        return;
                                    } catch (error) {
                                        // fall through to final status
                                    }
                                }

                                quickBlockStreak = 0;
                                setStatus('Quick picks are blocked in this region/browser. Use Open in Browser or search.');
                            } else {
                                setStatus('Could not find a playable embed for this search. Try another query.');
                            }
                            SoundManager.play('error');
                        }
                    }
                });
            })
            .catch(() => {
                if (destroyed) return;
                setStatus('Unable to load Spotify player. Check network and try again.');
                SoundManager.play('error');
            });
    },

    initRecycleBin(win) {
        const root = win.querySelector('[data-recycle-root]');
        if (!root) return;

        if (root.dataset.bound !== '1') {
            root.dataset.bound = '1';

            root.addEventListener('click', (event) => {
                const actionButton = event.target.closest('[data-recycle-action]');
                if (actionButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    const action = actionButton.dataset.recycleAction;
                    const actionAppId = actionButton.dataset.appId || '';
                    const selectedAppId = root.dataset.selectedAppId || '';

                    if (action === 'restore-selected') {
                        if (!selectedAppId || !this.restoreRecycleItem(selectedAppId)) {
                            SoundManager.play('stop');
                        }
                    } else if (action === 'restore-one') {
                        if (!actionAppId || !this.restoreRecycleItem(actionAppId)) {
                            SoundManager.play('stop');
                        }
                    } else if (action === 'restore-all') {
                        this.restoreAllRecycleItems();
                    } else if (action === 'empty') {
                        this.emptyRecycleBin();
                    }
                    return;
                }

                const row = event.target.closest('.recycle-item');
                if (!row) return;
                root.dataset.selectedAppId = row.dataset.appId || '';
                this.renderRecycleBinContents(win);
                SoundManager.play('click');
            });

            root.addEventListener('dblclick', (event) => {
                const row = event.target.closest('.recycle-item');
                if (!row) return;
                const appId = row.dataset.appId || '';
                if (!appId || !this.restoreRecycleItem(appId)) {
                    SoundManager.play('stop');
                }
            });
        }

        this.renderRecycleBinContents(win);
    },

    renderRecycleBinContents(winOrElement) {
        const winEl = winOrElement && winOrElement.el ? winOrElement.el : winOrElement;
        if (!winEl) return;

        const root = winEl.querySelector('[data-recycle-root]');
        if (!root) return;

        const items = [...this.recycledDesktopItems].sort((a, b) => b.deletedAt - a.deletedAt);
        let selectedAppId = root.dataset.selectedAppId || '';

        if (!items.length) {
            selectedAppId = '';
        } else if (!items.some(item => item.appId === selectedAppId)) {
            selectedAppId = items[0].appId;
        }

        root.dataset.selectedAppId = selectedAppId;

        if (!items.length) {
            root.innerHTML = `
                <div class="recycle-toolbar">
                    <button type="button" class="recycle-action-btn" data-recycle-action="restore-selected" disabled>Restore</button>
                    <button type="button" class="recycle-action-btn" data-recycle-action="restore-all" disabled>Restore All</button>
                    <button type="button" class="recycle-action-btn" data-recycle-action="empty" disabled>Empty Recycle Bin</button>
                </div>
                <div class="recycle-empty">
                    <img src="${AppsRegistry.apps.recycle.icon}" alt="">
                    <span>Recycle Bin is empty.</span>
                </div>
            `;
            return;
        }

        const rows = items.map(item => `
            <div class="recycle-item ${item.appId === selectedAppId ? 'selected' : ''}" data-app-id="${item.appId}">
                <img class="recycle-item-icon" src="${item.icon}" alt="">
                <div class="recycle-item-meta">
                    <div class="recycle-item-name">${item.name}</div>
                    <div class="recycle-item-sub">Deleted ${new Date(item.deletedAt).toLocaleString()}</div>
                </div>
                <button type="button" class="recycle-item-restore" data-recycle-action="restore-one" data-app-id="${item.appId}">
                    Restore
                </button>
            </div>
        `).join('');

        root.innerHTML = `
            <div class="recycle-toolbar">
                <button type="button" class="recycle-action-btn" data-recycle-action="restore-selected">Restore</button>
                <button type="button" class="recycle-action-btn" data-recycle-action="restore-all">Restore All</button>
                <button type="button" class="recycle-action-btn" data-recycle-action="empty">Empty Recycle Bin</button>
            </div>
            <div class="recycle-list">${rows}</div>
        `;
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

    initContact(win) {
        const links = win.querySelectorAll('.contact-link');
        if (!links.length) return;

        links.forEach(link => {
            link.addEventListener('click', () => {
                SoundManager.play('click');
            });
        });
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

        if (typeof win.el.__spotifyCleanup === 'function') {
            win.el.__spotifyCleanup();
        }

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
