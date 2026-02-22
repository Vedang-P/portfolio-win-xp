const Clock = {
    viewYear: null,
    viewMonth: null,

    formatTime(date, includeSeconds = false) {
        const h = date.getHours();
        const m = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = (h % 12) || 12;
        return includeSeconds ? `${hr}:${m}:${seconds} ${ampm}` : `${hr}:${m} ${ampm}`;
    },

    init() {
        this.clockEl = document.getElementById('clock');
        this.popupEl = document.getElementById('clock-popup');
        this.popupTimeEl = document.getElementById('clock-popup-time');
        this.popupDateEl = document.getElementById('clock-popup-date');
        this.monthLabelEl = document.getElementById('calendar-month-label');
        this.gridEl = document.getElementById('calendar-grid');
        this.prevBtn = document.getElementById('calendar-prev');
        this.nextBtn = document.getElementById('calendar-next');

        if (!this.clockEl || !this.popupEl) return;

        const now = new Date();
        this.viewYear = now.getFullYear();
        this.viewMonth = now.getMonth();

        this.clockEl.addEventListener('click', (event) => {
            event.stopPropagation();
            this.togglePopup();
        });

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.shiftMonth(-1);
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.shiftMonth(1);
            });
        }

        document.addEventListener('click', (event) => {
            if (!this.popupEl.classList.contains('visible')) return;
            if (this.popupEl.contains(event.target)) return;
            if (event.target === this.clockEl) return;
            this.hidePopup();
        });

        this.update();
        setInterval(() => this.update(), 1000);
    },

    update() {
        const now = new Date();
        this.clockEl.textContent = this.formatTime(now);

        if (this.popupEl.classList.contains('visible')) {
            this.popupTimeEl.textContent = this.formatTime(now, true);
            this.popupDateEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
    },

    togglePopup() {
        if (!this.popupEl) return;
        if (this.popupEl.classList.contains('visible')) {
            this.hidePopup();
            return;
        }

        this.showPopup();
    },

    showPopup() {
        if (!this.popupEl) return;
        const now = new Date();
        this.popupTimeEl.textContent = this.formatTime(now, true);
        this.popupDateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        this.renderCalendar();
        this.popupEl.classList.remove('hidden');
        this.popupEl.classList.add('visible');

        const clockRect = this.clockEl.getBoundingClientRect();
        const popupRect = this.popupEl.getBoundingClientRect();
        const left = Math.max(8, Math.min(clockRect.right - popupRect.width, window.innerWidth - popupRect.width - 8));
        const top = Math.max(8, clockRect.top - popupRect.height - 6);

        this.popupEl.style.left = `${left}px`;
        this.popupEl.style.top = `${top}px`;
    },

    hidePopup() {
        if (!this.popupEl) return;
        this.popupEl.classList.remove('visible');
        this.popupEl.classList.add('hidden');
    },

    shiftMonth(delta) {
        this.viewMonth += delta;

        if (this.viewMonth > 11) {
            this.viewMonth = 0;
            this.viewYear += 1;
        } else if (this.viewMonth < 0) {
            this.viewMonth = 11;
            this.viewYear -= 1;
        }

        this.renderCalendar();
    },

    renderCalendar() {
        if (!this.monthLabelEl || !this.gridEl) return;
        const monthDate = new Date(this.viewYear, this.viewMonth, 1);
        this.monthLabelEl.textContent = monthDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
        const firstDay = monthDate.getDay();
        const today = new Date();

        const cells = [];
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        weekdays.forEach(day => {
            cells.push(`<div class="calendar-weekday">${day}</div>`);
        });

        for (let i = 0; i < firstDay; i += 1) {
            cells.push('<div class="calendar-day muted"></div>');
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const isToday =
                day === today.getDate() &&
                this.viewMonth === today.getMonth() &&
                this.viewYear === today.getFullYear();

            cells.push(`<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`);
        }

        this.gridEl.innerHTML = cells.join('');
    }
};
