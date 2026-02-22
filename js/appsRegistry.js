const AppsRegistry = {
    profile: {
        displayName: 'Vedang',
        role: 'Frontend Engineer',
        location: 'United States',
        summary: `I build nostalgic, fast, and thoughtful web products.
This portfolio runs as a Windows XP inspired desktop shell with custom interactions, retro visuals, and personal projects.`,
        skills: [
            'HTML, CSS, JavaScript (ES6+)',
            'React and TypeScript',
            'Design Systems and Accessibility',
            'Performance and Web Vitals',
            'Node.js and API Integration'
        ],
        resume: {
            title: 'Resume.txt',
            content: `VEDANG
Frontend Engineer

Experience
- Built and shipped responsive web applications with modern frontend stacks.
- Led UI polish and component architecture across product surfaces.
- Collaborated closely with design and backend teams.

Highlights
- Strong focus on interaction quality and performance.
- Passion for retro interfaces and modern usability.

Education
- B.S. in Computer Science

Open the Contact app for direct links.`
        },
        projects: [
            {
                name: 'XP Portfolio Desktop',
                desc: 'Interactive Windows XP style personal site.',
                stack: 'HTML, CSS, JavaScript',
                link: ''
            },
            {
                name: 'Realtime Chat Client',
                desc: 'Socket based messaging experience with presence.',
                stack: 'React, Node.js, Socket.IO',
                link: 'https://github.com'
            },
            {
                name: 'Storefront UI',
                desc: 'Conversion focused e-commerce frontend.',
                stack: 'React, TypeScript',
                link: 'https://github.com'
            },
            {
                name: 'Visual Analytics Dashboard',
                desc: 'Data-heavy dashboard with custom charts.',
                stack: 'Vue, D3',
                link: 'https://github.com'
            }
        ],
        contacts: [
            { label: 'Email', value: 'vedangpandeyy@gmail.com', link: 'mailto:vedangpandeyy@gmail.com' },
            { label: 'GitHub', value: 'github.com/vedang-p', link: 'https://github.com/vedang-p' },
            { label: 'LinkedIn', value: 'linkedin.com/in/vedangpandey', link: 'https://www.linkedin.com/in/vedangpandey/' }
        ]
    },

    apps: {
        about: {
            id: 'about',
            name: 'Notepad',
            icon: 'assets/icons/Windows XP Icons/0199 - Notepad.ico',
            width: 620,
            height: 450
        },
        projects: {
            id: 'projects',
            name: 'Projects',
            icon: 'assets/icons/Windows XP Icons/0001 - Closed Folder.ico',
            width: 640,
            height: 460,
            externalUrl: 'https://github.com/Vedang-P?tab=repositories'
        },
        skills: {
            id: 'skills',
            name: 'Skills',
            icon: 'assets/icons/Windows XP Icons/0100 - Utilities.ico',
            width: 560,
            height: 400,
            externalUrl: 'https://github.com/Vedang-P'
        },
        resume: {
            id: 'resume',
            name: 'Resume',
            icon: 'assets/icons/Windows XP Icons/0115 - Word Doc.ico',
            width: 600,
            height: 450,
            externalUrl: 'https://x.com/vedangstwt'
        },
        contact: {
            id: 'contact',
            name: 'Contact',
            icon: 'assets/icons/Windows XP Icons/0156 - Alt Email.ico',
            width: 560,
            height: 430
        },
        control: {
            id: 'control',
            name: 'Control Panel',
            icon: 'assets/icons/Windows XP Icons/0015 - Control Panel.ico',
            width: 820,
            height: 560
        },
        paint: {
            id: 'paint',
            name: 'Paint',
            icon: 'assets/icons/Windows XP Icons/0071 - Microsoft Paint.ico',
            width: 780,
            height: 560,
            isPaint: true
        },
        mydocs: {
            id: 'mydocs',
            name: 'My Documents',
            icon: 'assets/icons/Windows XP Icons/0002 - My Documents.ico',
            width: 920,
            height: 620
        },
        mycomputer: {
            id: 'mycomputer',
            name: 'My Computer',
            icon: 'assets/icons/Windows XP Icons/0018 - My Computer.ico',
            width: 980,
            height: 680
        },
        recycle: {
            id: 'recycle',
            name: 'Recycle Bin',
            icon: 'assets/icons/Windows XP Icons/0020 - Recycle Bin Empty.ico',
            width: 440,
            height: 340
        },
        ie: {
            id: 'ie',
            name: 'Internet Explorer',
            icon: 'assets/icons/Windows XP Icons/0081 - Internet Explorer.ico',
            width: 860,
            height: 560,
            homepage: 'https://www.google.com/webhp?igu=1'
        },
        spotify: {
            id: 'spotify',
            name: 'Spotify',
            icon: 'assets/icons/spotify.svg',
            width: 900,
            height: 620,
            openUrl: 'https://open.spotify.com',
            tracks: [
                {
                    title: 'Drive at Dusk',
                    artist: 'SoundHelix',
                    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
                },
                {
                    title: 'Night Run',
                    artist: 'SoundHelix',
                    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
                },
                {
                    title: 'Luna Blue',
                    artist: 'SoundHelix',
                    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
                },
                {
                    title: 'Desktop Dreams',
                    artist: 'SoundHelix',
                    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
                }
            ]
        },
        mpc: {
            id: 'mpc',
            name: 'Media Player Classic',
            icon: 'assets/icons/Windows XP Icons/0099 - Media Player 2.ico',
            width: 900,
            height: 620,
            videoEmbedUrl: 'https://www.youtube.com/embed/nLiYLoLxBNs?autoplay=1&rel=0&modestbranding=1',
            sourceUrl: 'https://www.youtube.com/watch?v=nLiYLoLxBNs'
        },
        cmd: {
            id: 'cmd',
            name: 'Command Prompt',
            icon: 'assets/icons/Windows XP Icons/0088 - Command Prompt.ico',
            width: 700,
            height: 500,
            isTerminal: true
        },
        comingsoon: {
            id: 'comingsoon',
            name: 'Coming Soon',
            icon: 'assets/icons/Windows XP Icons/0062 - Help Document.ico',
            width: 420,
            height: 250
        }
    },

    getApp(id) {
        return this.apps[id] || null;
    },

    getDesktopApps() {
        return [
            { appId: 'mydocs', name: 'My Documents', icon: this.apps.mydocs.icon },
            { appId: 'mycomputer', name: 'My Computer', icon: this.apps.mycomputer.icon },
            { appId: 'ie', name: 'Internet Explorer', icon: this.apps.ie.icon },
            { appId: 'spotify', name: 'Spotify', icon: this.apps.spotify.icon },
            { appId: 'projects', name: 'Projects', icon: this.apps.projects.icon },
            { appId: 'about', name: 'Notepad', icon: this.apps.about.icon },
            { appId: 'resume', name: 'Resume', icon: this.apps.resume.icon },
            { appId: 'skills', name: 'Skills', icon: this.apps.skills.icon },
            { appId: 'paint', name: 'Paint', icon: this.apps.paint.icon },
            { appId: 'contact', name: 'Contact', icon: this.apps.contact.icon },
            { appId: 'control', name: 'Control Panel', icon: this.apps.control.icon },
            { appId: 'cmd', name: 'Command Prompt', icon: this.apps.cmd.icon },
            { appId: 'recycle', name: 'Recycle Bin', icon: this.apps.recycle.icon }
        ];
    },

    getProfileName() {
        return this.profile.displayName;
    },

    generateContent(app) {
        switch (app.id) {
            case 'about':
                return this.generateAboutHTML();
            case 'projects':
                return this.generateProjectsHTML();
            case 'skills':
                return this.generateSkillsHTML();
            case 'resume':
                return this.generateResumeHTML();
            case 'contact':
                return this.generateContactHTML();
            case 'control':
                return this.generateControlPanelHTML();
            case 'paint':
                return this.generatePaintHTML();
            case 'cmd':
                return this.generateTerminalHTML();
            case 'mydocs':
                return this.generateDocumentsHTML();
            case 'mycomputer':
                return this.generateMyComputerHTML();
            case 'recycle':
                return this.generateRecycleBinHTML();
            case 'ie':
                return this.generateIEHTML(app);
            case 'spotify':
                return this.generateSpotifyHTML(app);
            case 'mpc':
                return this.generateMediaPlayerClassicHTML(app);
            case 'comingsoon':
                return this.generateComingSoonHTML();
            default:
                return '<div class="window-content">Content not found</div>';
        }
    },

    generateAboutHTML() {
        return this.generateNotepadLikeHTML('', { editable: true });
    },

    generateProjectsHTML() {
        const html = this.profile.projects.map((project, index) => {
            const linkAttr = project.link ? `data-link="${project.link}"` : '';
            return `
                <div class="project-item" data-index="${index}" ${linkAttr}>
                    <img class="project-icon" src="assets/icons/Windows XP Icons/0001 - Closed Folder.ico" alt="">
                    <div class="project-text">
                        <div class="project-name">${project.name}</div>
                        <div class="project-desc">${project.desc}</div>
                        <div class="project-stack">${project.stack}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="projects-content">${html}</div>`;
    },

    generateSkillsHTML() {
        const html = this.profile.skills.map(skill => `
            <li class="xp-list-item">
                <img src="assets/icons/Windows XP Icons/0100 - Utilities.ico" alt="">
                <span>${skill}</span>
            </li>
        `).join('');

        return `
            <div class="xp-list">
                <div class="xp-list-header">Core Skills</div>
                <ul>${html}</ul>
            </div>
        `;
    },

    generateResumeHTML() {
        return this.generateNotepadLikeHTML(this.profile.resume.content);
    },

    escapeHTML(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    generateNotepadLikeHTML(text, options = {}) {
        const safeText = this.escapeHTML(text);

        if (options.editable) {
            return `
                <div class="notepad-shell notepad-shell-editable" data-notepad-shell>
                    <div class="notepad-menubar" role="menubar">
                        <div class="notepad-menu-group" data-notepad-group="file">
                            <button type="button" class="notepad-menu-button" data-notepad-menu="file">File</button>
                            <ul class="notepad-menu-dropdown" data-notepad-dropdown="file">
                                <li><button type="button" data-notepad-action="new">New</button></li>
                                <li><button type="button" data-notepad-action="save">Save</button></li>
                                <li class="menu-separator" aria-hidden="true"></li>
                                <li><button type="button" data-notepad-action="exit">Exit</button></li>
                            </ul>
                        </div>
                        <div class="notepad-menu-group" data-notepad-group="edit">
                            <button type="button" class="notepad-menu-button" data-notepad-menu="edit">Edit</button>
                            <ul class="notepad-menu-dropdown" data-notepad-dropdown="edit">
                                <li><button type="button" data-notepad-action="select-all">Select All</button></li>
                                <li><button type="button" data-notepad-action="time-date">Time/Date</button></li>
                            </ul>
                        </div>
                        <div class="notepad-menu-group" data-notepad-group="format">
                            <button type="button" class="notepad-menu-button" data-notepad-menu="format">Format</button>
                            <ul class="notepad-menu-dropdown" data-notepad-dropdown="format">
                                <li><button type="button" data-notepad-action="word-wrap">Word Wrap</button></li>
                            </ul>
                        </div>
                        <div class="notepad-menu-group" data-notepad-group="help">
                            <button type="button" class="notepad-menu-button" data-notepad-menu="help">Help</button>
                            <ul class="notepad-menu-dropdown" data-notepad-dropdown="help">
                                <li><button type="button" data-notepad-action="about-notepad">About Notepad</button></li>
                            </ul>
                        </div>
                    </div>
                    <div class="notepad-editor-wrap">
                        <textarea class="notepad-content" data-notepad-editor spellcheck="false" wrap="off">${safeText}</textarea>
                    </div>
                </div>
            `;
        }

        return `
            <div class="notepad-shell">
                <div class="notepad-menubar">
                    <span class="notepad-menu-item">File</span>
                    <span class="notepad-menu-item">Edit</span>
                    <span class="notepad-menu-item">Format</span>
                    <span class="notepad-menu-item">View</span>
                    <span class="notepad-menu-item active">Help</span>
                </div>
                <div class="notepad-editor-wrap">
                    <textarea class="notepad-content" readonly spellcheck="false">${safeText}</textarea>
                </div>
            </div>
        `;
    },

    generateContactHTML() {
        const iconMap = {
            email: 'assets/icons/Windows XP Icons/0156 - Alt Email.ico',
            github: 'assets/icons/Windows XP Icons/0081 - Internet Explorer.ico',
            linkedin: 'assets/icons/Windows XP Icons/0037 - User Accounts.ico'
        };

        const html = this.profile.contacts.map(contact => {
            const type = contact.label.toLowerCase();
            const isMail = contact.link.startsWith('mailto:');
            const actionText = isMail ? 'Compose' : 'Open';
            const externalAttrs = isMail ? '' : 'target="_blank" rel="noreferrer noopener"';

            return `
                <article class="contact-card">
                    <div class="contact-card-icon-wrap">
                        <img class="contact-card-icon" src="${iconMap[type] || this.apps.contact.icon}" alt="">
                    </div>
                    <div class="contact-card-content">
                        <div class="contact-card-label">${this.escapeHTML(contact.label)}</div>
                        <a class="contact-link" href="${this.escapeHTML(contact.link)}" ${externalAttrs}>
                            ${this.escapeHTML(contact.value)}
                        </a>
                    </div>
                    <a class="contact-card-action contact-link" href="${this.escapeHTML(contact.link)}" ${externalAttrs}>
                        ${actionText}
                    </a>
                </article>
            `;
        }).join('');

        return `
            <div class="contact-shell">
                <div class="contact-header">
                    <div class="contact-header-title">Reach Vedang</div>
                    <div class="contact-header-subtitle">Choose email, GitHub, or LinkedIn.</div>
                </div>
                <div class="contact-content">${html}</div>
            </div>
        `;
    },

    generateControlPanelHTML() {
        const theme = Personalization.getTheme();
        const wallpaper = Personalization.getWallpaper();
        const wallpaperCards = Personalization.getWallpaperOptions().map(option => `
            <button
                type="button"
                class="control-wallpaper-card ${wallpaper === option.value ? 'active' : ''}"
                data-wallpaper-key="${option.key}"
                title="${this.escapeHTML(option.label)}"
                style="--wallpaper-thumb:url('${this.escapeHTML(option.value)}')"
            >
                <span class="control-wallpaper-preview" aria-hidden="true"></span>
                <span class="control-wallpaper-label">${this.escapeHTML(option.label)}</span>
            </button>
        `).join('');

        return `
            <div class="control-panel control-shell" data-control-root>
                <div class="control-menubar">
                    <span>File</span>
                    <span>Edit</span>
                    <span>View</span>
                    <span>Tools</span>
                    <span>Help</span>
                </div>

                <div class="control-toolbar">
                    <button type="button" class="control-arrow-btn" data-control-action="show-desktop" title="Show Desktop">&#8592;</button>
                    <button type="button" class="control-arrow-btn" data-control-action="reset-icons" title="Reset Icons">&#8594;</button>
                    <div class="control-toolbar-divider" aria-hidden="true"></div>
                    <button type="button" class="control-arrow-btn control-arrow-btn-go" data-control-action="play-test-sound" title="Test Sound">&#8594;</button>
                    <span class="control-toolbar-label">Category View</span>
                </div>

                <div class="control-address-row">
                    <span class="control-address-label">Address</span>
                    <div class="control-address-value">
                        <img src="${this.apps.control.icon}" alt="">
                        <span>Control Panel</span>
                    </div>
                </div>

                <div class="control-layout">
                    <aside class="control-sidebar">
                        <section class="control-side-group">
                            <div class="control-side-title">Control Panel Home</div>
                            <button type="button" class="control-side-link" data-open-app="mycomputer">Open My Computer</button>
                            <button type="button" class="control-side-link" data-open-app="mydocs">Open My Documents</button>
                            <button type="button" class="control-side-link" data-open-app="contact">Open Contact</button>
                        </section>

                        <section class="control-side-group">
                            <div class="control-side-title">Desktop Tasks</div>
                            <button type="button" class="control-side-link" data-control-action="show-desktop">Show Desktop</button>
                            <button type="button" class="control-side-link" data-control-action="reset-icons">Reset Desktop Icons</button>
                            <button type="button" class="control-side-link" data-control-action="play-test-sound">Play Sound Test</button>
                        </section>

                        <section class="control-side-group">
                            <div class="control-side-title">Status</div>
                            <div class="control-status-line">
                                Sounds: <strong data-sound-status>${SoundManager.isEnabled() ? 'On' : 'Muted'}</strong>
                            </div>
                            <div class="control-status-line">
                                Volume: <strong data-sound-volume-value>${Math.round(SoundManager.getMasterVolume() * 100)}%</strong>
                            </div>
                            <div class="control-status-line">
                                Theme: <strong>Luna Blue</strong>
                            </div>
                        </section>
                    </aside>

                    <section class="control-main">
                        <article class="control-card">
                            <div class="control-card-title">Appearance and Themes</div>
                            <div class="control-card-subtitle">Visual style</div>
                            <div class="control-row">
                                <button type="button" class="control-chip ${theme === 'luna-blue' ? 'active' : ''}" data-theme="luna-blue">
                                    Luna Blue
                                </button>
                            </div>
                        </article>

                        <article class="control-card">
                            <div class="control-card-title">Desktop Background</div>
                            <div class="control-card-subtitle">Choose wallpaper</div>
                            <div class="control-wallpaper-grid">
                                ${wallpaperCards}
                            </div>
                        </article>

                        <article class="control-card">
                            <div class="control-card-title">Sounds and Audio Devices</div>
                            <div class="control-card-subtitle">System sounds</div>
                            <div class="control-row">
                                <button type="button" class="control-chip" data-sound-toggle>
                                    ${SoundManager.isEnabled() ? 'Disable Sounds' : 'Enable Sounds'}
                                </button>
                            </div>
                            <label class="control-volume">
                                <span>Master Volume</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value="${Math.round(SoundManager.getMasterVolume() * 100)}"
                                    data-sound-volume
                                >
                            </label>
                        </article>

                        <article class="control-card">
                            <div class="control-card-title">Portfolio Shortcuts</div>
                            <div class="control-card-subtitle">Quick launch</div>
                            <div class="control-shortcuts">
                                <button type="button" class="control-shortcut-btn" data-open-app="paint">Paint</button>
                                <button type="button" class="control-shortcut-btn" data-open-app="spotify">Spotify</button>
                                <button type="button" class="control-shortcut-btn" data-open-app="recycle">Recycle Bin</button>
                                <button type="button" class="control-shortcut-btn" data-open-app="cmd">Command Prompt</button>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        `;
    },

    generatePaintHTML() {
        const swatches = [
            '#000000', '#7f7f7f', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
            '#808040', '#004040', '#0080ff', '#004080', '#ff0000', '#ff8040', '#ffff00', '#80ff00',
            '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffc0c0', '#ffe0c0', '#ffffc0', '#ffffff'
        ];
        const swatchHtml = swatches.map((color, idx) => `
            <button
                type="button"
                class="paint-swatch ${idx === 0 ? 'active' : ''}"
                data-color="${color}"
                style="background:${color};"
                title="${color}"
                aria-label="Color ${color}"
            ></button>
        `).join('');

        return `
            <div class="paint-app">
                <div class="paint-menubar">
                    <button type="button" class="paint-menu-item">File</button>
                    <button type="button" class="paint-menu-item">Edit</button>
                    <button type="button" class="paint-menu-item">View</button>
                    <button type="button" class="paint-menu-item">Image</button>
                    <button type="button" class="paint-menu-item">Colors</button>
                    <button type="button" class="paint-menu-item">Help</button>
                </div>

                <div class="paint-toolbar">
                    <div class="paint-toolbar-group">
                        <label class="paint-field">Size:
                            <select class="paint-size" data-paint-size>
                                <option value="1">1 px</option>
                                <option value="2">2 px</option>
                                <option value="4" selected>4 px</option>
                                <option value="8">8 px</option>
                                <option value="12">12 px</option>
                                <option value="16">16 px</option>
                            </select>
                        </label>
                    </div>
                    <div class="paint-toolbar-group">
                        <button type="button" class="paint-btn" data-paint-action="new">New</button>
                        <button type="button" class="paint-btn" data-paint-action="clear">Clear</button>
                        <button type="button" class="paint-btn" data-paint-action="save">Save PNG</button>
                    </div>
                </div>

                <div class="paint-workspace">
                    <aside class="paint-toolbox">
                        <button type="button" class="paint-tool-btn active" data-paint-tool="brush" title="Brush">
                            <span class="paint-tool-glyph" aria-hidden="true"></span>
                        </button>
                        <button type="button" class="paint-tool-btn" data-paint-tool="pencil" title="Pencil">
                            <span class="paint-tool-glyph" aria-hidden="true"></span>
                        </button>
                        <button type="button" class="paint-tool-btn" data-paint-tool="eraser" title="Eraser">
                            <span class="paint-tool-glyph" aria-hidden="true"></span>
                        </button>
                        <button type="button" class="paint-tool-btn" data-paint-tool="line" title="Line">
                            <span class="paint-tool-glyph" aria-hidden="true"></span>
                        </button>
                        <button type="button" class="paint-tool-btn" data-paint-tool="rect" title="Rectangle">
                            <span class="paint-tool-glyph" aria-hidden="true"></span>
                        </button>
                        <button type="button" class="paint-tool-btn" data-paint-tool="ellipse" title="Ellipse">
                            <span class="paint-tool-glyph" aria-hidden="true"></span>
                        </button>
                    </aside>

                    <div class="paint-canvas-wrap">
                        <div class="paint-canvas-inner">
                            <canvas class="paint-canvas" width="1300" height="900"></canvas>
                        </div>
                    </div>
                </div>

                <div class="paint-statusbar">
                    <div class="paint-status" data-paint-status>Ready</div>
                    <div class="paint-current-colors">
                        <span class="paint-color-chip paint-color-primary" data-paint-primary-color style="background:#000000;"></span>
                        <span class="paint-color-chip paint-color-secondary" data-paint-secondary-color style="background:#ffffff;"></span>
                    </div>
                    <div class="paint-swatches">${swatchHtml}</div>
                </div>
                <div class="paint-hint">Left click to draw with primary color, right click for secondary color.</div>
            </div>
        `;
    },

    generateDocumentsHTML() {
        return `
            <div class="mydocs-shell" data-docs-root>
                <div class="mydocs-menubar">
                    <button type="button" class="mydocs-menu-btn">File</button>
                    <button type="button" class="mydocs-menu-btn">Edit</button>
                    <button type="button" class="mydocs-menu-btn">View</button>
                    <button type="button" class="mydocs-menu-btn">Favorites</button>
                    <button type="button" class="mydocs-menu-btn">Tools</button>
                    <button type="button" class="mydocs-menu-btn">Help</button>
                </div>

                <div class="mydocs-toolbar">
                    <button type="button" class="mydocs-nav-btn" data-docs-action="back" title="Back" aria-label="Back">
                        &#8592;
                    </button>
                    <button type="button" class="mydocs-nav-btn" data-docs-action="forward" title="Forward" aria-label="Forward">
                        &#8594;
                    </button>
                    <button type="button" class="mydocs-nav-btn" data-docs-action="up" title="Up" aria-label="Up">
                        &#8593;
                    </button>
                    <div class="mydocs-toolbar-divider" aria-hidden="true"></div>
                    <button type="button" class="mydocs-tool-btn" data-docs-action="new-folder">
                        <img src="assets/icons/Windows XP Icons/0000 - Open Folder.ico" alt="">
                        <span>New Folder</span>
                    </button>
                    <button type="button" class="mydocs-tool-btn" data-docs-action="delete">
                        <img src="assets/icons/Windows XP Icons/0021 -  Recycle Bin Full.ico" alt="">
                        <span>Delete</span>
                    </button>
                    <button type="button" class="mydocs-tool-btn" data-docs-action="open-selected">
                        <img src="assets/icons/Windows XP Icons/0089 - Explorer.ico" alt="">
                        <span>Open</span>
                    </button>
                    <div class="mydocs-toolbar-spacer"></div>
                    <label class="mydocs-view-label">
                        View
                        <select data-docs-view-select>
                            <option value="details" selected>Details</option>
                            <option value="list">List</option>
                        </select>
                    </label>
                </div>

                <div class="mydocs-address-row">
                    <span class="mydocs-address-label">Address</span>
                    <div class="mydocs-address-value" data-docs-path></div>
                    <button type="button" class="mydocs-go-btn" data-docs-action="open-selected">&#8594;</button>
                </div>

                <div class="mydocs-main">
                    <aside class="mydocs-sidebar">
                        <section class="mydocs-side-group">
                            <header class="mydocs-side-header">File and Folder Tasks</header>
                            <ul class="mydocs-side-list">
                                <li>
                                    <button type="button" class="mydocs-side-action" data-docs-action="new-folder">Make a new folder</button>
                                </li>
                                <li>
                                    <button type="button" class="mydocs-side-action" data-docs-action="open-selected">Open selected item</button>
                                </li>
                                <li>
                                    <button type="button" class="mydocs-side-action" data-docs-action="delete">Delete selected item</button>
                                </li>
                            </ul>
                        </section>

                        <section class="mydocs-side-group">
                            <header class="mydocs-side-header">Other Places</header>
                            <ul class="mydocs-side-list mydocs-place-list" data-docs-places></ul>
                        </section>

                        <section class="mydocs-side-group">
                            <header class="mydocs-side-header">Details</header>
                            <div class="mydocs-details-panel" data-docs-selection-details>Select a file or folder to see details.</div>
                        </section>
                    </aside>

                    <section class="mydocs-content">
                        <div class="mydocs-content-head">
                            <div class="mydocs-folder-title" data-docs-folder-title>My Documents</div>
                            <label class="mydocs-search-wrap">
                                Search
                                <input type="text" data-docs-search placeholder="Search in this folder">
                            </label>
                        </div>

                        <div class="mydocs-columns" data-docs-columns>
                            <div class="mydocs-col mydocs-col-name">Name</div>
                            <div class="mydocs-col mydocs-col-type">Type</div>
                            <div class="mydocs-col mydocs-col-size">Size</div>
                            <div class="mydocs-col mydocs-col-modified">Date Modified</div>
                        </div>

                        <div class="mydocs-items" data-docs-items tabindex="0"></div>
                        <div class="mydocs-status" data-docs-status></div>
                    </section>
                </div>
            </div>
        `;
    },

    generateMyComputerHTML() {
        return `
            <div class="mycomputer-shell">
                <div class="mycomputer-menubar">
                    <span>File</span>
                    <span>View</span>
                    <span>Favorites</span>
                    <span>Tools</span>
                    <span>Help</span>
                </div>

                <div class="mycomputer-toolbar">
                    <button class="mc-nav-btn" type="button" aria-label="Back">&#8592;</button>
                    <span class="mc-nav-label">Back</span>
                    <button class="mc-nav-btn" type="button" aria-label="Forward">&#8594;</button>
                    <div class="mc-divider" aria-hidden="true"></div>
                    <div class="mc-tool-item">
                        <img src="assets/icons/Windows XP Icons/0031 - Start Find.ico" alt="">
                        <span>Search</span>
                    </div>
                    <div class="mc-tool-item">
                        <img src="assets/icons/Windows XP Icons/0000 - Open Folder.ico" alt="">
                        <span>Folders</span>
                    </div>
                    <div class="mc-tool-item">
                        <img src="assets/icons/Windows XP Icons/0089 - Explorer.ico" alt="">
                    </div>
                </div>

                <div class="mycomputer-address-row">
                    <span class="mc-address-label">Address</span>
                    <div class="mc-address-value">
                        <img src="assets/icons/Windows XP Icons/0018 - My Computer.ico" alt="">
                        <span>My Computer</span>
                    </div>
                    <button class="mc-go-btn" type="button" aria-label="Go">&#8594;</button>
                </div>

                <div class="mycomputer-main">
                    <aside class="mycomputer-sidebar">
                        <section class="mc-side-group">
                            <header class="mc-side-header">
                                <span>System Tasks</span>
                                <span class="mc-chev">&#710;</span>
                            </header>
                            <ul class="mc-side-list">
                                <li>
                                    <img src="assets/icons/Windows XP Icons/0015 - Control Panel.ico" alt="">
                                    <span>View system information</span>
                                </li>
                                <li>
                                    <img src="assets/icons/Windows XP Icons/0122 - Install Icon.ico" alt="">
                                    <span>Add or remove programs</span>
                                </li>
                                <li>
                                    <img src="assets/icons/Windows XP Icons/0159 - Other Control Panel Options.ico" alt="">
                                    <span>Change a setting</span>
                                </li>
                            </ul>
                        </section>

                        <section class="mc-side-group">
                            <header class="mc-side-header">
                                <span>Other Places</span>
                                <span class="mc-chev">&#710;</span>
                            </header>
                            <ul class="mc-side-list">
                                <li>
                                    <img src="assets/icons/Windows XP Icons/0018 - My Computer.ico" alt="">
                                    <span>My Computer</span>
                                </li>
                                <li data-mc-open-url="https://www.instagram.com/vedangggwtf">
                                    <img src="assets/icons/Windows XP Icons/0003 - My Pictures.ico" alt="">
                                    <span>My Pictures</span>
                                </li>
                                <li data-mc-open-url="https://open.spotify.com/user/31fjvfuoan2mv3hyept33ffzsbeq">
                                    <img src="assets/icons/Windows XP Icons/0004 - My Music.ico" alt="">
                                    <span>My Music</span>
                                </li>
                                <li>
                                    <img src="assets/icons/Windows XP Icons/0019 - Network Neighborhood.ico" alt="">
                                    <span>My Network Places</span>
                                </li>
                            </ul>
                        </section>
                    </aside>

                    <section class="mycomputer-content">
                        <div class="mc-content-group">
                            <h3>Files Stored on This Computer</h3>
                            <div class="mc-items">
                                <div class="mc-item" data-mc-open-url="https://open.spotify.com/user/31fjvfuoan2mv3hyept33ffzsbeq">
                                    <img src="assets/icons/Windows XP Icons/0004 - My Music.ico" alt="">
                                    <span>My Music</span>
                                </div>
                                <div class="mc-item" data-mc-open-url="https://www.instagram.com/vedangggwtf">
                                    <img src="assets/icons/Windows XP Icons/0003 - My Pictures.ico" alt="">
                                    <span>My Pictures</span>
                                </div>
                            </div>
                        </div>

                        <div class="mc-content-group">
                            <h3>Hard Disk Drives</h3>
                            <div class="mc-items">
                                <div class="mc-item">
                                    <img src="assets/icons/Windows XP Icons/0023 - Hard drive.ico" alt="">
                                    <span>Local Disk (C:)</span>
                                </div>
                                <div class="mc-item">
                                    <img src="assets/icons/Windows XP Icons/0165 - SCSI Hard Drive.ico" alt="">
                                    <span>Local Disk (D:)</span>
                                </div>
                            </div>
                        </div>

                        <div class="mc-content-group">
                            <h3>Devices with Removable Storage</h3>
                            <div class="mc-items">
                                <div class="mc-item">
                                    <img src="assets/icons/Windows XP Icons/0026 - Removable Disk.ico" alt="">
                                    <span>Removable Device (F:)</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    },

    generateRecycleBinHTML() {
        return `<div class="recycle-root" data-recycle-root></div>`;
    },

    generateIEHTML(app) {
        return `
            <div class="ie-app">
                <div class="ie-menubar">
                    <span>File</span>
                    <span>Edit</span>
                    <span>View</span>
                    <span>Favorites</span>
                    <span>Tools</span>
                    <span>Help</span>
                </div>
                <div class="ie-toolbar">
                    <button class="ie-nav-btn" type="button" aria-label="Back">&#8592;</button>
                    <span class="ie-nav-label">Back</span>
                    <button class="ie-nav-btn" type="button" aria-label="Forward">&#8594;</button>
                    <span class="ie-nav-label">Forward</span>
                    <button class="ie-nav-btn" type="button" aria-label="Refresh">&#8635;</button>
                    <div class="ie-toolbar-divider" aria-hidden="true"></div>
                    <span class="ie-address-label">Address</span>
                    <input class="ie-address-bar" type="text" value="${app.homepage}" readonly>
                    <a class="ie-go-btn" href="${app.homepage}" target="_blank" rel="noreferrer noopener" aria-label="Go">&#8594;</a>
                </div>
                <div class="ie-frame-wrap">
                    <iframe class="ie-frame" src="${app.homepage}" title="Google"></iframe>
                </div>
            </div>
        `;
    },

    generateSpotifyHTML(app) {
        const trackItems = app.tracks.map((track, index) => `
            <button
                type="button"
                class="spotify-track-btn ${index === 0 ? 'active' : ''}"
                data-spotify-track-index="${index}"
                title="${track.title} - ${track.artist}"
            >
                <span class="spotify-track-title">${track.title}</span>
                <span class="spotify-track-artist">${track.artist}</span>
            </button>
        `).join('');

        return `
            <div class="spotify-app" data-spotify-app>
                <div class="spotify-toolbar">
                    <div class="spotify-brand">
                        <img src="${this.apps.spotify.icon}" alt="">
                        <span>Spotify</span>
                    </div>
                    <a class="spotify-open-btn" href="${app.openUrl}" target="_blank" rel="noreferrer">Open in Browser</a>
                </div>

                <div class="spotify-layout">
                    <aside class="spotify-sidebar">
                        <div class="spotify-sidebar-title">Top Songs</div>
                        <div class="spotify-track-list" data-spotify-track-list>
                            ${trackItems}
                        </div>
                    </aside>

                    <section class="spotify-main">
                        <div class="spotify-now">
                            <img class="spotify-now-art" src="${this.apps.spotify.icon}" alt="">
                            <div class="spotify-now-meta">
                                <div class="spotify-now-title" data-spotify-now-title>${app.tracks[0].title}</div>
                                <div class="spotify-now-artist" data-spotify-now-artist>${app.tracks[0].artist}</div>
                            </div>
                        </div>

                        <div class="spotify-progress-row">
                            <span data-spotify-current>0:00</span>
                            <input type="range" min="0" max="100" value="0" data-spotify-progress>
                            <span data-spotify-duration>0:00</span>
                        </div>

                        <div class="spotify-controls">
                            <button type="button" data-spotify-action="shuffle">Shuffle Off</button>
                            <button type="button" data-spotify-action="prev">&#9664;&#9664;</button>
                            <button type="button" data-spotify-action="play">Play</button>
                            <button type="button" data-spotify-action="next">&#9654;&#9654;</button>
                            <button type="button" data-spotify-action="repeat">Repeat Off</button>
                        </div>

                        <div class="spotify-volume-grid">
                            <label>
                                <span>Spotify Volume</span>
                                <input type="range" min="0" max="100" value="80" data-spotify-volume>
                            </label>
                        </div>

                        <audio data-spotify-audio preload="metadata"></audio>
                    </section>
                </div>

                <div class="spotify-status" data-spotify-status>Ready</div>
            </div>
        `;
    },

    generateMediaPlayerClassicHTML(app) {
        return `
            <div class="mpc-app">
                <div class="mpc-toolbar">
                    <span class="mpc-toolbar-label">Now Playing</span>
                    <a class="mpc-open-link" href="${app.sourceUrl}" target="_blank" rel="noreferrer noopener">
                        Open on YouTube
                    </a>
                </div>
                <div class="mpc-frame-wrap">
                    <iframe
                        class="mpc-frame"
                        src="${app.videoEmbedUrl}"
                        title="Media Player Classic"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowfullscreen
                    ></iframe>
                </div>
            </div>
        `;
    },

    generateTerminalHTML() {
        return `
            <div class="cmd-terminal" tabindex="0">
                <div class="cmd-line">
                    <span class="cmd-prompt">Microsoft Windows XP [Version 5.1.2600]</span>
                </div>
                <div class="cmd-line">
                    <span class="cmd-prompt">(c) Copyright 1985-2001 Microsoft Corp.</span>
                </div>
                <div class="cmd-line">&nbsp;</div>
                <div class="cmd-output">Type 'help' for available commands.</div>
                <div class="cmd-line cmd-input-line">
                    <span class="cmd-prompt">C:\\></span>
                    <input type="text" class="cmd-input" autofocus>
                </div>
            </div>
        `;
    },

    generateComingSoonHTML() {
        return `
            <div class="coming-soon-content">
                <div class="coming-soon-title">Coming Soon</div>
            </div>
        `;
    }
};
