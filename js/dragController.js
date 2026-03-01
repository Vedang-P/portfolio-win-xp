const DragController = {
    dragging: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,

    init() {
        document.addEventListener('pointermove', e => this.onMove(e));
        document.addEventListener('pointerup', e => this.onUp(e));
        document.addEventListener('pointercancel', e => this.onUp(e));
    },

    start(el, e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('.window-btn')) return;
        this.dragging = el;
        this.pointerId = typeof e.pointerId === 'number' ? e.pointerId : null;
        const rect = el.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;
        el.style.transition = 'none';
        if (this.pointerId !== null && typeof el.setPointerCapture === 'function') {
            try {
                el.setPointerCapture(this.pointerId);
            } catch (error) {
                // Ignore capture failures from unsupported pointer sources.
            }
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        document.body.style.cursor = 'move';
    },

    onMove(e) {
        if (!this.dragging) return;
        if (this.pointerId !== null && typeof e.pointerId === 'number' && e.pointerId !== this.pointerId) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        const desktop = document.getElementById('desktop');
        const container = desktop.getBoundingClientRect();
        let x = e.clientX - container.left - this.offsetX;
        let y = e.clientY - container.top - this.offsetY;
        const rect = this.dragging.getBoundingClientRect();
        x = Math.max(0, Math.min(x, container.width - rect.width));
        y = Math.max(0, Math.min(y, container.height - rect.height));
        this.dragging.style.left = x + 'px';
        this.dragging.style.top = y + 'px';
    },

    onUp(e) {
        if (this.dragging) {
            if (this.pointerId !== null && typeof e?.pointerId === 'number' && e.pointerId !== this.pointerId) {
                return;
            }
            const winId = this.dragging.dataset.windowId;
            const win = WindowManager.windows[winId];
            if (win) {
                win.x = parseInt(this.dragging.style.left);
                win.y = parseInt(this.dragging.style.top);
            }
            if (
                this.pointerId !== null &&
                typeof this.dragging.releasePointerCapture === 'function' &&
                this.dragging.hasPointerCapture?.(this.pointerId)
            ) {
                try {
                    this.dragging.releasePointerCapture(this.pointerId);
                } catch (error) {
                    // Ignore capture release failures.
                }
            }
            this.dragging.style.transition = '';
            document.body.style.cursor = '';
            this.dragging = null;
            this.pointerId = null;
        }
    }
};
