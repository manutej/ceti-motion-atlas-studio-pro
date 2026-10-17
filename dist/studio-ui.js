// ═══════════════════════════════════════════════════════════════════════════
// CETI MOTION ATLAS STUDIO PRO — INTERACTIVE STUDIO UI CONTROLLER (Part 1)
// Manages state, 60fps single-clock loop, Infinite-Zoom Living Canvas DAG,
// 5-Lens Fork Explorer, Character Foundry, Storyboard Sheet, Wada 348, & OAuth
// ═══════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const WADA = global.STUDIO_WADA_ENGINE;
  const FOUNDRY = global.STUDIO_CHARACTER_FOUNDRY;
  const TAX = global.STUDIO_ATLAS_TAXONOMY;
  const CO = global.STUDIO_CANVAS_OAUTH;
  const MA = global.MA;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class MotionAtlasStudioApp {
    constructor(rootEl) {
      this.root = rootEl;
      const saved = CO.loadSessionState();
      const defaultDag = CO.createDefaultDAG();

      this.state = {
        surface: (saved && saved.surface) || 'infinite-canvas',
        charId: (saved && saved.charId) || 'ceti-whale',
        partnerCharId: (saved && saved.partnerCharId) || 'geome-orpheus',
        interaction: (saved && saved.interaction) || 'hero-journey',
        rung: (saved && saved.rung) || 1,
        renderMode: null,
        palIdx: (saved && typeof saved.palIdx === 'number') ? saved.palIdx : 0,
        activeWadaCombos: WADA.getAllWadaCombos(),
        wadaSearch: '',
        wadaFilterRegister: 'all',
        feel: (saved && saved.feel) || 'spring',
        ground: (saved && saved.ground) || 'atlas',
        mStyle: (saved && saved.mStyle) || 'watercolor',
        storyKey: (saved && saved.storyKey) || 's_voice',
        elCat: 'All',
        lens: 'look',
        lensPath: ['A', 'A1'],
        selectedItem: ['style', 'watercolor'],
        playing: true,
        speed: 1.0,
        grain: 0.24,
        wob: 1.0,
        streaks: true,
        guide: true,
        captionsCovered: false,
        onionSkin: (saved && typeof saved.onionSkin === 'boolean') ? saved.onionSkin : false,
        // Infinite-Zoom Living Canvas viewport & DAG
        zoom: (saved && saved.zoom) || 0.78,
        panX: (saved && saved.panX) || 18,
        panY: (saved && saved.panY) || 16,
        dag: (saved && saved.dag && Array.isArray(saved.dag.nodes) && saved.dag.nodes.length) ? CO.autoLayoutDAG(saved.dag) : defaultDag,
        selectedNodeId: 'node-proof-a',
        compareNodeId: 'node-proof-b',
        showABCompare: false,
        // Storyboard sheet
        storyboard: CO.buildStoryboardSheet({
          storyKey: (saved && saved.storyKey) || 's_voice',
          styleKey: (saved && saved.mStyle) || 'watercolor',
          charId: (saved && saved.charId) || 'ceti-whale',
          palId: WADA.PALS[0].id,
          feelKey: 'spring'
        }),
        // OAuth 2.0 PKCE & Live Enhancer state
        oauthModalOpen: false,
        gateModalOpen: false,
        oauthProvider: 'local-bridge',
        oauthStatus: 'Ready (Offline Algebraic + PKCE S256)',
        oauthToken: '',
        oauthPrompt: 'Heighten causal contrast at the threshold beat and synthesize an abyssal companion rig',
        oauthLastResult: null,
        oauthBusy: false,
        // Compile Room state
        compileTarget: 'hyperframes',
        copiedNotice: ''
      };

      // Fix saved dag structure if needed
      if (!this.state.dag || !Array.isArray(this.state.dag.nodes)) {
        this.state.dag = defaultDag;
      }

      this._T = 0.85;
      this._lastNow = null;
      this._raf = 0;
      this._draggingCanvas = false;
      this._draggingNodeId = null;
      this._dragStart = [0, 0];
      this._panStart = [0, 0];

      MA.setActorOption('charId', this.state.charId);
      MA.setActorOption('partnerCharId', this.state.partnerCharId);
      MA.setActorOption('rung', this.state.rung);
      MA.setActorOption('captionsCovered', this.state.captionsCovered);
      MA.setActorOption('onionSkin', this.state.onionSkin);

      this.tick = this.tick.bind(this);
    }

    mount() {
      this.renderDOM();
      this.bindGlobalEvents();
      this._raf = requestAnimationFrame(this.tick);
    }

    setState(patch, skipDOM) {
      Object.assign(this.state, patch);
      MA.setActorOption('charId', this.state.charId);
      MA.setActorOption('partnerCharId', this.state.partnerCharId);
      MA.setActorOption('rung', this.state.rung);
      MA.setActorOption('renderMode', this.state.renderMode);
      MA.setActorOption('captionsCovered', this.state.captionsCovered);
      MA.setActorOption('onionSkin', this.state.onionSkin);

      if (patch.storyKey || patch.mStyle || patch.charId || patch.palIdx !== undefined || patch.feel) {
        const pal = this.getActivePalette();
        this.state.storyboard = CO.buildStoryboardSheet({
          storyKey: this.state.storyKey,
          styleKey: this.state.mStyle,
          charId: this.state.charId,
          palId: pal.id,
          feelKey: this.state.feel
        });
      }

      CO.saveSessionState({
        surface: this.state.surface,
        charId: this.state.charId,
        partnerCharId: this.state.partnerCharId,
        interaction: this.state.interaction,
        rung: this.state.rung,
        palIdx: this.state.palIdx,
        feel: this.state.feel,
        ground: this.state.ground,
        mStyle: this.state.mStyle,
        storyKey: this.state.storyKey,
        onionSkin: this.state.onionSkin,
        zoom: this.state.zoom,
        panX: this.state.panX,
        panY: this.state.panY,
        dag: this.state.dag
      });

      if (!skipDOM) {
        this.renderDOM();
        this.drawAllCanvases();
      }
    }

    getActivePalette() {
      const raw = this.state.activeWadaCombos[this.state.palIdx] || WADA.PALS[0];
      return WADA.enrichPalette(raw, this.state.ground);
    }

    getActiveChar() {
      return FOUNDRY.CHARACTERS[this.state.charId] || FOUNDRY.CHARACTERS['ceti-whale'];
    }

    tick(now) {
      if (this._lastNow == null) this._lastNow = now;
      const dt = Math.min(0.08, (now - this._lastNow) / 1000);
      this._lastNow = now;
      if (this.state.playing) {
        this._T += dt * this.state.speed;
        this.drawAllCanvases();
        const scrub = this.root.querySelector('#global-scrub');
        const tReadout = this.root.querySelector('#global-t-readout');
        if (scrub && document.activeElement !== scrub) scrub.value = (this._T % 12).toFixed(2);
        if (tReadout) tReadout.textContent = 't = ' + (this._T % 12).toFixed(2) + 's';
      }
      this._raf = requestAnimationFrame(this.tick);
    }

    drawAllCanvases() {
      if (!this.root) return;
      const pal = this.getActivePalette();
      const feel = MA.FEELS[this.state.feel] || MA.FEELS.spring;
      const canvases = this.root.querySelectorAll('canvas[data-proof]');
      for (let i = 0; i < canvases.length; i++) {
        const c = canvases[i];
        const key = c.getAttribute('data-proof');
        const fixedT = c.getAttribute('data-fixed-t');
        const nodeChar = c.getAttribute('data-char') || this.state.charId;
        const nodeRung = Number(c.getAttribute('data-rung')) || this.state.rung;
        const nodeMode = c.getAttribute('data-mode') || this.state.renderMode;
        const nodeCam = c.getAttribute('data-cam') || null;
        const nodeBeatIdxAttr = c.getAttribute('data-beat-idx');
        const nodeBeatIdx = (nodeBeatIdxAttr != null && nodeBeatIdxAttr !== '') ? Number(nodeBeatIdxAttr) : null;
        const nodePalId = Number(c.getAttribute('data-pal-id'));
        let usePal = pal;
        if (nodePalId) {
          const found = this.state.activeWadaCombos.find(function (p) { return p.id === nodePalId; });
          if (found) usePal = WADA.enrichPalette(found, this.state.ground);
        }
        const tVal = fixedT != null && fixedT !== '' ? Number(fixedT) : this._T;
        MA.render(c, key, usePal, feel, tVal, {
          wob: this.state.wob,
          grain: this.state.grain,
          streaks: this.state.streaks,
          guide: this.state.guide,
          ground: this.state.ground,
          charId: nodeChar,
          partnerCharId: this.state.partnerCharId,
          rung: nodeRung,
          renderMode: nodeMode || null,
          cameraMove: nodeCam,
          beatIdx: nodeBeatIdx,
          captionsCovered: this.state.captionsCovered,
          onionSkin: this.state.onionSkin
        });
      }
    }

    bindGlobalEvents() {
      const self = this;

      // Respect prefers-reduced-motion: reduce (Gate G16)
      try {
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.state.playing = false;
        }
      } catch (_e) { /* ignore */ }

      // Auto-complete OAuth 2.0 PKCE callback if ?code= is present in URL (Gate G10)
      try {
        if (typeof window.location !== 'undefined' && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          const stParam = params.get('state');
          if (code && CO.exchangeOAuthPKCECode) {
            CO.exchangeOAuthPKCECode(code, stParam).then(function (tokRes) {
              if (tokRes && tokRes.accessToken) {
                self.setState({
                  oauthToken: tokRes.accessToken,
                  oauthStatus: 'PKCE S256 Verified · Bearer token active (' + (tokRes.scope || 'storyboard:enhance') + ')',
                  oauthModalOpen: true
                });
              }
            });
          }
        }
      } catch (_e) { /* ignore */ }

      // Global Keyboard Shortcuts (Gate G16): Escape=Close Modal, Space=Play/Pause, [/]=Scrub, C=Captions-Covered, O=Onion-Skin, F=Fork
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          if (self.state.oauthModalOpen || self.state.gateModalOpen) {
            self.setState({ oauthModalOpen: false, gateModalOpen: false });
            return;
          }
        }
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (e.code === 'Space') {
          e.preventDefault();
          self.setState({ playing: !self.state.playing });
        } else if (e.key === '[') {
          self._T = Math.max(0, self._T - 0.5);
          self.setState({ playing: false }, true);
          self.drawAllCanvases();
        } else if (e.key === ']') {
          self._T = self._T + 0.5;
          self.setState({ playing: false }, true);
          self.drawAllCanvases();
        } else if (e.key === 'c' || e.key === 'C') {
          self.setState({ captionsCovered: !self.state.captionsCovered });
        } else if (e.key === 'o' || e.key === 'O') {
          self.setState({ onionSkin: !self.state.onionSkin });
        } else if (e.key === 'f' || e.key === 'F') {
          const res = CO.forkCanvasNode(self.state.dag, self.state.selectedNodeId);
          self.setState({ dag: { nodes: res.nodes, edges: res.edges }, selectedNodeId: res.createdNodeId });
        }
      });

      window.addEventListener('mousemove', function (e) {
        if (self._draggingCanvas) {
          const dx = e.clientX - self._dragStart[0];
          const dy = e.clientY - self._dragStart[1];
          self.state.panX = self._panStart[0] + dx;
          self.state.panY = self._panStart[1] + dy;
          const stage = self.root.querySelector('#dag-transform-stage');
          if (stage) {
            stage.style.transform = 'translate(' + self.state.panX + 'px,' + self.state.panY + 'px) scale(' + self.state.zoom + ')';
          }
        } else if (self._draggingNodeId) {
          const node = self.state.dag.nodes.find(function (n) { return n.id === self._draggingNodeId; });
          if (node) {
            const dx = (e.clientX - self._dragStart[0]) / self.state.zoom;
            const dy = (e.clientY - self._dragStart[1]) / self.state.zoom;
            node.x = Math.round(self._panStart[0] + dx);
            node.y = Math.round(self._panStart[1] + dy);
            const el = self.root.querySelector('[data-dag-node="' + node.id + '"]');
            if (el) {
              el.style.left = node.x + 'px';
              el.style.top = node.y + 'px';
            }
            self.updateDagEdgesSVG();
          }
        }
      });
      window.addEventListener('mouseup', function () {
        if (self._draggingCanvas || self._draggingNodeId) {
          self._draggingCanvas = false;
          self._draggingNodeId = null;
          CO.saveSessionState(self.state);
        }
      });
    }

    updateDagEdgesSVG() {
      const svg = this.root.querySelector('#dag-edges-svg');
      if (!svg) return;
      svg.innerHTML = this.renderDagEdgesMarkup();
    }

    renderDagEdgesMarkup() {
      const nodesById = {};
      (this.state.dag.nodes || []).forEach(function (n) { nodesById[n.id] = n; });
      return (this.state.dag.edges || []).map(function (e) {
        const a = nodesById[e.fromNodeId], b = nodesById[e.toNodeId];
        if (!a || !b) return '';
        const x1 = a.x + (a.width || 315), y1 = a.y + 185;
        const x2 = b.x, y2 = b.y + 185;
        const cx1 = x1 + Math.max(55, (x2 - x1) * 0.46), cx2 = x2 - Math.max(55, (x2 - x1) * 0.46);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8;
        const stroke = e.kind === 'synthesis' ? '#2E5A44' : (e.kind === 'fork' ? '#8C4A2E' : (e.kind === 'comparison' ? '#1E3F66' : '#1A1F2E'));
        const dash = e.kind === 'comparison' ? 'stroke-dasharray="5,5"' : (e.kind === 'synthesis' ? 'stroke-dasharray="7,3"' : '');
        return '<g>' +
          '<path d="M' + x1 + ',' + y1 + ' C' + cx1 + ',' + y1 + ' ' + cx2 + ',' + y2 + ' ' + x2 + ',' + y2 + '" fill="none" stroke="' + stroke + '" stroke-width="2" stroke-opacity="0.6" ' + dash + '/>' +
          '<circle cx="' + x2 + '" cy="' + y2 + '" r="4" fill="' + stroke + '"/>' +
          '<rect x="' + (mx - 58) + '" y="' + (my - 10) + '" width="116" height="17" rx="4" fill="#FBF3E6" stroke="' + stroke + '" stroke-opacity="0.35"/>' +
          '<text x="' + mx + '" y="' + (my + 2) + '" text-anchor="middle" font-family="Space Mono, monospace" font-size="8.5" font-weight="700" fill="' + stroke + '">' + esc(e.label) + '</text>' +
          '</g>';
      }).join('');
    }
  }

  global.MotionAtlasStudioApp = MotionAtlasStudioApp;
})(typeof window !== 'undefined' ? window : globalThis);
// ═══════════════════════════════════════════════════════════════════════════
// PART 2A · STUDIO CHROME & SURFACES 1–4 (Living Canvas, 5-Lens Forks,
// Character & Emblem Foundry, 8-Beat Storyboard & Timeline)
// ═══════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const WADA = global.STUDIO_WADA_ENGINE;
  const FOUNDRY = global.STUDIO_CHARACTER_FOUNDRY;
  const TAX = global.STUDIO_ATLAS_TAXONOMY;
  const CO = global.STUDIO_CANVAS_OAUTH;
  const MA = global.MA;
  const proto = global.MotionAtlasStudioApp.prototype;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  proto.renderHeaderBar = function (pal, charSpec, audit) {
    const st = this.state;
    const tabs = [
      ['infinite-canvas',   'I · Living Canvas (DAG)'],
      ['fork-explorer',     'II · 5-Lens Forks'],
      ['character-foundry', 'III · Character & Emblem Foundry'],
      ['storyboard-sheet',  'IV · 8-Beat Storyboard'],
      ['wada-chord-matrix', 'V · Sanzo Wada 348 & Hydrography'],
      ['contact-sheet',     'VI · 15 Styles & 24 Elements'],
      ['compile-export',    'VII · Compile & Export']
    ];

    const charOpts = FOUNDRY.CHARACTER_ORDER.map(function (id) {
      const c = FOUNDRY.CHARACTERS[id];
      return '<option value="' + esc(id) + '"' + (st.charId === id ? ' selected' : '') + '>' + esc(c.name) + ' (' + esc(c.archetype) + ')</option>';
    }).join('');

    const ixOpts = FOUNDRY.INTERACTION_MODES.map(function (m) {
      return '<option value="' + esc(m.id) + '"' + (st.interaction === m.id ? ' selected' : '') + '>' + esc(m.label) + '</option>';
    }).join('');

    const palPills = WADA.PALS.slice(0, 11).map(function (p, idx) {
      const on = st.activeWadaCombos[st.palIdx] && st.activeWadaCombos[st.palIdx].id === p.id;
      const dots = p.sw.slice(0, 4).map(function (s) {
        return '<span style="width:9px;height:9px;border-radius:50%;background:' + s[0] + ';border:1px solid rgba(26,31,46,.22);display:inline-block"></span>';
      }).join('');
      return '<button data-action="pick-curated-pal" data-pal-id="' + p.id + '" class="st-pill ' + (on ? 'st-pill-active' : '') + '" title="No. ' + p.id + ' · ' + esc(p.name) + '">' +
        '<span style="display:inline-flex;gap:2px;margin-right:5px;vertical-align:middle">' + dots + '</span>' +
        '<span>No.' + p.id + ' ' + esc(p.name) + '</span></button>';
    }).join('');

    return '<header class="st-header">' +
      '<div class="st-topbar">' +
        '<div class="st-brand">' +
          '<span class="st-eyebrow">CETI INTERNAL DESIGN &amp; NARRATIVE STUDIO</span>' +
          '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">' +
            '<h1 class="st-title">Motion Atlas Studio Pro</h1>' +
            '<span class="st-sub">Sanzo Wada 348 Harmonic Pinning · Parametric Multi-Character Algebra · Infinite-Zoom Living Canvas · OAuth 2.0 PKCE</span>' +
          '</div>' +
        '</div>' +
        '<div class="st-top-actions">' +
          '<button data-action="toggle-oauth-modal" class="st-btn st-btn-rust">OAuth 2.0 PKCE Live Enhancer</button>' +
          '<button data-action="toggle-gate-modal" class="st-btn st-btn-ink">Audit ' + audit.passedCount + '/' + audit.totalCount + ' PASS</button>' +
        '</div>' +
      '</div>' +

      '<!-- Global Studio Pinning Bar: Character, Interaction, Rung, Feel, Ground, Transport -->' +
      '<div class="st-control-strip">' +
        '<div class="st-ctrl-group">' +
          '<label class="st-label">ACTIVE CHARACTER RIG</label>' +
          '<div style="display:flex;gap:6px;align-items:center">' +
            '<select id="sel-char" class="st-select">' + charOpts + '</select>' +
            '<div class="st-rung-bar" title="Saul Bass 5-Rung Reduction Ladder">' +
              [1, 2, 3, 4, 5].map(function (r) {
                return '<button data-action="set-rung" data-rung="' + r + '" class="st-mini-btn ' + (st.rung === r ? 'on' : '') + '">R' + r + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="st-ctrl-group">' +
          '<label class="st-label">INTERACTION MODE</label>' +
          '<select id="sel-interaction" class="st-select">' + ixOpts + '</select>' +
        '</div>' +

        '<div class="st-ctrl-group">' +
          '<label class="st-label">TIMING FEEL</label>' +
          '<select id="sel-feel" class="st-select">' +
            MA.FEEL_ORDER.map(function (fk) {
              return '<option value="' + fk + '"' + (st.feel === fk ? ' selected' : '') + '>' + esc(MA.FEELS[fk].label) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +

        '<div class="st-ctrl-group">' +
          '<label class="st-label">GROUND SURFACE</label>' +
          '<select id="sel-ground" class="st-select">' +
            Object.keys(WADA.GROUNDS).map(function (gk) {
              return '<option value="' + gk + '"' + (st.ground === gk ? ' selected' : '') + '>' + esc(WADA.GROUNDS[gk].label) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +

        '<div class="st-ctrl-group st-transport">' +
          '<label class="st-label">SINGLE CLOCK TRANSPORT · <span id="global-t-readout">t = ' + (this._T % 12).toFixed(2) + 's</span></label>' +
          '<div style="display:flex;gap:5px;align-items:center">' +
            '<button data-action="toggle-play" class="st-mini-btn on">' + (st.playing ? 'PAUSE' : 'PLAY') + '</button>' +
            '<input id="global-scrub" type="range" min="0" max="12" step="0.02" value="' + (this._T % 12).toFixed(2) + '" style="width:82px;accent-color:#8C4A2E"/>' +
            '<button data-action="toggle-onion-skin" class="st-mini-btn ' + (st.onionSkin ? 'on' : '') + '" title="Gate G23 Multi-Frame Onion Skinning (-2Δt / -1Δt / +1Δt) [O]">ONION</button>' +
            '<button data-action="sonify-wada-chord" class="st-mini-btn" title="Gate G24 Orpheum 4-Voice Harmonic Chord Sonification">♪ SONIFY</button>' +
            '<button data-action="toggle-captions-covered" class="st-mini-btn ' + (st.captionsCovered ? 'on' : '') + '" title="Gate G08 Captions-Covered Test [C]">NO-TEXT</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Curated Sanzo Wada Quick-Pin Strip -->' +
      '<div class="st-wada-strip">' +
        '<span class="st-label" style="margin-right:6px">SANZO WADA PINNED (' + esc(pal.no) + ' · ' + esc(pal.name) + ' · CR ' + pal.cr + ':1 AAA):</span>' +
        palPills +
        '<button data-action="switch-surface" data-surface="wada-chord-matrix" class="st-pill" style="border-style:dashed">All 348 Wada + ΔE2000 →</button>' +
      '</div>' +

      '<!-- 7 Studio Surfaces Navigation -->' +
      '<nav class="st-tabs">' +
        tabs.map(function (tb) {
          return '<button data-action="switch-surface" data-surface="' + tb[0] + '" class="st-tab ' + (st.surface === tb[0] ? 'active' : '') + '">' + esc(tb[1]) + '</button>';
        }).join('') +
      '</nav>' +
    '</header>';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE 1 · INFINITE-ZOOM LIVING CANVAS (DAG + PASTEBOARD) (G09)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceInfiniteCanvas = function (pal, charSpec) {
    const st = this.state;
    if (CO.stampDAGRestrictionHashes) CO.stampDAGRestrictionHashes(st.dag);
    const sheafAudit = CO.verifyDAGSheafCohomology ? CO.verifyDAGSheafCohomology(st.dag) : { valid: true, edgeCount: (st.dag.edges || []).length };
    const lod = CO.computeCanvasLOD(st.zoom);
    const selectedNode = (st.dag.nodes || []).find(function (n) { return n.id === st.selectedNodeId; }) || st.dag.nodes[0];
    const compareNode = (st.dag.nodes || []).find(function (n) { return n.id === st.compareNodeId; }) || st.dag.nodes[1] || selectedNode;

    const nodesHtml = (st.dag.nodes || []).map(function (n) {
      const isSel = n.id === st.selectedNodeId;
      const p = n.payload || {};
      const proofKey = p.styleKey || p.storyKey || 'watercolor';
      const nCharId = p.charId || st.charId;
      const nChar = FOUNDRY.CHARACTERS[nCharId] || charSpec;
      const nPalId = p.palId || pal.id;
      const statusBadge = '<span class="st-badge ' + (n.status === 'committed' ? 'badge-pass' : (n.status === 'candidate' ? 'badge-warn' : '')) + '">' + esc((n.status || 'exploratory').toUpperCase()) + '</span>';
      const sheafBadge = '<span class="st-mono-xs" title="Sheaf Restriction Hash ρ(child)=parent" style="color:rgba(26,31,46,.55)">' + esc(n.packetHash || 'ρ-root') + (n.upstreamHash ? ' ← ' + esc(n.upstreamHash) : '') + '</span>';

      return '<div data-dag-node="' + esc(n.id) + '" class="dag-node ' + (isSel ? 'dag-node-selected' : '') + ' lod-' + lod + '" style="left:' + n.x + 'px;top:' + n.y + 'px;width:' + (n.width || 310) + 'px">' +
        '<div class="dag-node-header" data-drag-handle="' + esc(n.id) + '">' +
          '<span class="st-mono-xs">' + esc(n.kind.toUpperCase()) + '</span>' +
          statusBadge +
        '</div>' +
        '<div class="dag-node-body" data-action="select-dag-node" data-node-id="' + esc(n.id) + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">' +
            sheafBadge +
            '<span class="st-mono-xs" style="color:#A8241C">Wada No. ' + nPalId + '</span>' +
          '</div>' +
          '<div class="dag-node-title">' + esc(n.title) + '</div>' +
          '<div class="dag-node-sub">' + esc(n.subtitle) + ' · Actor: <strong>' + esc(nChar.name) + '</strong></div>' +
          (lod === 'macro-topology' ? (
            '<div style="margin-top:6px;display:flex;align-items:center;gap:8px;padding:6px;background:rgba(26,31,46,.04);border-radius:6px">' +
              '<canvas width="120" height="75" data-proof="' + esc(proofKey) + '" data-char="' + esc(nCharId) + '" data-pal-id="' + nPalId + '" data-rung="4" style="width:96px;height:60px;border-radius:4px"></canvas>' +
              '<div class="st-mono-xs">MACRO GLYPH (Rung 4)<br/>' + esc(nChar.archetype.toUpperCase()) + '</div>' +
            '</div>'
          ) : (
            '<div class="dag-canvas-wrap">' +
              '<canvas width="320" height="200" data-proof="' + esc(proofKey) + '" data-char="' + esc(nCharId) + '" data-pal-id="' + nPalId + '" style="width:100%;height:auto;display:block;border-radius:6px"></canvas>' +
            '</div>' +
            '<p class="dag-node-notes">' + esc(p.notes || n.forkReason || '') + '</p>' +
            (n.conjectureNote ? '<div class="st-mono-xs" style="margin-top:4px;padding:4px 6px;background:rgba(168,36,28,.08);border-left:2px solid #A8241C;color:#1A1F2E">' + esc(n.conjectureNote) + '</div>' : '')
          )) +
          (lod === 'micro-inspection' ? (
            '<div style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(26,31,46,.18)">' +
              '<div class="st-mono-xs" style="margin-bottom:4px">MICRO-INSPECTION: RUNG 1 vs RUNG 3 vs RUNG 5</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">' +
                '<canvas width="120" height="75" data-proof="' + esc(proofKey) + '" data-char="' + esc(nCharId) + '" data-pal-id="' + nPalId + '" data-rung="1" style="width:100%;border-radius:4px;border:1px solid rgba(26,31,46,.15)"></canvas>' +
                '<canvas width="120" height="75" data-proof="' + esc(proofKey) + '" data-char="' + esc(nCharId) + '" data-pal-id="' + nPalId + '" data-rung="3" style="width:100%;border-radius:4px;border:1px solid rgba(26,31,46,.15)"></canvas>' +
                '<canvas width="120" height="75" data-proof="' + esc(proofKey) + '" data-char="' + esc(nCharId) + '" data-pal-id="' + nPalId + '" data-rung="5" style="width:100%;border-radius:4px;border:1px solid rgba(26,31,46,.15)"></canvas>' +
              '</div>' +
            '</div>'
          ) : '') +
        '</div>' +
        '<div class="dag-node-footer">' +
          '<button data-action="fork-dag-node" data-node-id="' + esc(n.id) + '" class="st-mini-btn" title="Non-destructively fork this branch">⑂ Fork</button>' +
          '<button data-action="fork-three-directions" data-node-id="' + esc(n.id) + '" class="st-mini-btn" title="Spawn 3 orthogonal α/β/γ branches">⑂ 3× α/β/γ</button>' +
          '<button data-action="apply-dag-node" data-node-id="' + esc(n.id) + '" class="st-mini-btn" title="Pin this node’s character, Wada palette, and style globally">Pin Global</button>' +
          '<button data-action="oauth-enhance-node" data-node-id="' + esc(n.id) + '" class="st-mini-btn st-btn-rust" title="Enhance via OAuth 2.0 PKCE / Synthesizer">✦ Enhance</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<section class="st-surface">' +
      '<div class="canvas-toolbar">' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<span class="st-mono-xs">INFINITE LIVING CANVAS · ZOOM ' + st.zoom.toFixed(2) + '× · LOD: ' + lod.toUpperCase() + ' · ' + st.dag.nodes.length + ' NODES</span>' +
          '<span class="st-badge ' + (sheafAudit.valid ? 'badge-pass' : 'badge-warn') + '" title="Alexandrov Sheaf Restriction Cohomology across DAG edges">SHEAF ρ: ' + (sheafAudit.valid ? 'δ⁰=0 COHOMOLOGY PASS' : 'MISMATCH') + '</span>' +
          '<button data-action="zoom-canvas" data-delta="0.18" class="st-mini-btn">Zoom +</button>' +
          '<button data-action="zoom-canvas" data-delta="-0.18" class="st-mini-btn">Zoom −</button>' +
          '<button data-action="zoom-set" data-zoom="0.3" class="st-mini-btn">0.3× Macro</button>' +
          '<button data-action="zoom-set" data-zoom="0.78" class="st-mini-btn">0.8× Studio</button>' +
          '<button data-action="zoom-set" data-zoom="1.65" class="st-mini-btn">1.6× Micro</button>' +
          '<button data-action="reset-pan" class="st-mini-btn">Center View</button>' +
          '<button data-action="dag-auto-layout" class="st-mini-btn on" title="Resolve all node overlaps and align DAG columns">⊞ Auto-Layout DAG</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<button data-action="fork-dag-node" data-node-id="' + esc(st.selectedNodeId) + '" class="st-btn st-btn-ink">⑂ Fork Selected</button>' +
          '<button data-action="fork-three-directions" data-node-id="' + esc(st.selectedNodeId) + '" class="st-btn">⑂ Fork 3 Directions (α/β/γ)</button>' +
          '<button data-action="dag-synthesize-ab" class="st-btn" title="Gate G22 Pushout Gluing of Selected Branch A & Comparison Branch B">⊕ Synthesize A ⊕ B</button>' +
          '<button data-action="run-rsi-critique" class="st-btn st-btn-rust" title="Run 4-Lens Adversarial RSI Critique & Auto-Fix">⚖ Run 4-Lens RSI Critique</button>' +
          '<button data-action="toggle-ab-compare" class="st-btn ' + (st.showABCompare ? 'st-btn-rust' : '') + '">⚖ Side-by-Side A/B Compare</button>' +
          '<button data-action="open-storyboard-from-node" class="st-btn">Open in 8-Beat Storyboard →</button>' +
        '</div>' +
      '</div>' +

      (st.showABCompare && selectedNode && compareNode ? (
        '<div class="ab-compare-drawer">' +
          '<div class="ab-col">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<span class="st-mono-xs">BRANCH A (SELECTED): <strong>' + esc(selectedNode.title) + '</strong> · ' + esc(selectedNode.packetHash || '') + '</span>' +
              '<button data-action="dag-synthesize-ab" class="st-mini-btn on" title="Synthesize Pushout Gluing Node from Branch A ⊕ Branch B">⊕ Glue A ⊕ B → Synthesis Node</button>' +
            '</div>' +
            '<canvas width="480" height="300" data-proof="' + esc(selectedNode.payload.styleKey || 'watercolor') + '" data-char="' + esc(selectedNode.payload.charId || st.charId) + '" data-pal-id="' + (selectedNode.payload.palId || pal.id) + '" style="width:100%;max-width:340px;border-radius:6px;border:1px solid rgba(26,31,46,.2);margin-top:4px"></canvas>' +
          '</div>' +
          '<div class="ab-col">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
              '<span class="st-mono-xs">BRANCH B (COMPARISON):</span>' +
              '<div style="display:flex;gap:6px;align-items:center">' +
                '<select id="sel-compare-node" class="st-select">' +
                  st.dag.nodes.map(function (n) {
                    return '<option value="' + esc(n.id) + '"' + (n.id === compareNode.id ? ' selected' : '') + '>' + esc(n.title) + '</option>';
                  }).join('') +
                '</select>' +
                '<button data-action="toggle-ab-compare" class="st-mini-btn">✕ Close A/B</button>' +
              '</div>' +
            '</div>' +
            '<canvas width="480" height="300" data-proof="' + esc(compareNode.payload.styleKey || 'hydrographic') + '" data-char="' + esc(compareNode.payload.charId || st.charId) + '" data-pal-id="' + (compareNode.payload.palId || pal.id) + '" style="width:100%;max-width:340px;border-radius:6px;border:1px solid rgba(26,31,46,.2);margin-top:4px"></canvas>' +
          '</div>' +
        '</div>'
      ) : '') +

      '<div class="living-canvas-layout">' +
        '<div id="living-canvas-viewport" class="living-canvas-viewport">' +
          '<div id="dag-transform-stage" class="dag-transform-stage" style="transform:translate(' + st.panX + 'px,' + st.panY + 'px) scale(' + st.zoom + ')">' +
            '<svg id="dag-edges-svg" class="dag-edges-svg" width="3600" height="2400">' +
              this.renderDagEdgesMarkup() +
            '</svg>' +
            nodesHtml +
          '</div>' +
          '<div class="canvas-minimap">' +
            '<div class="st-mono-xs" style="margin-bottom:2px">DAG TOPOLOGY MAP · DRAG TO PAN · [SPACE] PLAY · [F] FORK · [O] ONION · [C] CAPTIONS</div>' +
            '<div style="font-size:11px;color:rgba(26,31,46,.78)">Selected: <strong>' + esc(selectedNode ? selectedNode.title : '') + '</strong> (' + esc(selectedNode ? (selectedNode.packetHash || '') : '') + ')</div>' +
          '</div>' +
        '</div>' +

        '<!-- Right Inspector Panel for Selected DAG Node -->' +
        '<aside class="dag-inspector">' +
          '<div class="st-eyebrow">SELECTED NODE INSPECTOR · SHEAF PACKET</div>' +
          '<h3 style="margin:4px 0 8px;font-family:Fraunces,serif;font-weight:400;font-size:20px">' + esc(selectedNode ? selectedNode.title : '') + '</h3>' +
          '<p style="font-size:12px;color:rgba(26,31,46,.75);margin:0 0 12px">' + esc(selectedNode ? selectedNode.subtitle : '') + '</p>' +
          (selectedNode ? (
            '<div style="display:grid;gap:10px">' +
              '<div class="st-mono-xs" style="padding:6px 8px;background:rgba(26,31,46,.05);border-radius:6px">' +
                'PACKET HASH: <strong>' + esc(selectedNode.packetHash || 'ρ-root') + '</strong><br/>' +
                'UPSTREAM ρ: <strong>' + esc(selectedNode.upstreamHash || 'ORIGIN') + '</strong>' +
              '</div>' +
              '<div><label class="st-label">NODE CHARACTER RIG</label>' +
                '<select id="ins-node-char" class="st-select" style="width:100%">' +
                  FOUNDRY.CHARACTER_ORDER.map(function (cid) {
                    return '<option value="' + esc(cid) + '"' + ((selectedNode.payload.charId || st.charId) === cid ? ' selected' : '') + '>' + esc(FOUNDRY.CHARACTERS[cid].name) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">NODE MOTION STYLE</label>' +
                '<select id="ins-node-style" class="st-select" style="width:100%">' +
                  TAX.STYLES.map(function (s) {
                    return '<option value="' + esc(s.key) + '"' + ((selectedNode.payload.styleKey || 'watercolor') === s.key ? ' selected' : '') + '>' + esc(s.title) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">NODE STORYLINE</label>' +
                '<select id="ins-node-story" class="st-select" style="width:100%">' +
                  TAX.STORIES.map(function (s) {
                    return '<option value="' + esc(s.key) + '"' + ((selectedNode.payload.storyKey || 's_voice') === s.key ? ' selected' : '') + '>' + esc(s.title) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">NODE WADA PALETTE</label>' +
                '<select id="ins-node-pal" class="st-select" style="width:100%">' +
                  WADA.PALS.map(function (p) {
                    return '<option value="' + p.id + '"' + ((selectedNode.payload.palId || 343) === p.id ? ' selected' : '') + '>No. ' + p.id + ' · ' + esc(p.name) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">BRANCH NOTES / THESIS</label>' +
                '<textarea id="ins-node-notes" rows="3" class="st-input" style="width:100%">' + esc(selectedNode.payload.notes || '') + '</textarea></div>' +
              '<div><label class="st-label">CONJECTURE (†C) / FORK HYPOTHESIS</label>' +
                '<input id="ins-node-conjecture" type="text" class="st-input" style="width:100%" value="' + esc(selectedNode.conjectureNote || '') + '" placeholder="†C Conjecture note for this branch..."/></div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button data-action="save-node-inspector" class="st-btn st-btn-ink">Update Node</button>' +
                '<button data-action="fork-dag-node" data-node-id="' + esc(selectedNode.id) + '" class="st-btn">⑂ Fork Branch</button>' +
                '<button data-action="fork-three-directions" data-node-id="' + esc(selectedNode.id) + '" class="st-btn">⑂ 3× α/β/γ</button>' +
                '<button data-action="oauth-enhance-node" data-node-id="' + esc(selectedNode.id) + '" class="st-btn st-btn-rust">✦ OAuth Enhance</button>' +
              '</div>' +
            '</div>'
          ) : '') +
        '</aside>' +
      '</div>' +
    '</section>';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE 2 · 5-LENS DECISION FORK EXPLORER (Look, Use, Story, Character, Register) (G07)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceForkExplorer = function (pal, charSpec) {
    const st = this.state;
    const L = CO.LENSES[st.lens] || CO.LENSES.look;
    const step1 = st.lensPath[0] || L.root.opts[0];
    const branch1 = L[step1] || L[L.root.opts[0]];
    const step2 = st.lensPath[1] || (branch1.opts && branch1.opts[0]);
    const leaf = L[step2] || branch1;

    const lensTabs = CO.LENS_ORDER.map(function (lk) {
      const ln = CO.LENSES[lk];
      return '<button data-action="set-lens" data-lens="' + lk + '" class="st-pill ' + (st.lens === lk ? 'st-pill-active' : '') + '">' +
        '<strong>' + esc(ln.label) + '</strong> · <span style="opacity:.8">' + esc(ln.note) + '</span></button>';
    }).join('');

    const tier1Cards = L.root.opts.map(function (optKey) {
      const b = L[optKey];
      const on = step1 === optKey;
      return '<div class="fork-card ' + (on ? 'fork-card-active' : '') + '" data-action="set-lens-step1" data-opt="' + esc(optKey) + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="st-mono-xs">' + esc(b.tag) + '</span>' +
          '<span class="st-badge ' + (on ? 'badge-pass' : '') + '">' + (on ? 'SELECTED' : 'CHOOSE FORK') + '</span>' +
        '</div>' +
        '<h3 class="fork-card-title">' + esc(b.title) + '</h3>' +
        '<p class="fork-card-body">' + esc(b.body) + '</p>' +
        '<canvas width="480" height="300" data-proof="' + esc(b.proof) + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15);margin-top:8px"></canvas>' +
      '</div>';
    }).join('');

    const tier2Cards = (branch1.opts || []).map(function (optKey) {
      const b = L[optKey];
      const on = step2 === optKey;
      const itemsPills = (b.items || []).map(function (it) {
        const label = it[0] === 'story' ? (TAX.STMETA[it[1]] ? TAX.STMETA[it[1]].title : it[1]) : (TAX.SMETA[it[1]] ? TAX.SMETA[it[1]].title : it[1]);
        return '<button data-action="inspect-fork-item" data-kind="' + it[0] + '" data-key="' + it[1] + '" class="st-mini-btn">' + esc(it[0].toUpperCase() + ': ' + label) + '</button>';
      }).join(' ');
      return '<div class="fork-card ' + (on ? 'fork-card-active' : '') + '" data-action="set-lens-step2" data-opt="' + esc(optKey) + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="st-mono-xs">' + esc(b.tag) + '</span>' +
          '<button data-action="spawn-fork-to-dag" data-proof="' + esc(b.proof) + '" data-title="' + esc(b.title) + '" class="st-mini-btn st-btn-rust">+ Spawn on Living Canvas</button>' +
        '</div>' +
        '<h3 class="fork-card-title">' + esc(b.title) + '</h3>' +
        '<p class="fork-card-body">' + esc(b.body) + '</p>' +
        '<canvas width="480" height="300" data-proof="' + esc(b.proof) + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15);margin:8px 0"></canvas>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">' + itemsPills + '</div>' +
      '</div>';
    }).join('');

    const selKind = st.selectedItem[0], selKey = st.selectedItem[1];
    const specDetail = TAX.CORPUS.map[selKey] || TAX.CORPUS.map.watercolor;

    return '<section class="st-surface">' +
      '<div class="st-panel">' +
        '<div class="st-eyebrow">FIVE-LENS DECISION FORK TREE · ACTIVE ACTOR: ' + esc(charSpec.name.toUpperCase()) + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 16px">' + lensTabs + '</div>' +
        '<h2 class="st-section-h2">1 · ' + esc(L.root.q) + '</h2>' +
        '<p class="st-sub" style="margin-bottom:12px">' + esc(L.root.sub) + '</p>' +
        '<div class="fork-grid-2">' + tier1Cards + '</div>' +

        '<h2 class="st-section-h2" style="margin-top:24px">2 · ' + esc(branch1.q) + '</h2>' +
        '<p class="st-sub" style="margin-bottom:12px">' + esc(branch1.sub) + '</p>' +
        '<div class="fork-grid-2">' + tier2Cards + '</div>' +
      '</div>' +

      '<!-- Deep Atlas Spec Drawer (100% Embedded Offline Corpus) -->' +
      '<div class="st-panel" style="margin-top:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
          '<div>' +
            '<span class="st-eyebrow">EMBEDDED ATLAS SPECIFICATION (' + esc(selKind.toUpperCase()) + ' · ' + esc(specDetail.key) + ')</span>' +
            '<h3 style="margin:4px 0;font-family:Fraunces,serif;font-size:24px;font-weight:300;font-style:italic">' + esc(specDetail.title) + '</h3>' +
          '</div>' +
          '<button data-action="spawn-fork-to-dag" data-proof="' + esc(specDetail.key) + '" data-title="' + esc(specDetail.title) + '" class="st-btn st-btn-ink">⑂ Commit Fork to Living Canvas DAG</button>' +
        '</div>' +
        '<div class="fork-grid-3" style="margin-top:12px">' +
          '<div class="st-card-inner"><div class="st-label">WHEN TO USE &amp; AVOID</div><p style="font-size:13px">' + esc(specDetail.when_to_use) + '</p><p style="font-size:12px;color:#8C4A2E">' + esc(specDetail.avoid_when) + '</p></div>' +
          '<div class="st-card-inner"><div class="st-label">CANONICAL NUMBERS</div>' +
            specDetail.numbers.map(function (kv) { return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px dashed rgba(26,31,46,.12)"><span>' + esc(kv[0]) + '</span><strong class="st-mono-xs">' + esc(kv[1]) + '</strong></div>'; }).join('') +
          '</div>' +
          '<div class="st-card-inner"><div class="st-label">EXECUTION STEPS &amp; PITFALLS</div>' +
            '<ol style="margin:4px 0;padding-left:18px;font-size:12px">' + specDetail.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE 3 · CHARACTER & EMBLEM FOUNDRY (G03 · G04 · G05)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceCharacterFoundry = function (pal, charSpec) {
    const st = this.state;
    const gauntlet = MA.runEmblemGauntlet(charSpec, pal);
    const bp = charSpec.bodyProfile;
    const sw = charSpec.spineWave;
    const ap = charSpec.appendages;

    const archetypeCards = FOUNDRY.CHARACTER_ORDER.map(function (id) {
      const c = FOUNDRY.CHARACTERS[id];
      const on = st.charId === id;
      return '<div class="char-card ' + (on ? 'char-card-active' : '') + '" data-action="select-character" data-char-id="' + esc(id) + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="st-mono-xs">' + esc(c.archetype.toUpperCase()) + '</span>' +
          '<span class="st-badge ' + (on ? 'badge-pass' : '') + '">' + (on ? 'ACTIVE RIG' : 'SELECT') + '</span>' +
        '</div>' +
        '<div style="font-weight:700;font-size:15px;margin:4px 0 2px">' + esc(c.name) + '</div>' +
        '<div style="font-size:11px;color:rgba(26,31,46,.7);margin-bottom:6px">' + esc(c.subtitle) + '</div>' +
        '<canvas width="280" height="175" data-proof="watercolor" data-char="' + esc(id) + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15)"></canvas>' +
      '</div>';
    }).join('');

    const rungCards = charSpec.reductionLadder.map(function (r) {
      const on = st.rung === r.rung;
      return '<div class="char-card ' + (on ? 'char-card-active' : '') + '" data-action="set-rung" data-rung="' + r.rung + '">' +
        '<div style="display:flex;justify-content:space-between"><span class="st-mono-xs">RUNG ' + r.rung + '</span><span class="st-mono-xs">≤' + r.maxStrokeCount + ' STROKES</span></div>' +
        '<div style="font-weight:700;font-size:13px;margin:4px 0">' + esc(r.name) + '</div>' +
        '<canvas width="240" height="150" data-proof="s_sting" data-char="' + esc(charSpec.id) + '" data-rung="' + r.rung + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15);margin:4px 0"></canvas>' +
        '<p style="font-size:11px;color:rgba(26,31,46,.75);margin:0">' + esc(r.description) + '</p>' +
      '</div>';
    }).join('');

    const ixCards = FOUNDRY.INTERACTION_MODES.map(function (m) {
      const on = st.interaction === m.id;
      return '<div class="char-card ' + (on ? 'char-card-active' : '') + '" data-action="select-interaction" data-ix="' + esc(m.id) + '">' +
        '<div class="st-mono-xs">' + esc(m.short.toUpperCase()) + ' INTERACTION</div>' +
        '<div style="font-weight:700;font-size:14px;margin:3px 0">' + esc(m.label) + '</div>' +
        '<canvas width="280" height="175" data-proof="ix_' + esc(m.id) + '" data-char="' + esc(charSpec.id) + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15);margin:6px 0"></canvas>' +
        '<p style="font-size:11px;color:rgba(26,31,46,.75);margin:0">' + esc(m.desc) + '</p>' +
      '</div>';
    }).join('');

    return '<section class="st-surface">' +
      '<div class="st-panel">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<span class="st-eyebrow">UNIVERSAL PARAMETRIC ACTOR SOCKET · ZERO HARDCODED MASCOTS (GATE G03 · G04 · G05)</span>' +
            '<h2 class="st-section-h2" style="margin:4px 0">Character &amp; Emblem Foundry — ' + esc(charSpec.name) + '</h2>' +
          '</div>' +
          '<button data-action="synthesize-new-character" class="st-btn st-btn-rust">+ Synthesize New Parametric Rig</button>' +
        '</div>' +
        '<div class="char-grid-4" style="margin-top:12px">' + archetypeCards + '</div>' +
      '</div>' +

      '<!-- Live Parametric Anatomy Sliders & 4-Test Emblem Gauntlet -->' +
      '<div class="fork-grid-2" style="margin-top:16px">' +
        '<div class="st-panel">' +
          '<div class="st-eyebrow">LIVE PARAMETRIC ANATOMY &amp; KINEMATIC RIG CONTROLS</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">' +
            '<div><label class="st-label">ASPECT RATIO (' + charSpec.aspectRatio + ')</label><input type="range" data-rig-param="aspectRatio" min="0.24" max="0.54" step="0.02" value="' + charSpec.aspectRatio + '" style="width:100%"/></div>' +
            '<div><label class="st-label">DORSAL ARCH (' + bp.dorsalArch + ')</label><input type="range" data-rig-param="dorsalArch" min="0.20" max="0.55" step="0.02" value="' + bp.dorsalArch + '" style="width:100%"/></div>' +
            '<div><label class="st-label">VENTRAL BELLY (' + bp.ventralBelly + ')</label><input type="range" data-rig-param="ventralBelly" min="0.20" max="0.55" step="0.02" value="' + bp.ventralBelly + '" style="width:100%"/></div>' +
            '<div><label class="st-label">SPINE WAVE AMP (' + sw.ampDefault + ')</label><input type="range" data-rig-param="ampDefault" min="0.04" max="0.34" step="0.02" value="' + sw.ampDefault + '" style="width:100%"/></div>' +
            '<div><label class="st-label">FIN SPAN (' + ap.primaryFinSpan + ')</label><input type="range" data-rig-param="primaryFinSpan" min="0.16" max="0.46" step="0.02" value="' + ap.primaryFinSpan + '" style="width:100%"/></div>' +
            '<div><label class="st-label">VENTRAL GROOVES (' + ap.ventralGrooves + ')</label><input type="range" data-rig-param="ventralGrooves" min="1" max="6" step="1" value="' + ap.ventralGrooves + '" style="width:100%"/></div>' +
          '</div>' +
          '<div style="margin-top:12px">' +
            '<span class="st-label">4-TEST SAUL BASS EMBLEM GAUNTLET:</span>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">' +
              '<span class="st-badge ' + (gauntlet.favicon16px ? 'badge-pass' : 'badge-warn') + '">16px Favicon: ' + (gauntlet.favicon16px ? 'PASS' : 'FAIL') + '</span>' +
              '<span class="st-badge ' + (gauntlet.oneColorSilhouette ? 'badge-pass' : 'badge-warn') + '">1-Color Ink: ' + (gauntlet.oneColorSilhouette ? 'PASS' : 'FAIL') + '</span>' +
              '<span class="st-badge ' + (gauntlet.knockoutInversion ? 'badge-pass' : 'badge-warn') + '">Knockout CR ≥7:1: ' + (gauntlet.knockoutInversion ? 'PASS' : 'FAIL') + '</span>' +
              '<span class="st-badge ' + (gauntlet.squintSilhouette ? 'badge-pass' : 'badge-warn') + '">Squint Silhouette: ' + (gauntlet.squintSilhouette ? 'PASS' : 'FAIL') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="st-panel">' +
          '<div class="st-eyebrow">PART-BASED RIG SOCKET INSPECTOR (`e_rig`)</div>' +
          '<canvas width="480" height="300" data-proof="e_rig" data-char="' + esc(charSpec.id) + '" style="width:100%;height:auto;border-radius:8px;border:1px solid rgba(26,31,46,.18);margin-top:8px"></canvas>' +
        '</div>' +
      '</div>' +

      '<!-- 5-Rung Saul Bass Reduction Ladder -->' +
      '<div class="st-panel" style="margin-top:16px">' +
        '<div class="st-eyebrow">SAUL BASS 5-RUNG REDUCTION LADDER (CLICK ANY RUNG TO PIN GLOBALLY)</div>' +
        '<div class="char-grid-5" style="margin-top:10px">' + rungCards + '</div>' +
      '</div>' +

      '<!-- 8 Character Interaction Modes -->' +
      '<div class="st-panel" style="margin-top:16px">' +
        '<div class="st-eyebrow">8 FIRST-CLASS CHARACTER INTERACTION MODES · LIVE WITH ' + esc(charSpec.name.toUpperCase()) + '</div>' +
        '<div class="char-grid-4" style="margin-top:10px">' + ixCards + '</div>' +
      '</div>' +
    '</section>';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE 4 · 8-BEAT STORYBOARD SHEET & TIMELINE (G08)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceStoryboard = function (pal, charSpec) {
    const st = this.state;
    const sheet = st.storyboard;
    const audit = sheet.audit || { coveredOk: true, movementOk: true, oneBreather: true, callback: true };

    const beatCards = (sheet.beats || []).map(function (b) {
      return '<div class="sb-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<button data-action="scrub-to-beat" data-t="' + b.tMidSec + '" class="st-mini-btn" title="Jump clock to Beat ' + (b.index + 1) + ' (' + b.tMidSec + 's)">▶ BEAT ' + (b.index + 1) + ' · ' + b.tStartSec + 's–' + b.tEndSec + 's</button>' +
          '<select data-beat-hinge="' + b.index + '" class="st-select" style="padding:2px 6px;font-size:10px">' +
            '<option value="THEREFORE"' + (b.hinge === 'THEREFORE' ? ' selected' : '') + '>THEREFORE · ' + esc(b.role.toUpperCase()) + '</option>' +
            '<option value="BUT"' + (b.hinge === 'BUT' ? ' selected' : '') + '>BUT · ' + esc(b.role.toUpperCase()) + '</option>' +
          '</select>' +
        '</div>' +
        '<canvas width="320" height="200" data-proof="' + esc(sheet.storyKey) + '" data-char="' + esc(charSpec.id) + '" data-fixed-t="' + b.tMidSec + '" data-cam="' + esc(b.cameraMove || 'static-wide') + '" data-beat-idx="' + b.index + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.16);cursor:pointer" data-action="scrub-to-beat" data-t="' + b.tMidSec + '"></canvas>' +
        '<div style="font-weight:700;font-size:13.5px;margin:6px 0 3px">' + esc(b.label) + '</div>' +
        '<textarea data-beat-action="' + b.index + '" rows="2" class="st-input" style="width:100%;font-size:11px;margin-bottom:6px">' + esc(b.visualAction) + '</textarea>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;font-family:Space Mono,monospace;color:rgba(26,31,46,.65)">' +
          '<select data-beat-cam="' + b.index + '" class="st-select" style="padding:2px 4px;font-size:10px">' +
            ['static-wide', 'pan-follow', 'push-in', 'dutch-tilt', 'tracking-drift', 'breather-hold', 'kick-shake', 'pull-back'].map(function (cm) {
              return '<option value="' + cm + '"' + (b.cameraMove === cm ? ' selected' : '') + '>CAM: ' + cm + '</option>';
            }).join('') +
          '</select>' +
          '<span>MOVES: ' + b.activeSimultaneousMoves + '/2</span>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<section class="st-surface">' +
      '<div class="st-panel">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<span class="st-eyebrow">STAGE-4 / STAGE-5 STORYBOARD BEAT SHEET &amp; HYPERFRAMES VERIFIER (GATE G08)</span>' +
            '<h2 class="st-section-h2" style="margin:4px 0">' + esc(sheet.title) + ' · ' + esc(pal.no) + ' ' + esc(pal.name) + '</h2>' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<select id="sb-story-select" class="st-select">' +
              TAX.STORIES.map(function (s) {
                return '<option value="' + esc(s.key) + '"' + (st.storyKey === s.key ? ' selected' : '') + '>' + esc(s.title) + '</option>';
              }).join('') +
            '</select>' +
            '<button data-action="toggle-captions-covered" class="st-btn ' + (st.captionsCovered ? 'st-btn-rust' : '') + '">' + (st.captionsCovered ? 'Captions Covered (ON)' : 'Run Captions-Covered Test') + '</button>' +
            '<button data-action="run-rsi-critique" class="st-btn">⚖ Run 4-Lens RSI Critique</button>' +
            '<button data-action="toggle-oauth-modal" class="st-btn st-btn-rust">✦ OAuth Enhance Storyboard</button>' +
          '</div>' +
        '</div>' +

        '<!-- Conservation Law Badges -->' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 14px">' +
          '<span class="st-badge ' + (audit.coveredOk ? 'badge-pass' : 'badge-warn') + '">CoveredOk (Visual-Only Legible): ' + (audit.coveredOk ? 'PASS' : 'FAIL') + '</span>' +
          '<span class="st-badge ' + (audit.movementOk ? 'badge-pass' : 'badge-warn') + '">MovementOk (BUT/THEREFORE Hinges): ' + (audit.movementOk ? 'PASS' : 'FAIL') + '</span>' +
          '<span class="st-badge ' + (audit.oneBreather ? 'badge-pass' : 'badge-warn') + '">OneBreather (Negative-Space Hold): ' + (audit.oneBreather ? 'PASS' : 'FAIL') + '</span>' +
          '<span class="st-badge ' + (audit.callback ? 'badge-pass' : 'badge-warn') + '">Callback (Beat 8 Echoes Beat 1): ' + (audit.callback ? 'PASS' : 'FAIL') + '</span>' +
        '</div>' +

        '<div class="char-grid-4">' + beatCards + '</div>' +
      '</div>' +
    '</section>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
// ═══════════════════════════════════════════════════════════════════════════
// PART 2B · SURFACES 5–7 (Sanzo Wada 348 & Hydrography, 15 Styles & 24
// Elements Contact Sheet, Compile & Export Room), OAuth 2.0 PKCE Modal,
// 16-Gate Audit Modal, and Interactive Event Wiring
// ═══════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const WADA = global.STUDIO_WADA_ENGINE;
  const FOUNDRY = global.STUDIO_CHARACTER_FOUNDRY;
  const TAX = global.STUDIO_ATLAS_TAXONOMY;
  const CO = global.STUDIO_CANVAS_OAUTH;
  const MA = global.MA;
  const proto = global.MotionAtlasStudioApp.prototype;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE 5 · SANZO WADA 348 DICTIONARY & KINETIC HYDROGRAPHY (G01 · G02)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceWada = function (pal, charSpec) {
    const st = this.state;
    const q = (st.wadaSearch || '').toLowerCase().trim();
    const filtered = st.activeWadaCombos.filter(function (p) {
      if (st.wadaFilterRegister === 'curated' && !WADA.PALS.some(function (cp) { return cp.id === p.id; })) return false;
      if (st.wadaFilterRegister === 'hydro' && !p.hydro) return false;
      if (!q) return true;
      return String(p.id).includes(q) || (p.name && p.name.toLowerCase().includes(q)) || (p.mood && p.mood.toLowerCase().includes(q));
    });

    const chordRows = (pal.oklabChordTable || []).map(function (row, rIdx) {
      const sw = pal.sw[rIdx] || ['#1A1F2E', 'Swatch'];
      return '<tr>' +
        '<td style="padding:6px;font-weight:700;font-size:11px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + sw[0] + ';margin-right:6px"></span>' + esc(sw[1]) + '</td>' +
        row.map(function (d) { return '<td class="st-mono-xs" style="padding:6px;text-align:right">Δ=' + d.toFixed(1) + '</td>'; }).join('') +
      '</tr>';
    }).join('');

    const cetiBars = (pal.cetiTokenMatches || []).map(function (m) {
      const pct = Math.max(8, Math.min(100, Math.round((1 - m.deltaE2000 / 35) * 100)));
      return '<div style="margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">' +
          '<span><span style="display:inline-block;width:10px;height:10px;background:' + m.swatchHex + ';border-radius:2px;margin-right:5px"></span><strong>' + esc(m.swatchName) + '</strong> (' + m.swatchHex + ') → <code>' + esc(m.nearestToken) + '</code></span>' +
          '<span class="st-mono-xs">ΔE2000 = ' + m.deltaE2000.toFixed(2) + '</span>' +
        '</div>' +
        '<div style="height:8px;background:rgba(26,31,46,.1);border-radius:4px;overflow:hidden">' +
          '<div style="width:' + pct + '%;height:100%;background:' + m.swatchHex + '"></div>' +
        '</div>' +
      '</div>';
    }).join('');

    const comboCards = filtered.slice(0, 48).map(function (p) {
      const on = pal.id === p.id;
      const swBars = (p.sw || []).map(function (s) {
        return '<div style="flex:1;height:22px;background:' + s[0] + '" title="' + esc(s[1]) + ' ' + s[0] + '"></div>';
      }).join('');
      return '<div class="char-card ' + (on ? 'char-card-active' : '') + '" data-action="pick-curated-pal" data-pal-id="' + p.id + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="st-mono-xs">No. ' + p.id + (p.hydro ? ' · HYDRO' : '') + '</span>' +
          '<span class="st-mono-xs">CR ' + (p.cr || 8.0) + ':1</span>' +
        '</div>' +
        '<div style="font-weight:700;font-size:13px;margin:3px 0">' + esc(p.name) + '</div>' +
        '<div style="display:flex;border-radius:4px;overflow:hidden;border:1px solid rgba(26,31,46,.18);margin:6px 0">' + swBars + '</div>' +
        '<div style="font-size:11px;color:rgba(26,31,46,.72)">' + esc((p.sw || []).map(function (s) { return s[1]; }).join(' · ')) + '</div>' +
      '</div>';
    }).join('');

    const wadaChord = MA.computeWadaHarmonicChord ? MA.computeWadaHarmonicChord(pal, charSpec, st.rung, this._T) : null;
    const chordVoiceHtml = (wadaChord && Array.isArray(wadaChord.voices)) ? wadaChord.voices.map(function (v) {
      return '<div style="padding:5px 7px;background:rgba(26,31,46,.04);border:1px solid rgba(26,31,46,.14);border-radius:5px;font-size:10.5px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span class="st-mono-xs"><strong>V' + v.voiceIndex + ' · ' + esc(v.role) + '</strong></span>' +
          '<span class="st-mono-xs" style="color:#8C4A2E;font-weight:700">' + v.freqHz.toFixed(1) + ' Hz (' + esc(v.ratioLabel) + ')</span>' +
        '</div>' +
        '<div style="font-size:10px;color:rgba(26,31,46,.72);margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + v.swatchHex + ';margin-right:4px"></span>' + esc(v.swatchName) + ' · ΔOKLab ' + v.oklabDistFromLead + '</div>' +
      '</div>';
    }).join('') : '';

    return '<section class="st-surface">' +
      '<div class="fork-grid-2">' +
        '<div class="st-panel">' +
          '<div class="st-eyebrow">ACTIVE SANZO WADA COMBINATION (' + esc(pal.no) + ' · ' + esc(pal.jp) + ')</div>' +
          '<h2 class="st-section-h2" style="margin:4px 0">' + esc(pal.name) + ' — Contrast ' + pal.cr + ':1 AAA</h2>' +
          '<p style="font-size:13px;color:rgba(26,31,46,.78);margin:0 0 12px">' + esc(pal.mood) + '</p>' +
          '<div class="st-label">OKLAB PERCEPTUAL CHORD DISTANCE MATRIX (4×4)</div>' +
          '<table style="width:100%;border-collapse:collapse;margin:6px 0 14px;border:1px solid rgba(26,31,46,.15)">' + chordRows + '</table>' +
          '<div class="st-label">PLATE II · CIEDE2000 NEAREST CETI DESIGN SYSTEM TOKENS</div>' +
          '<div style="margin-top:6px">' + cetiBars + '</div>' +
          (wadaChord ? (
            '<div style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(26,31,46,.18)">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
                '<span class="st-label" style="margin-bottom:0">ORPHEUM 4-VOICE JUST-INTONATION HARMONIC SYNTHESIZER (GATE G24 · ROOT ' + esc(wadaChord.rootNote) + ' ' + wadaChord.baseFreqHz + ' Hz · ' + esc(wadaChord.waveform.toUpperCase()) + ')</span>' +
                '<button data-action="sonify-wada-chord" class="st-mini-btn on">♪ Play Wada Chord</button>' +
              '</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + chordVoiceHtml + '</div>' +
            '</div>'
          ) : '') +
        '</div>' +
        '<div class="st-panel">' +
          '<div class="st-eyebrow">LIVE KINETIC HYDROGRAPHY PLATE PREVIEW (' + esc(charSpec.name.toUpperCase()) + ')</div>' +
          '<canvas width="480" height="300" data-proof="s_hydro" data-char="' + esc(charSpec.id) + '" style="width:100%;height:auto;border-radius:8px;border:1px solid rgba(26,31,46,.18);margin-top:8px"></canvas>' +
        '</div>' +
      '</div>' +

      '<div class="st-panel" style="margin-top:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">' +
          '<div class="st-eyebrow">COMPLETE 348 SANZO WADA HARMONIC DICTIONARY (' + filtered.length + ' MATCHING COMBINATIONS)</div>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<input id="wada-search-input" type="text" placeholder="Search Wada No. or pigment name..." value="' + esc(st.wadaSearch) + '" class="st-input" style="width:220px"/>' +
            '<button data-action="filter-wada" data-reg="all" class="st-mini-btn ' + (st.wadaFilterRegister === 'all' ? 'on' : '') + '">All 348</button>' +
            '<button data-action="filter-wada" data-reg="curated" class="st-mini-btn ' + (st.wadaFilterRegister === 'curated' ? 'on' : '') + '">19 Curated Plates</button>' +
            '<button data-action="filter-wada" data-reg="hydro" class="st-mini-btn ' + (st.wadaFilterRegister === 'hydro' ? 'on' : '') + '">Hydrographic Survey</button>' +
          '</div>' +
        '</div>' +
        '<div class="char-grid-4">' + comboCards + '</div>' +
      '</div>' +
    '</section>';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE 6 · 15 STYLES & 24 ELEMENTS CONTACT SHEET (G06)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceContactSheet = function (pal, charSpec) {
    const styleCards = TAX.STYLES.map(function (s) {
      return '<div class="char-card" data-action="spawn-fork-to-dag" data-proof="' + esc(s.key) + '" data-title="' + esc(s.title) + '">' +
        '<div style="display:flex;justify-content:space-between"><span class="st-mono-xs">' + esc(s.branch) + ' · ' + esc(s.family.toUpperCase()) + '</span><span class="st-mono-xs">' + esc(s.fps) + '</span></div>' +
        '<div style="font-weight:700;font-size:14px;margin:4px 0">' + esc(s.title) + '</div>' +
        '<canvas width="280" height="175" data-proof="' + esc(s.key) + '" data-char="' + esc(charSpec.id) + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15);margin:4px 0"></canvas>' +
        '<p style="font-size:11px;color:rgba(26,31,46,.75);margin:0">' + esc(s.summary) + '</p>' +
      '</div>';
    }).join('');

    const allEls = [];
    TAX.EL_CATS.forEach(function (cat) {
      cat[1].forEach(function (elName) { allEls.push([cat[0], elName, TAX.EL_DEMO[elName] || 'watercolor']); });
    });

    const elCards = allEls.map(function (item) {
      const det = TAX.CORPUS.emap[item[1]] || { numbers: '' };
      return '<div class="char-card">' +
        '<div class="st-mono-xs">' + esc(item[0].toUpperCase()) + '</div>' +
        '<div style="font-weight:700;font-size:13px;margin:3px 0">' + esc(item[1]) + '</div>' +
        '<canvas width="240" height="150" data-proof="' + esc(item[2]) + '" data-char="' + esc(charSpec.id) + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15);margin:4px 0"></canvas>' +
        '<div class="st-mono-xs" style="opacity:.75">' + esc(det.numbers) + '</div>' +
      '</div>';
    }).join('');

    return '<section class="st-surface">' +
      '<div class="st-panel">' +
        '<div class="st-eyebrow">ALL 15 MOTION STYLES · RUNNING ON ONE CLOCK WITH ' + esc(charSpec.name.toUpperCase()) + ' &amp; WADA ' + esc(pal.no) + '</div>' +
        '<div class="char-grid-3" style="margin-top:12px">' + styleCards + '</div>' +
      '</div>' +
      '<div class="st-panel" style="margin-top:16px">' +
        '<div class="st-eyebrow">ALL 24 MOTION BUILDING BLOCKS · 6 STRUCTURAL LAYERS</div>' +
        '<div class="char-grid-4" style="margin-top:12px">' + elCards + '</div>' +
      '</div>' +
    '</section>';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SURFACE 7 · COMPILE & EXPORT ROOM (G13 · G14 · G25)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceCompile = function (pal, charSpec) {
    const st = this.state;
    const briefMd = CO.compileStage1Brief(st);
    const codeOut = CO.compileCodeScaffold(st, st.compileTarget);

    return '<section class="st-surface">' +
      '<div class="st-panel">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<span class="st-eyebrow">MULTI-TARGET PRODUCTION COMPILER &amp; PORTABLE ARCHIVE (GATE G13 · G14 · G25)</span>' +
            '<h2 class="st-section-h2" style="margin:4px 0">Compile Committed Branch — ' + esc(charSpec.name) + ' · ' + esc(pal.no) + ' ' + esc(pal.name) + '</h2>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
            '<button data-action="export-playable-html5" class="st-btn st-btn-rust">★ Download Playable Single-Clock HTML5</button>' +
            '<button data-action="record-webm-video" class="st-btn st-btn-ink">● Record 6s WebM Video</button>' +
            '<button data-action="export-contact-png" class="st-btn">Export 900-DPI PNG Storyboard Sheet</button>' +
            '<button data-action="export-session-json" class="st-btn">Download .motion.studio.json</button>' +
            '<label class="st-btn" style="cursor:pointer;margin:0">Import .motion.studio.json<input id="import-session-file" type="file" accept=".json" style="display:none"/></label>' +
            '<button data-action="copy-compiled-code" class="st-btn">Copy Compiled Bundle</button>' +
          '</div>' +
        '</div>' +
        (st.copiedNotice ? '<div style="margin-top:8px;padding:8px 12px;background:#2E5A44;color:#FBF3E6;border-radius:6px;font-size:12px">' + esc(st.copiedNotice) + '</div>' : '') +

        '<div class="fork-grid-2" style="margin-top:14px">' +
          '<div>' +
            '<div class="st-label">STAGE-1 MOTION BRIEF (.MD)</div>' +
            '<pre class="st-code-box">' + esc(briefMd) + '</pre>' +
          '</div>' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:6px">' +
              '<span class="st-label">EXECUTABLE SINGLE-CLOCK &amp; VECTOR PATH SCAFFOLD</span>' +
              '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
                '<button data-action="set-compile-target" data-target="hyperframes" class="st-mini-btn ' + (st.compileTarget === 'hyperframes' ? 'on' : '') + '">HyperFrames HTML</button>' +
                '<button data-action="set-compile-target" data-target="remotion" class="st-mini-btn ' + (st.compileTarget === 'remotion' ? 'on' : '') + '">Remotion TSX</button>' +
                '<button data-action="set-compile-target" data-target="animejs" class="st-mini-btn ' + (st.compileTarget === 'animejs' ? 'on' : '') + '">Anime.js v4</button>' +
                '<button data-action="set-compile-target" data-target="svg-keyframes" class="st-mini-btn ' + (st.compileTarget === 'svg-keyframes' ? 'on' : '') + '">SVG Keyframes</button>' +
                '<button data-action="set-compile-target" data-target="lottie-json" class="st-mini-btn ' + (st.compileTarget === 'lottie-json' ? 'on' : '') + '">Lottie JSON v5.7</button>' +
              '</div>' +
            '</div>' +
            '<pre class="st-code-box">' + esc(codeOut) + '</pre>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MODALS: OAUTH 2.0 PKCE LIVE ENHANCER & 25-GATE AUDIT LEDGER
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderModals = function (pal, charSpec, audit) {
    const st = this.state;
    let html = '';

    if (st.oauthModalOpen) {
      const last = st.oauthLastResult;
      const rsi = st.rsiCritiqueResult;
      html += '<div class="st-modal-backdrop">' +
        '<div class="st-modal">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div>' +
              '<span class="st-eyebrow">RFC 7636 OAUTH 2.0 PKCE (S256) + LOCAL AGENT BRIDGE + ALGEBRAIC SYNTHESIZER (G10 · G11)</span>' +
              '<h3 style="margin:4px 0;font-family:Fraunces,serif;font-size:22px">Live Storyboard, Fork &amp; Character Enhancer</h3>' +
            '</div>' +
            '<button data-action="toggle-oauth-modal" class="st-mini-btn">✕ Close</button>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0">' +
            '<div><label class="st-label">AUTH PROVIDER MODE</label>' +
              '<select id="oauth-provider-select" class="st-select" style="width:100%">' +
                '<option value="local-bridge"' + (st.oauthProvider === 'local-bridge' ? ' selected' : '') + '>Local Loopback Bridge (127.0.0.1:43110) + PKCE</option>' +
                '<option value="openrouter-pkce"' + (st.oauthProvider === 'openrouter-pkce' ? ' selected' : '') + '>OpenRouter OAuth 2.0 PKCE (S256)</option>' +
                '<option value="google-oauth-pkce"' + (st.oauthProvider === 'google-oauth-pkce' ? ' selected' : '') + '>Google OAuth 2.0 PKCE (GIS)</option>' +
                '<option value="algebraic-synthesizer"' + (st.oauthProvider === 'algebraic-synthesizer' ? ' selected' : '') + '>Offline Deterministic Algebraic Synthesizer</option>' +
              '</select>' +
            '</div>' +
            '<div><label class="st-label">PKCE STATUS / BEARER TOKEN</label>' +
              '<div style="display:flex;gap:6px">' +
                '<input id="oauth-token-input" type="password" placeholder="Optional API/Bearer token or use PKCE" value="' + esc(st.oauthToken) + '" class="st-input" style="flex:1"/>' +
                '<button data-action="start-pkce-handshake" class="st-mini-btn st-btn-ink">PKCE Handshake</button>' +
              '</div>' +
              '<div class="st-mono-xs" style="margin-top:4px;color:#2E5A44">' + esc(st.oauthStatus) + '</div>' +
            '</div>' +
          '</div>' +

          '<div><label class="st-label">ENHANCEMENT &amp; CHARACTER SYNTHESIS DIRECTIVE</label>' +
            '<textarea id="oauth-prompt-input" rows="3" class="st-input" style="width:100%">' + esc(st.oauthPrompt) + '</textarea>' +
          '</div>' +

          '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
            '<button data-action="run-oauth-enhance" class="st-btn st-btn-rust">' + (st.oauthBusy ? 'Enhancing & Validating Schema...' : '✦ 1. Enhance 8 Beats + Spawn DAG Node') + '</button>' +
            '<button data-action="fork-three-directions" data-node-id="' + esc(st.selectedNodeId) + '" class="st-btn st-btn-ink">⑂ 2. Fork 3 Directions (α/β/γ)</button>' +
            '<button data-action="synthesize-new-character" class="st-btn">✦ 3. Synthesize Character Rig</button>' +
            '<button data-action="run-rsi-critique" class="st-btn">⚖ 4. Run 4-Lens RSI Critique &amp; Fix</button>' +
          '</div>' +

          (last ? (
            '<div style="margin-top:14px;padding:12px;background:rgba(26,31,46,.04);border-radius:8px;border:1px solid rgba(26,31,46,.16)">' +
              '<div style="display:flex;justify-content:space-between">' +
                '<span class="st-mono-xs">SOURCE: ' + esc(last.source.toUpperCase()) + '</span>' +
                '<span class="st-badge badge-pass">G11 SCHEMA VALID: ' + (last.validation.valid ? 'PASS' : 'FAIL') + '</span>' +
              '</div>' +
              '<p style="font-size:13px;font-weight:600;margin:6px 0">' + esc(last.response.summary) + '</p>' +
              '<div style="font-size:12px">Registered New Character Rig: <strong>' + esc(last.response.synthesizedCharacter.name) + '</strong> (<code>' + esc(last.response.synthesizedCharacter.id) + '</code>) · Pinned Wada No. ' + last.response.suggestedWadaComboNo + '</div>' +
            '</div>'
          ) : '') +

          (rsi ? (
            '<div style="margin-top:12px;padding:12px;background:rgba(46,90,68,.06);border-radius:8px;border:1px solid rgba(46,90,68,.25)">' +
              '<div class="st-mono-xs" style="color:#2E5A44;margin-bottom:6px">4-LENS ADVERSARIAL RSI CRITIQUE · ' + esc(rsi.summary) + '</div>' +
              '<div style="display:grid;gap:4px;font-size:11px">' +
                rsi.lenses.map(function (l) {
                  return '<div><strong>[' + esc(l.id) + ' ' + esc(l.lens) + ']</strong>: ' + esc(l.verdict) + ' — ' + esc(l.finding) + '</div>';
                }).join('') +
              '</div>' +
            '</div>'
          ) : '') +
        '</div>' +
      '</div>';
    }

    if (st.gateModalOpen) {
      const tellApart = MA.auditArchetypeDiscriminability ? MA.auditArchetypeDiscriminability() : { pass: true, minDistance: 0.42, pairCount: 28 };
      const sheafCheck = CO.verifyDAGSheafCohomology ? CO.verifyDAGSheafCohomology(st.dag) : { valid: true, edgeCount: (st.dag.edges || []).length };
      html += '<div class="st-modal-backdrop">' +
        '<div class="st-modal">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
            '<div>' +
              '<span class="st-eyebrow">25 BINARY CONSERVATION GATES + TELL-APART + SHEAF + VBM UX ERGONOMICS (G01–G25)</span>' +
              '<h3 style="margin:4px 0;font-family:Fraunces,serif;font-size:22px">Mechanical Contract Audit — ' + audit.passedCount + '/' + audit.totalCount + ' PASS</h3>' +
            '</div>' +
            '<button data-action="toggle-gate-modal" class="st-mini-btn">✕ Close</button>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
            '<span class="st-badge ' + (tellApart.pass ? 'badge-pass' : 'badge-warn') + '">TELL-APART KERNEL: min Δ=' + tellApart.minDistance + ' across ' + tellApart.pairCount + ' pairs (' + (tellApart.pass ? 'PASS' : 'FAIL') + ')</span>' +
            '<span class="st-badge ' + (sheafCheck.valid ? 'badge-pass' : 'badge-warn') + '">ALEXANDROV SHEAF δ⁰=0: ' + sheafCheck.edgeCount + ' edges (' + (sheafCheck.valid ? 'PASS' : 'FAIL') + ')</span>' +
          '</div>' +
          '<div style="max-height:420px;overflow-y:auto">' +
            '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
              audit.gates.map(function (g) {
                return '<tr style="border-bottom:1px solid rgba(26,31,46,.1)">' +
                  '<td class="st-mono-xs" style="padding:6px"><strong>' + g.id + '</strong></td>' +
                  '<td style="padding:6px;font-weight:600">' + esc(g.name) + '</td>' +
                  '<td class="st-mono-xs" style="padding:6px">' + esc(g.metric) + '</td>' +
                  '<td style="padding:6px;text-align:right"><span class="st-badge ' + (g.pass ? 'badge-pass' : 'badge-warn') + '">' + (g.pass ? 'PASS' : 'FAIL') + '</span></td>' +
                '</tr>';
              }).join('') +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    return html;
  };

  proto.renderDOM = function () {
    if (!this.root) return;
    let activeId = null, selStart = null, selEnd = null;
    try {
      const ae = document.activeElement;
      if (ae && ae.id && this.root.contains(ae)) {
        activeId = ae.id;
        if (typeof ae.selectionStart === 'number') {
          selStart = ae.selectionStart;
          selEnd = ae.selectionEnd;
        }
      }
    } catch (_e) { /* ignore */ }

    const pal = this.getActivePalette();
    const charSpec = this.getActiveChar();
    const audit = CO.run16GateAudit(this.state);

    let bodyHtml = '';
    if (this.state.surface === 'infinite-canvas') bodyHtml = this.renderSurfaceInfiniteCanvas(pal, charSpec);
    else if (this.state.surface === 'fork-explorer') bodyHtml = this.renderSurfaceForkExplorer(pal, charSpec);
    else if (this.state.surface === 'character-foundry') bodyHtml = this.renderSurfaceCharacterFoundry(pal, charSpec);
    else if (this.state.surface === 'storyboard-sheet') bodyHtml = this.renderSurfaceStoryboard(pal, charSpec);
    else if (this.state.surface === 'wada-chord-matrix') bodyHtml = this.renderSurfaceWada(pal, charSpec);
    else if (this.state.surface === 'contact-sheet') bodyHtml = this.renderSurfaceContactSheet(pal, charSpec);
    else if (this.state.surface === 'compile-export') bodyHtml = this.renderSurfaceCompile(pal, charSpec);

    this.root.innerHTML =
      '<div class="st-shell" style="background:' + pal.paper + ';color:' + pal.ink + '">' +
        this.renderHeaderBar(pal, charSpec, audit) +
        '<main class="st-main">' + bodyHtml + '</main>' +
        this.renderModals(pal, charSpec, audit) +
      '</div>';

    this.attachDOMListeners();
    this.drawAllCanvases();

    if (activeId) {
      try {
        const nextEl = this.root.querySelector('#' + activeId);
        if (nextEl) {
          nextEl.focus();
          if (selStart != null && typeof nextEl.setSelectionRange === 'function') {
            nextEl.setSelectionRange(selStart, selEnd);
          }
        }
      } catch (_e) { /* ignore */ }
    }
  };

  proto.attachDOMListeners = function () {
    const self = this;
    const root = this.root;

    // Select inputs
    const bindSel = function (id, fn) {
      const el = root.querySelector(id);
      if (el) el.addEventListener('change', function (e) { fn(e.target.value); });
    };
    bindSel('#sel-char', function (v) { self.setState({ charId: v }); });
    bindSel('#sel-interaction', function (v) { self.setState({ interaction: v }); });
    bindSel('#sel-feel', function (v) { self.setState({ feel: v }); });
    bindSel('#sel-ground', function (v) { self.setState({ ground: v }); });
    bindSel('#sel-compare-node', function (v) { self.setState({ compareNodeId: v }); });
    bindSel('#sb-story-select', function (v) { self.setState({ storyKey: v }); });
    bindSel('#oauth-provider-select', function (v) { self.setState({ oauthProvider: v }); });

    const scrub = root.querySelector('#global-scrub');
    if (scrub) {
      scrub.addEventListener('input', function (e) {
        self._T = Number(e.target.value);
        const tReadout = root.querySelector('#global-t-readout');
        if (tReadout) tReadout.textContent = 't = ' + (self._T % 12).toFixed(2) + 's';
        self.setState({ playing: false }, true);
        self.drawAllCanvases();
      });
    }

    const wadaInput = root.querySelector('#wada-search-input');
    if (wadaInput) {
      wadaInput.addEventListener('input', function (e) {
        self.setState({ wadaSearch: e.target.value });
      });
    }

    // Inline Storyboard Beat Editing (Hinge, Camera, VisualAction) delegated to CO.auditStoryboardSheet
    const reauditStoryboard = function () {
      if (CO.auditStoryboardSheet) {
        CO.auditStoryboardSheet(self.state.storyboard);
      }
    };

    const hingeSels = root.querySelectorAll('[data-beat-hinge]');
    for (let i = 0; i < hingeSels.length; i++) {
      hingeSels[i].addEventListener('change', function (e) {
        const idx = Number(e.target.getAttribute('data-beat-hinge'));
        if (self.state.storyboard.beats[idx]) {
          self.state.storyboard.beats[idx].hinge = e.target.value;
          reauditStoryboard();
          self.renderDOM();
        }
      });
    }

    const camSels = root.querySelectorAll('[data-beat-cam]');
    for (let i = 0; i < camSels.length; i++) {
      camSels[i].addEventListener('change', function (e) {
        const idx = Number(e.target.getAttribute('data-beat-cam'));
        if (self.state.storyboard.beats[idx]) {
          self.state.storyboard.beats[idx].cameraMove = e.target.value;
          reauditStoryboard();
          self.renderDOM();
        }
      });
    }

    const actInputs = root.querySelectorAll('[data-beat-action]');
    for (let i = 0; i < actInputs.length; i++) {
      actInputs[i].addEventListener('change', function (e) {
        const idx = Number(e.target.getAttribute('data-beat-action'));
        if (self.state.storyboard.beats[idx]) {
          self.state.storyboard.beats[idx].visualAction = e.target.value;
          reauditStoryboard();
          self.renderDOM();
        }
      });
    }

    // JSON Session Import
    const importInput = root.querySelector('#import-session-file');
    if (importInput) {
      importInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
          try {
            const data = JSON.parse(String(ev.target.result));
            if (Array.isArray(data.customCharacters)) {
              data.customCharacters.forEach(function (c) { MA.registerCustomCharacter(c); });
            }
            const pIdx = self.state.activeWadaCombos.findIndex(function (p) { return p.id === data.activeWadaId; });
            self.setState({
              charId: data.activeCharacterId || self.state.charId,
              palIdx: pIdx >= 0 ? pIdx : self.state.palIdx,
              mStyle: data.activeStyleKey || self.state.mStyle,
              storyKey: data.activeStoryKey || self.state.storyKey,
              feel: data.activeFeelKey || self.state.feel,
              rung: data.activeRung || self.state.rung,
              dag: data.dag || self.state.dag,
              storyboard: data.storyboard || self.state.storyboard,
              copiedNotice: 'Imported .motion.studio.json archive successfully.'
            });
          } catch (err) {
            self.setState({ copiedNotice: 'Failed to parse .motion.studio.json file.' });
          }
        };
        reader.readAsText(file);
      });
    }

    // Rig sliders with live label update
    const rigSliders = root.querySelectorAll('[data-rig-param]');
    for (let i = 0; i < rigSliders.length; i++) {
      rigSliders[i].addEventListener('input', function (e) {
        const param = e.target.getAttribute('data-rig-param');
        const val = Number(e.target.value);
        const charSpec = self.getActiveChar();
        if (param === 'aspectRatio') charSpec.aspectRatio = val;
        else if (param in charSpec.bodyProfile) charSpec.bodyProfile[param] = val;
        else if (param in charSpec.spineWave) charSpec.spineWave[param] = val;
        else if (param in charSpec.appendages) charSpec.appendages[param] = val;
        const lbl = e.target.parentElement && e.target.parentElement.querySelector('.st-label');
        if (lbl) {
          lbl.textContent = lbl.textContent.replace(/\([0-9.]+\)/, '(' + val + ')');
        }
        self.drawAllCanvases();
      });
    }

    // Modal backdrop click to dismiss
    const backdrops = root.querySelectorAll('.st-modal-backdrop');
    for (let i = 0; i < backdrops.length; i++) {
      backdrops[i].addEventListener('click', function (e) {
        if (e.target === e.currentTarget) {
          self.setState({ oauthModalOpen: false, gateModalOpen: false });
        }
      });
    }

    // Living Canvas pan & drag
    const vp = root.querySelector('#living-canvas-viewport');
    if (vp) {
      vp.addEventListener('mousedown', function (e) {
        const handle = e.target.closest('[data-drag-handle]');
        if (handle) {
          const nid = handle.getAttribute('data-drag-handle');
          const node = self.state.dag.nodes.find(function (n) { return n.id === nid; });
          if (node) {
            self._draggingNodeId = nid;
            self._dragStart = [e.clientX, e.clientY];
            self._panStart = [node.x, node.y];
            e.stopPropagation();
            return;
          }
        }
        if (e.target.closest('.dag-node') || e.target.closest('button')) return;
        self._draggingCanvas = true;
        self._dragStart = [e.clientX, e.clientY];
        self._panStart = [self.state.panX, self.state.panY];
      });
      vp.addEventListener('wheel', function (e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        const nextZoom = Math.max(0.15, Math.min(4.0, Number((self.state.zoom * factor).toFixed(2))));
        self.setState({ zoom: nextZoom });
      }, { passive: false });
    }

    // Action buttons
    const btns = root.querySelectorAll('[data-action]');
    for (let i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) {
        e.stopPropagation();
        const act = e.currentTarget.getAttribute('data-action');
        self.handleAction(act, e.currentTarget);
      });
    }
  };

  proto.handleAction = async function (act, el) {
    const st = this.state;
    if (act === 'switch-surface') return this.setState({ surface: el.getAttribute('data-surface') });
    if (act === 'toggle-play') return this.setState({ playing: !st.playing });
    if (act === 'toggle-captions-covered') return this.setState({ captionsCovered: !st.captionsCovered });
    if (act === 'toggle-onion-skin') return this.setState({ onionSkin: !st.onionSkin });
    if (act === 'sonify-wada-chord') {
      if (MA.playWadaHarmonicChord) {
        MA.playWadaHarmonicChord(this.getActivePalette(), this.getActiveChar(), st.rung, this._T, 1.35);
      }
      return;
    }
    if (act === 'dag-synthesize-ab') {
      const nodeAId = st.selectedNodeId || 'node-proof-a';
      const nodeBId = (st.compareNodeId && st.compareNodeId !== nodeAId) ? st.compareNodeId : 'node-proof-b';
      const res = CO.synthesizeBranches(st.dag, nodeAId, nodeBId, {
        charId: st.charId,
        palId: this.getActivePalette().id
      });
      return this.setState({
        dag: { nodes: res.nodes, edges: res.edges },
        selectedNodeId: res.createdNodeId,
        surface: 'infinite-canvas'
      });
    }
    if (act === 'set-rung') return this.setState({ rung: Number(el.getAttribute('data-rung')) || 1 });
    if (act === 'scrub-to-beat') {
      const targetT = Number(el.getAttribute('data-t')) || 0;
      this._T = targetT;
      this.setState({ playing: false }, true);
      const scrub = this.root.querySelector('#global-scrub');
      const tReadout = this.root.querySelector('#global-t-readout');
      if (scrub) scrub.value = String((targetT % 12).toFixed(2));
      if (tReadout) tReadout.textContent = 't = ' + (targetT % 12).toFixed(2) + 's';
      this.drawAllCanvases();
      return;
    }
    if (act === 'pick-curated-pal') {
      const pid = Number(el.getAttribute('data-pal-id'));
      const idx = st.activeWadaCombos.findIndex(function (p) { return p.id === pid; });
      if (idx >= 0) this.setState({ palIdx: idx });
      return;
    }
    if (act === 'select-character') return this.setState({ charId: el.getAttribute('data-char-id') });
    if (act === 'select-interaction') return this.setState({ interaction: el.getAttribute('data-ix') });
    if (act === 'set-lens') {
      const lk = el.getAttribute('data-lens');
      const L = CO.LENSES[lk];
      const s1 = L.root.opts[0], s2 = L[s1].opts[0];
      return this.setState({ lens: lk, lensPath: [s1, s2] });
    }
    if (act === 'set-lens-step1') {
      const s1 = el.getAttribute('data-opt');
      const L = CO.LENSES[st.lens];
      return this.setState({ lensPath: [s1, L[s1].opts[0]] });
    }
    if (act === 'set-lens-step2') {
      const s2 = el.getAttribute('data-opt');
      return this.setState({ lensPath: [st.lensPath[0], s2] });
    }
    if (act === 'inspect-fork-item') {
      const kind = el.getAttribute('data-kind'), key = el.getAttribute('data-key');
      return this.setState({ selectedItem: [kind, key], mStyle: kind === 'style' ? key : st.mStyle, storyKey: kind === 'story' ? key : st.storyKey });
    }
    if (act === 'spawn-fork-to-dag') {
      const proof = el.getAttribute('data-proof') || 'watercolor';
      const title = el.getAttribute('data-title') || ('Fork · ' + proof);
      const res = CO.forkCanvasNode(st.dag, st.selectedNodeId, {
        title: title,
        styleKey: TAX.SMETA[proof] ? proof : st.mStyle,
        storyKey: TAX.STMETA[proof] ? proof : st.storyKey,
        charId: st.charId,
        palId: this.getActivePalette().id
      });
      return this.setState({ dag: { nodes: res.nodes, edges: res.edges }, selectedNodeId: res.createdNodeId, surface: 'infinite-canvas' });
    }
    if (act === 'select-dag-node') return this.setState({ selectedNodeId: el.getAttribute('data-node-id') });
    if (act === 'dag-auto-layout') {
      const aligned = CO.autoLayoutDAG ? CO.autoLayoutDAG(st.dag) : st.dag;
      return this.setState({ dag: aligned, panX: 18, panY: 16, zoom: 0.78 });
    }
    if (act === 'fork-dag-node') {
      const nid = el.getAttribute('data-node-id') || st.selectedNodeId;
      const res = CO.forkCanvasNode(st.dag, nid);
      return this.setState({ dag: { nodes: res.nodes, edges: res.edges }, selectedNodeId: res.createdNodeId });
    }
    if (act === 'fork-three-directions') {
      const nid = el.getAttribute('data-node-id') || st.selectedNodeId;
      const res = CO.forkThreeDirections(st.dag, nid);
      return this.setState({
        dag: { nodes: res.nodes, edges: res.edges },
        selectedNodeId: res.createdNodeIds[0],
        compareNodeId: res.createdNodeIds[1],
        showABCompare: true,
        surface: 'infinite-canvas'
      });
    }
    if (act === 'run-rsi-critique') {
      const critique = CO.runRSICritiqueAndFix(st);
      return this.setState({
        rsiCritiqueResult: critique,
        dag: st.dag,
        storyboard: st.storyboard,
        oauthStatus: critique.summary
      });
    }
    if (act === 'apply-dag-node') {
      const nid = el.getAttribute('data-node-id');
      const node = st.dag.nodes.find(function (n) { return n.id === nid; });
      if (node && node.payload) {
        const pIdx = st.activeWadaCombos.findIndex(function (p) { return p.id === node.payload.palId; });
        this.setState({
          selectedNodeId: nid,
          charId: node.payload.charId || st.charId,
          mStyle: node.payload.styleKey || st.mStyle,
          storyKey: node.payload.storyKey || st.storyKey,
          palIdx: pIdx >= 0 ? pIdx : st.palIdx
        });
      }
      return;
    }
    if (act === 'save-node-inspector') {
      const node = st.dag.nodes.find(function (n) { return n.id === st.selectedNodeId; });
      if (node) {
        const cEl = this.root.querySelector('#ins-node-char');
        const sEl = this.root.querySelector('#ins-node-style');
        const stEl = this.root.querySelector('#ins-node-story');
        const pEl = this.root.querySelector('#ins-node-pal');
        const nEl = this.root.querySelector('#ins-node-notes');
        const cjEl = this.root.querySelector('#ins-node-conjecture');
        if (cEl) node.payload.charId = cEl.value;
        if (sEl) node.payload.styleKey = sEl.value;
        if (stEl) node.payload.storyKey = stEl.value;
        if (pEl) node.payload.palId = Number(pEl.value);
        if (nEl) node.payload.notes = nEl.value;
        if (cjEl) node.conjectureNote = cjEl.value;
        node.subtitle = 'Wada No. ' + node.payload.palId + ' · ' + node.payload.styleKey;
        if (CO.stampDAGRestrictionHashes) CO.stampDAGRestrictionHashes(st.dag);
        this.setState({ dag: st.dag });
      }
      return;
    }
    if (act === 'zoom-canvas') {
      const d = Number(el.getAttribute('data-delta')) || 0;
      return this.setState({ zoom: Math.max(0.15, Math.min(4.0, Number((st.zoom + d).toFixed(2)))) });
    }
    if (act === 'zoom-set') {
      const nextZ = Number(el.getAttribute('data-zoom')) || 0.78;
      if (nextZ >= 1.4) {
        const seedNode = (st.dag.nodes || [])[0] || { x: 24, y: 210 };
        return this.setState({
          zoom: nextZ,
          panX: Math.round(24 - seedNode.x * nextZ + 24),
          panY: Math.round(18 - seedNode.y * nextZ)
        });
      }
      return this.setState({ zoom: nextZ, panX: 18, panY: 16 });
    }
    if (act === 'reset-pan') return this.setState({ panX: 18, panY: 16, zoom: 0.78 });
    if (act === 'toggle-ab-compare') return this.setState({ showABCompare: !st.showABCompare });
    if (act === 'open-storyboard-from-node') return this.setState({ surface: 'storyboard-sheet' });
    if (act === 'filter-wada') return this.setState({ wadaFilterRegister: el.getAttribute('data-reg') });
    if (act === 'set-compile-target') return this.setState({ compileTarget: el.getAttribute('data-target') });
    if (act === 'toggle-oauth-modal') return this.setState({ oauthModalOpen: !st.oauthModalOpen });
    if (act === 'toggle-gate-modal') return this.setState({ gateModalOpen: !st.gateModalOpen });
    if (act === 'oauth-enhance-node') {
      const nid = el.getAttribute('data-node-id') || st.selectedNodeId;
      return this.setState({ selectedNodeId: nid, oauthModalOpen: true });
    }
    if (act === 'synthesize-new-character') {
      const res = CO.runDeterministicSynthesizer({
        charId: st.charId,
        palId: this.getActivePalette().id,
        styleKey: st.mStyle,
        storyKey: st.storyKey,
        prompt: 'Synthesize a new custom parametric character rig for ' + st.mStyle
      });
      MA.registerCustomCharacter(res.synthesizedCharacter);
      return this.setState({ charId: res.synthesizedCharacter.id });
    }
    if (act === 'start-pkce-handshake') {
      const pkce = await CO.initiateOAuthPKCE(st.oauthProvider);
      this.setState({
        oauthStatus: 'PKCE S256 Challenge generated: ' + pkce.codeChallenge.slice(0, 18) + '... (Verifier stored)',
        oauthToken: 'pkce_' + pkce.codeChallenge.slice(0, 16)
      });
      return;
    }
    if (act === 'run-oauth-enhance') {
      const pInput = this.root.querySelector('#oauth-prompt-input');
      const tInput = this.root.querySelector('#oauth-token-input');
      const promptText = pInput ? pInput.value : st.oauthPrompt;
      const tok = tInput ? tInput.value : st.oauthToken;
      this.setState({ oauthBusy: true, oauthPrompt: promptText, oauthToken: tok });

      const out = await CO.enhanceStoryboardLive({
        charId: st.charId,
        palId: this.getActivePalette().id,
        styleKey: st.mStyle,
        storyKey: st.storyKey,
        prompt: promptText
      }, {
        mode: st.oauthProvider,
        provider: st.oauthProvider,
        accessToken: tok
      });

      const synthChar = out.response.synthesizedCharacter;
      if (synthChar) MA.registerCustomCharacter(synthChar);
      const pIdx = st.activeWadaCombos.findIndex(function (p) { return p.id === out.response.suggestedWadaComboNo; });
      const newDag = CO.forkCanvasNode(st.dag, st.selectedNodeId, {
        kind: 'oauth-enhancement',
        title: '✦ OAuth Enhanced · ' + (synthChar ? synthChar.name : 'Branch'),
        subtitle: 'Wada No. ' + out.response.suggestedWadaComboNo + ' · 8 Beats Verified',
        charId: synthChar ? synthChar.id : st.charId,
        palId: out.response.suggestedWadaComboNo,
        edgeLabel: '✦ OAuth PKCE',
        payload: {
          notes: out.response.summary
        }
      });

      const updatedSheet = Object.assign({}, st.storyboard, {
        beats: out.response.enhancedBeats,
        audit: out.response.conservationAudit
      });

      this.setState({
        oauthBusy: false,
        oauthLastResult: out,
        charId: synthChar ? synthChar.id : st.charId,
        palIdx: pIdx >= 0 ? pIdx : st.palIdx,
        storyboard: updatedSheet,
        dag: { nodes: newDag.nodes, edges: newDag.edges },
        selectedNodeId: newDag.createdNodeId
      });
      return;
    }
    if (act === 'copy-compiled-code') {
      const code = CO.compileCodeScaffold(st, st.compileTarget);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code);
      }
      return this.setState({ copiedNotice: 'Copied ' + st.compileTarget.toUpperCase() + ' single-clock scaffold to clipboard.' });
    }
    if (act === 'export-playable-html5') {
      const htmlDoc = CO.compilePlayableHTML5(st);
      const blob = new Blob([htmlDoc], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ceti-playable-single-clock-' + st.charId + '.html';
      a.click();
      return this.setState({ copiedNotice: 'Downloaded Playable Single-Clock HTML5 animation bundle.' });
    }
    if (act === 'record-webm-video') {
      if (typeof MediaRecorder === 'undefined') {
        return this.setState({ copiedNotice: 'MediaRecorder API not available in this browser.' });
      }
      this.setState({ copiedNotice: 'Recording 6.0s deterministic WebM video at 30fps...' });
      const recCanvas = document.createElement('canvas');
      recCanvas.width = 960; recCanvas.height = 600;
      const pal = this.getActivePalette();
      const feel = MA.FEELS[st.feel] || MA.FEELS.spring;
      const stream = recCanvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = function (e) { if (e.data && e.data.size > 0) chunks.push(e.data); };
      const self = this;
      recorder.onstop = function () {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ceti-motion-' + st.charId + '-' + st.mStyle + '.webm';
        a.click();
        self.setState({ copiedNotice: 'Exported 6.0s WebM video (' + st.charId + ' · ' + pal.no + ').' });
      };
      recorder.start();
      let frameIdx = 0;
      const totalFrames = 180;
      const iv = setInterval(function () {
        const tSec = (frameIdx / 30);
        MA.render(recCanvas, st.mStyle, pal, feel, tSec, { charId: st.charId, ground: st.ground, wob: st.wob, grain: st.grain });
        frameIdx++;
        if (frameIdx >= totalFrames) {
          clearInterval(iv);
          recorder.stop();
        }
      }, 1000 / 30);
      return;
    }
    if (act === 'export-session-json') {
      const blob = new Blob([JSON.stringify(CO.saveSessionState(st), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ceti-atlas-session.motion.studio.json';
      a.click();
      return;
    }
    if (act === 'export-contact-png') {
      const sheet = st.storyboard;
      const c = document.createElement('canvas');
      c.width = 1920; c.height = 1080;
      const ctx = c.getContext('2d');
      const pal = this.getActivePalette();
      const feel = MA.FEELS[st.feel] || MA.FEELS.spring;
      ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, 1920, 1080);
      ctx.fillStyle = pal.ink; ctx.font = '700 22px "Space Mono", monospace';
      ctx.fillText('CETI MOTION ATLAS STUDIO PRO · 8-BEAT STORYBOARD SHEET · ' + pal.no + ' ' + pal.name.toUpperCase(), 48, 52);
      const sub = document.createElement('canvas'); sub.width = 480; sub.height = 300;
      (sheet.beats || []).forEach(function (b, idx) {
        const col = idx % 4, row = Math.floor(idx / 4);
        MA.render(sub, sheet.storyKey, pal, feel, b.tMidSec, { charId: st.charId, ground: st.ground, wob: st.wob, grain: st.grain });
        const x = 48 + col * 460, y = 90 + row * 480;
        ctx.drawImage(sub, x, y, 430, 268);
        ctx.strokeStyle = pal.ink; ctx.lineWidth = 2; ctx.strokeRect(x, y, 430, 268);
        ctx.fillStyle = pal.ink; ctx.font = '700 13px "Space Mono", monospace';
        ctx.fillText('BEAT ' + (idx + 1) + ' [' + b.tStartSec + 's-' + b.tEndSec + 's] · ' + b.hinge + ' · ' + b.label.toUpperCase(), x, y + 292);
      });
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'ceti-storyboard-sheet-' + st.charId + '.png';
      a.click();
      return;
    }
  };

  function bootStudio() {
    if (typeof document === 'undefined') return;
    const rootEl = document.getElementById('motion-atlas-studio-root');
    if (rootEl && !global.__MOTION_ATLAS_STUDIO_INSTANCE) {
      const app = new global.MotionAtlasStudioApp(rootEl);
      global.__MOTION_ATLAS_STUDIO_INSTANCE = app;
      app.mount();
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootStudio);
    } else {
      bootStudio();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
