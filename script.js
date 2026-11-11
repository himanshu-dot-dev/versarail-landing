(() => {
  'use strict';

  const RELEASE_BASE =
    'https://github.com/himanshu-dot-dev/versarail-ai/releases/latest/download';

  const PLATFORM_ASSETS = {
    windows: {
      label: 'Download for Windows (x64)',
      file: 'VersaRail-AI-Setup-win-x64.exe'
    },
    macosArm: {
      label: 'Download for macOS (Apple Silicon)',
      file: 'VersaRail-AI-mac-arm64.dmg'
    },
    macosIntel: {
      label: 'Download for macOS (Intel)',
      file: 'VersaRail-AI-mac-x64.dmg'
    },
    linux: {
      label: 'Download for Linux (AppImage)',
      file: 'VersaRail-AI-linux-x86_64.AppImage'
    }
  };

  function announce(msg) {
    const el = document.getElementById('liveAnnouncer');
    if (el) el.textContent = msg;
  }

  // Theme Toggle (Dark / Light mode matching versarail-ai theme tokens)
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeColorMeta = document.getElementById('themeColorMeta');

  function applyTheme(theme, persist = false) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', next === 'light' ? '#f8fafc' : '#090a0f');
    }
    if (themeToggleBtn) {
      const isLight = next === 'light';
      themeToggleBtn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      themeToggleBtn.setAttribute(
        'aria-label',
        isLight ? 'Switch to dark mode' : 'Switch to light mode'
      );
    }
    if (persist) {
      try {
        localStorage.setItem('versarail-theme', next);
      } catch {}
    }
  }

  applyTheme(document.documentElement.dataset.theme || 'dark', false);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next, true);
      announce(`Switched to ${next} mode.`);
    });
  }

  // Dynamic footer year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Accessible mobile nav toggle
  const menuBtn = document.getElementById('mobileMenu');
  const navLinks = document.getElementById('navLinks');

  function setMenuOpen(isOpen) {
    if (!menuBtn || !navLinks) return;
    navLinks.classList.toggle('open', isOpen);
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.contains('open');
      setMenuOpen(!isOpen);
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && e.target !== menuBtn) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setMenuOpen(false);
        menuBtn.focus();
      }
    });
  }

  // OS detection for Hero CTA & Download Center default tab
  function detectPlatform() {
    const ua = navigator.userAgent || '';
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    const combined = `${ua} ${platform}`.toLowerCase();

    if (combined.includes('mac')) {
      return { tab: 'macos', asset: PLATFORM_ASSETS.macosArm };
    }
    if (combined.includes('linux') && !combined.includes('android')) {
      return { tab: 'linux', asset: PLATFORM_ASSETS.linux };
    }
    return { tab: 'windows', asset: PLATFORM_ASSETS.windows };
  }

  function selectOsTab(osName) {
    document.querySelectorAll('.os-tab').forEach((btn) => {
      const active = btn.dataset.os === osName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.os-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.osPanel === osName);
    });
  }

  const detected = detectPlatform();
  const heroBtn = document.getElementById('heroDownloadBtn');
  const heroLabel = document.getElementById('heroDownloadLabel');
  if (heroBtn && heroLabel) {
    heroBtn.href = `${RELEASE_BASE}/${detected.asset.file}`;
    heroLabel.textContent = detected.asset.label;
  }
  selectOsTab(detected.tab);

  document.querySelectorAll('.os-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectOsTab(btn.dataset.os);
    });
  });

  // Copy checksum verification commands
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.copyTarget;
      const codeEl = targetId ? document.getElementById(targetId) : null;
      if (!codeEl) return;

      try {
        await navigator.clipboard.writeText(codeEl.textContent.trim());
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        announce('Verification command copied to clipboard.');
        setTimeout(() => {
          btn.textContent = prev;
        }, 1600);
      } catch {
        btn.textContent = 'Select & Copy';
      }
    });
  });

  // Interactive Preview: Sidebar View Switcher & Electron Shell Layout
  const appLayout = document.getElementById('appLayout');
  const appInspector = document.getElementById('appInspector');
  const toggleInspectorBtn = document.getElementById('toggleInspectorBtn');
  const closeInspectorBtn = document.getElementById('closeInspectorBtn');
  const sideItems = document.querySelectorAll('.app-sidebar .side-item');
  const previewPanes = document.querySelectorAll('.preview-pane');

  let currentView = 'chat';
  let isInspectorOpen = appLayout ? appLayout.classList.contains('inspector-open') : true;

  function syncInspectorVisibility() {
    const shouldShow = currentView === 'chat' && isInspectorOpen;
    if (appLayout) {
      appLayout.classList.toggle('inspector-open', shouldShow);
    }
    if (appInspector) {
      appInspector.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }
    if (toggleInspectorBtn) {
      toggleInspectorBtn.classList.toggle('ctx-btn-active', isInspectorOpen);
      toggleInspectorBtn.setAttribute('aria-pressed', isInspectorOpen ? 'true' : 'false');
    }
  }

  function activatePreviewView(viewName) {
    currentView = viewName;
    sideItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    previewPanes.forEach((pane) => {
      pane.classList.toggle('active', pane.dataset.pane === viewName);
    });
    syncInspectorVisibility();
  }

  syncInspectorVisibility();

  sideItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      activatePreviewView(btn.dataset.view);
    });
  });

  if (toggleInspectorBtn) {
    toggleInspectorBtn.addEventListener('click', () => {
      isInspectorOpen = !isInspectorOpen;
      if (currentView !== 'chat' && isInspectorOpen) {
        activatePreviewView('chat');
      } else {
        syncInspectorVisibility();
      }
      announce(isInspectorOpen ? 'Workspace files panel opened.' : 'Workspace files panel collapsed.');
    });
  }

  if (closeInspectorBtn) {
    closeInspectorBtn.addEventListener('click', () => {
      isInspectorOpen = false;
      syncInspectorVisibility();
      announce('Workspace files panel collapsed.');
    });
  }

  const openConfigViewBtn = document.getElementById('openConfigViewBtn');
  const modelChipBtn = document.getElementById('modelChipBtn');
  const sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');

  if (openConfigViewBtn) {
    openConfigViewBtn.addEventListener('click', () => {
      activatePreviewView('providers');
    });
  }

  if (modelChipBtn) {
    modelChipBtn.addEventListener('click', () => {
      activatePreviewView('providers');
    });
  }

  if (sidebarSettingsBtn) {
    sidebarSettingsBtn.addEventListener('click', () => {
      activatePreviewView('permissions');
    });
  }

  // Interactive Preview: Recent Chats Switcher
  const recentChatItems = document.querySelectorAll('.recent-chat-item');
  const chatContextTitle = document.getElementById('chatContextTitle');
  const initialChatTitle = chatContextTitle ? chatContextTitle.textContent : 'Atomic write & hash guard';

  recentChatItems.forEach((item) => {
    item.addEventListener('click', () => {
      recentChatItems.forEach((other) => {
        other.classList.toggle('active', other === item);
      });
      const topic = item.dataset.chatTopic || 'atomic';
      if (topic === 'failover') {
        if (chatContextTitle) chatContextTitle.textContent = item.textContent.trim();
        activatePreviewView('providers');
      } else {
        if (chatContextTitle) chatContextTitle.textContent = initialChatTitle;
        activatePreviewView('chat');
      }
    });
  });

  // Interactive Preview: DiffViewer Accept / Reject simulation
  const acceptDiffBtn = document.getElementById('acceptDiffBtn');
  const rejectDiffBtn = document.getElementById('rejectDiffBtn');
  const diffStatusNote = document.getElementById('diffStatusNote');
  const initialDiffStatusText = diffStatusNote ? diffStatusNote.textContent : '';
  const initialDiffStatusClass = diffStatusNote ? diffStatusNote.className : 'diff-status-note';

  if (acceptDiffBtn && rejectDiffBtn && diffStatusNote) {
    acceptDiffBtn.addEventListener('click', () => {
      diffStatusNote.textContent = 'Committed atomically (fsync)';
      diffStatusNote.className = 'diff-status-note status-ok';
      announce('Demo diff accepted atomically.');
    });

    rejectDiffBtn.addEventListener('click', () => {
      diffStatusNote.textContent = 'Discarded — 0 bytes written';
      diffStatusNote.className = 'diff-status-note status-err';
      announce('Demo diff rejected; zero bytes written.');
    });
  }

  // Interactive Preview: TitleBar Reload simulation
  const previewReloadBtn = document.getElementById('previewReloadBtn');
  let reloadTimer = null;

  if (previewReloadBtn) {
    previewReloadBtn.addEventListener('click', () => {
      const icon = previewReloadBtn.querySelector('svg') || previewReloadBtn;
      icon.classList.add('spinning');
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        icon.classList.remove('spinning');
      }, 450);

      if (diffStatusNote) {
        diffStatusNote.textContent = initialDiffStatusText || 'Baseline SHA-256 verified · Ready for review';
        diffStatusNote.className = initialDiffStatusClass;
      }
      if (chatContextTitle) {
        chatContextTitle.textContent = initialChatTitle;
      }
      recentChatItems.forEach((item) => {
        item.classList.toggle('active', item.dataset.chatTopic === 'atomic');
      });
      activatePreviewView('chat');
      announce('Preview state refreshed.');
    });
  }

  // Interactive Preview: Workspace Files Filter & Click-to-Copy
  const inspectorFilterInput = document.getElementById('inspectorFilterInput');
  const inspectorItems = document.querySelectorAll('#inspectorTree .ins-item');

  if (inspectorFilterInput && inspectorItems.length) {
    inspectorFilterInput.addEventListener('input', () => {
      const query = inspectorFilterInput.value.trim().toLowerCase();
      inspectorItems.forEach((row) => {
        const label = (row.dataset.name || row.textContent || '').toLowerCase();
        row.style.display = query === '' || label.includes(query) ? '' : 'none';
      });
    });
  }

  document.querySelectorAll('#inspectorTree .ins-file').forEach((fileBtn) => {
    let copyTimer = null;
    fileBtn.addEventListener('click', () => {
      const copyEl = fileBtn.querySelector('.ins-copy');
      fileBtn.classList.add('copied');
      if (copyEl) {
        if (!fileBtn.dataset.defaultCopy) {
          fileBtn.dataset.defaultCopy = copyEl.textContent;
        }
        copyEl.textContent = 'Copied!';
      }
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        fileBtn.classList.remove('copied');
        if (copyEl && fileBtn.dataset.defaultCopy) {
          copyEl.textContent = fileBtn.dataset.defaultCopy;
        }
      }, 1200);
      announce(`Copied ${fileBtn.dataset.name || 'file'} path.`);
    });
  });

  // Interactive Preview: Prompt Pills & Run Button
  const composerPromptText = document.getElementById('composerPromptText');
  const runPreviewBtn = document.getElementById('runPreviewBtn');

  document.querySelectorAll('.pill-chip').forEach((pill) => {
    pill.addEventListener('click', () => {
      if (!composerPromptText) return;
      const cursor = '<span class="prompt-cursor" aria-hidden="true"></span>';
      composerPromptText.innerHTML = `${pill.dataset.prompt}${cursor}`;
    });
  });

  if (runPreviewBtn && composerPromptText) {
    runPreviewBtn.addEventListener('click', () => {
      const text = composerPromptText.textContent.toLowerCase();
      if (text.includes('429') || text.includes('groq')) {
        activatePreviewView('providers');
      } else if (text.includes('vitest') || text.includes('runner')) {
        activatePreviewView('permissions');
      } else if (diffStatusNote) {
        diffStatusNote.textContent = 'Baseline SHA-256 verified · Ready for review';
        diffStatusNote.className = 'diff-status-note status-info';
      }
    });
  }

  // Interactive Preview: Pre-First-Byte 429 Failover Simulation
  const simFailoverBtn = document.getElementById('simulateFailoverBtn');
  const routingBanner = document.getElementById('routingBanner');
  const routingBannerText = document.getElementById('routingBannerText');
  const pvGemini = document.getElementById('pvGemini');
  const pvGeminiState = document.getElementById('pvGeminiState');
  const pvGroq = document.getElementById('pvGroq');
  const pvGroqState = document.getElementById('pvGroqState');
  const healthText = document.getElementById('previewHealthText');

  if (simFailoverBtn && routingBanner && routingBannerText && pvGemini && pvGroq) {
    let failoverOn = false;
    simFailoverBtn.addEventListener('click', () => {
      failoverOn = !failoverOn;
      if (failoverOn) {
        routingBanner.classList.add('failover-active');
        routingBannerText.textContent =
          '429 hit before byte 0 on Gemini -> Auto-switched to GroqCloud (Cooldown: 45s).';
        pvGemini.classList.remove('active');
        pvGemini.classList.add('cooldown');
        pvGeminiState.textContent = 'Cooldown 45s';
        pvGeminiState.className = 'pv-state warn';

        pvGroq.classList.add('active');
        pvGroqState.textContent = 'Active Failover';
        pvGroqState.className = 'pv-state ok';
        if (healthText) {
          healthText.textContent = 'Failover: Groq';
          healthText.classList.add('is-failover');
        }
        simFailoverBtn.textContent = 'Restore Primary';
        announce('Simulated pre-first-byte 429 failover to GroqCloud.');
      } else {
        routingBanner.classList.remove('failover-active');
        routingBannerText.textContent =
          'Routing primary inference through Gemini 2.5 Flash (184ms). Backup lease: Groq.';
        pvGemini.classList.add('active');
        pvGemini.classList.remove('cooldown');
        pvGeminiState.textContent = 'Primary';
        pvGeminiState.className = 'pv-state ok';

        pvGroq.classList.remove('active');
        pvGroqState.textContent = 'Standby';
        pvGroqState.className = 'pv-state';
        if (healthText) {
          healthText.textContent = 'Ready';
          healthText.classList.remove('is-failover');
        }
        simFailoverBtn.textContent = 'Simulate 429 Failover';
        announce('Restored primary provider Gemini.');
      }
    });
  }

  // Interactive Preview: Permission Broker TOCTOU Guard
  const permArgsCode = document.getElementById('permArgsCode');
  const permHashCode = document.getElementById('permHashCode');
  const permResultBox = document.getElementById('permResultBox');
  const permApproveBtn = document.getElementById('permApproveBtn');
  const permTamperBtn = document.getElementById('permTamperBtn');
  const permResetBtn = document.getElementById('permResetBtn');

  if (permArgsCode && permHashCode && permResultBox && permApproveBtn && permTamperBtn && permResetBtn) {
    const defaultArgs = '["npx", "vitest", "run", "tests/security/"]';
    const defaultHash = 'sha256:8f9c2a04...77e41b';

    permApproveBtn.addEventListener('click', () => {
      permArgsCode.textContent = defaultArgs;
      permHashCode.textContent = defaultHash;
      permResultBox.className = 'perm-result approved';
      permResultBox.textContent =
        'SHA-256 payload verified. AgentCommandRunner executed with 1 MB output cap & secret redaction.';
      announce('Tool execution approved with verified SHA-256 payload hash.');
    });

    permTamperBtn.addEventListener('click', () => {
      permArgsCode.textContent = '["sh", "-c", "cat ~/.ssh/id_rsa"]  // MUTATED';
      permHashCode.textContent = 'expected: 8f9c2a04... ≠ actual: d41d8cd9...';
      permResultBox.className = 'perm-result tampered';
      permResultBox.textContent =
        'ToctouTamperingError: Approved argument hash mismatch — execution aborted immediately.';
      announce('TOCTOU tampering detected and aborted.');
    });

    permResetBtn.addEventListener('click', () => {
      permArgsCode.textContent = defaultArgs;
      permHashCode.textContent = defaultHash;
      permResultBox.className = 'perm-result';
      permResultBox.textContent =
        'Execution blocked until explicit user decision matches approved SHA-256 hash.';
    });
  }

  // Theme-aligned Circle Cursor (desktop fine pointers only, zero idle rAF overhead)
  const cursorLayer = document.getElementById('cursorLayer');
  const cursorRing = document.getElementById('cursorRing');
  const cursorDot = document.getElementById('cursorDot');
  const supportsFinePointer =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (cursorLayer && cursorRing && cursorDot && supportsFinePointer) {
    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId = null;
    let hasMoved = false;

    const interactiveSelector =
      'a, button, [role="tab"], [role="button"], .provider-tile, .feature-card, .sec-card';
    const textSelector = 'code, pre, input, textarea';

    function renderCursor() {
      const dx = targetX - ringX;
      const dy = targetY - ringY;
      ringX += dx * 0.22;
      ringY += dy * 0.22;
      cursorRing.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0)`;

      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        rafId = requestAnimationFrame(renderCursor);
      } else {
        ringX = targetX;
        ringY = targetY;
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        rafId = null;
      }
    }

    function updateStateFromTarget(el) {
      if (!(el instanceof Element)) return;
      const isInteractive = Boolean(el.closest(interactiveSelector));
      const isText = !isInteractive && Boolean(el.closest(textSelector));
      cursorLayer.classList.toggle('is-hovering', isInteractive);
      cursorLayer.classList.toggle('is-text', isText);
    }

    document.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') {
          document.body.classList.remove('has-custom-cursor');
          cursorLayer.classList.remove('is-visible');
          return;
        }

        targetX = e.clientX;
        targetY = e.clientY;
        cursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

        if (!hasMoved) {
          hasMoved = true;
          ringX = targetX;
          ringY = targetY;
          cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
          document.body.classList.add('has-custom-cursor');
        }

        cursorLayer.classList.add('is-visible');
        updateStateFromTarget(e.target);

        if (!rafId) {
          rafId = requestAnimationFrame(renderCursor);
        }
      },
      { passive: true }
    );

    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      cursorLayer.classList.add('is-pressed');
    });

    document.addEventListener('pointerup', () => {
      cursorLayer.classList.remove('is-pressed');
    });

    document.documentElement.addEventListener('mouseleave', () => {
      cursorLayer.classList.remove('is-visible', 'is-pressed');
    });

    window.addEventListener('blur', () => {
      cursorLayer.classList.remove('is-visible', 'is-pressed');
    });
  }

  // Scroll Progress Rail, Scroll-Scrubbed 3D App Tilt & IntersectionObserver Choreography
  const scrollProgressEl = document.getElementById('scrollProgress');
  const appPreviewEl = document.getElementById('appPreview');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function syncScrollAnimations() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const ratio = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

    if (scrollProgressEl) {
      scrollProgressEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }

    if (appPreviewEl && !reducedMotion && window.innerWidth > 980) {
      const heroShift = Math.min(window.scrollY / 650, 1);
      const tiltY = -5.5 + heroShift * 3.8;
      const tiltX = 2.5 - heroShift * 1.4;
      appPreviewEl.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
      appPreviewEl.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    }
  }

  syncScrollAnimations();
  window.addEventListener('scroll', syncScrollAnimations, { passive: true });
  window.addEventListener('resize', syncScrollAnimations);

  // Staggered Scroll Reveal Triggers
  const revealNodes = document.querySelectorAll('[data-reveal]');
  document.querySelectorAll('[data-reveal-stagger]').forEach((group) => {
    const children = group.querySelectorAll('[data-reveal]');
    children.forEach((child, idx) => {
      child.style.setProperty('--reveal-delay', `${Math.min(idx * 45, 360)}ms`);
    });
  });

  function revealVisibleOrPassed() {
    const cutoff = window.innerHeight * 0.94;
    revealNodes.forEach((node) => {
      if (node.classList.contains('is-revealed')) return;
      if (node.getBoundingClientRect().top <= cutoff) {
        node.classList.add('is-revealed');
      }
    });
  }

  if (!reducedMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim-ready');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    );

    revealNodes.forEach((node) => {
      if (node.getBoundingClientRect().top <= window.innerHeight * 0.94) {
        node.classList.add('is-revealed');
      } else {
        revealObserver.observe(node);
      }
    });
    window.addEventListener('scroll', revealVisibleOrPassed, { passive: true });
  } else {
    revealNodes.forEach((node) => node.classList.add('is-revealed'));
  }
})();

