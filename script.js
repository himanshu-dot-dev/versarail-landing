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

  // Interactive Preview: Sidebar View Switcher
  const sideItems = document.querySelectorAll('.app-sidebar .side-item');
  const previewPanes = document.querySelectorAll('.preview-pane');

  function activatePreviewView(viewName) {
    sideItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    previewPanes.forEach((pane) => {
      pane.classList.toggle('active', pane.dataset.pane === viewName);
    });
  }

  sideItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      activatePreviewView(btn.dataset.view);
    });
  });

  // Interactive Preview: Inspector Tabs (Diff / Files / Activity)
  const insTabs = document.querySelectorAll('.ins-tab');
  const insPanels = document.querySelectorAll('.inspector-panel');

  insTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.inspector;
      insTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      insPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.inspectorPane === target);
      });
    });
  });

  // Interactive Preview: DiffViewer Accept / Reject simulation
  const acceptDiffBtn = document.getElementById('acceptDiffBtn');
  const rejectDiffBtn = document.getElementById('rejectDiffBtn');
  const diffStatusNote = document.getElementById('diffStatusNote');

  if (acceptDiffBtn && rejectDiffBtn && diffStatusNote) {
    acceptDiffBtn.addEventListener('click', () => {
      diffStatusNote.textContent = 'Committed atomically (temp + fsync + rename)';
      diffStatusNote.style.color = '#34d399';
      announce('Demo diff accepted atomically.');
    });

    rejectDiffBtn.addEventListener('click', () => {
      diffStatusNote.textContent = 'Patch discarded — 0 bytes written to disk';
      diffStatusNote.style.color = '#f87171';
      announce('Demo diff rejected; zero bytes written.');
    });
  }

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
        diffStatusNote.style.color = '#38bdf8';
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
        if (healthText) healthText.textContent = 'Groq Llama 3.3 70B · Failover';
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
        if (healthText) healthText.textContent = 'Gemini 2.5 Flash · Ready';
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
})();

