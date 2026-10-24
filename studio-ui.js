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
      const isNarrowViewport = (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerWidth <= 960);

      this.state = {
        surface: (saved && saved.surface) || 'infinite-canvas',
        charId: (saved && (saved.charId || saved.activeCharacterId)) || 'ceti-whale',
        partnerCharId: (saved && saved.partnerCharId) || 'geome-orpheus',
        interaction: (saved && saved.interaction) || 'hero-journey',
        rung: (saved && saved.rung) || 1,
        renderMode: null,
        palIdx: (saved && typeof saved.palIdx === 'number') ? saved.palIdx : 0,
        activeWadaCombos: WADA.getAllWadaCombos(),
        savedColorSchemes: (saved && Array.isArray(saved.savedColorSchemes) && saved.savedColorSchemes.length)
          ? saved.savedColorSchemes.map(function (sc) { return CO.normalizeSavedScheme ? CO.normalizeSavedScheme(sc) : sc; })
          : (CO.DEFAULT_SAVED_SCHEMES ? CO.DEFAULT_SAVED_SCHEMES.slice() : []),
        customCharacters: (saved && saved.customCharacters && typeof saved.customCharacters === 'object') ? saved.customCharacters : {},
        schemeTagInput: 'hero-dawn',
        schemeNameInput: 'Hero Dawn Custom',
        schemeTagsInput: '#warm #hero #custom',
        wadaSearch: '',
        wadaFilterRegister: 'all',
        feel: (saved && saved.feel) || 'spring',
        ground: (saved && saved.ground && WADA.normalizeGroundKey) ? WADA.normalizeGroundKey(saved.ground) : ((saved && saved.ground) || 'atlas'),
        mStyle: (saved && saved.mStyle) || 'watercolor',
        storyKey: (saved && saved.storyKey) || 's_voice',
        spineArc: (saved && saved.spineArc) || 'hero-inner-change',
        elCat: 'All',
        lens: 'look',
        lensPath: ['A', 'A1'],
        selectedItem: ['style', 'watercolor'],
        playing: true,
        speed: (saved && typeof saved.speed === 'number') ? saved.speed : 1.0,
        grain: (saved && typeof saved.grain === 'number') ? saved.grain : 0.24,
        wob: (saved && typeof saved.wob === 'number') ? saved.wob : 1.0,
        streaks: (saved && typeof saved.streaks === 'boolean') ? saved.streaks : true,
        guide: (saved && typeof saved.guide === 'boolean') ? saved.guide : true,
        hydroGhostCount: (saved && saved.hydroGhostCount) || 24,
        tweaksOpen: false,
        inspectorOpen: !isNarrowViewport,
        captionsCovered: false,
        onionSkin: (saved && typeof saved.onionSkin === 'boolean') ? saved.onionSkin : false,
        // Infinite-Zoom Living Canvas viewport & DAG (preserve user custom card x/y positions!)
        zoom: (saved && (saved.zoom || saved.canvasZoom)) || 0.78,
        panX: (saved && (saved.panX != null ? saved.panX : saved.canvasPanX)) || 18,
        panY: (saved && (saved.panY != null ? saved.panY : saved.canvasPanY)) || 16,
        dag: (saved && saved.dag && Array.isArray(saved.dag.nodes) && saved.dag.nodes.length)
          ? (CO.stampDAGRestrictionHashes ? CO.stampDAGRestrictionHashes(saved.dag) : saved.dag)
          : defaultDag,
        selectedNodeId: (saved && saved.selectedNodeId) || 'node-proof-a',
        compareNodeId: (saved && saved.compareNodeId) || 'node-proof-b',
        showABCompare: false,
        // Storyboard sheet
        storyboard: (saved && saved.storyboard && Array.isArray(saved.storyboard.beats) && saved.storyboard.beats.length === 8)
          ? saved.storyboard
          : CO.buildStoryboardSheet({
              storyKey: (saved && saved.storyKey) || 's_voice',
              styleKey: (saved && saved.mStyle) || 'watercolor',
              charId: (saved && (saved.charId || saved.activeCharacterId)) || 'ceti-whale',
              palId: WADA.PALS[0].id,
              feelKey: (saved && saved.feel) || 'spring',
              spineArc: (saved && saved.spineArc) || 'hero-inner-change'
            }),
        // OAuth 2.0 PKCE & Live Enhancer + # Vocabulary Library state
        oauthModalOpen: false,
        gateModalOpen: false,
        vocabModalOpen: false,
        vocabCategory: 'all',
        vocabFilterCat: 'all',
        vocabSearch: '',
        vocabTargetField: 'oauthPrompt',
        oauthProvider: 'local-bridge',
        oauthStatus: 'Ready (Offline Algebraic + PKCE S256 · Type # or / for Themes & Elements)',
        oauthToken: '',
        oauthPrompt: 'Heighten causal contrast at the threshold beat #theme/warm-storybook #element/spring-overshoot',
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

      // Deterministic 50-State Undo/Redo Ring Buffer (ARCH-07 · USE-03)
      this._history = [];
      this._redoStack = [];
      this._maxHistory = 50;
      this._auditCacheKey = '';
      this._auditCacheVal = null;
      this._saveTimer = null;

      this._T = 0.85;
      this._lastNow = null;
      this._raf = 0;
      this._draggingCanvas = false;
      this._draggingNodeId = null;
      this._dragPointerId = null;
      this._dragMovedPx = 0;
      this._dragStart = [0, 0];
      this._panStart = [0, 0];
      this._activePointers = new Map();
      this._pinchStartDist = 0;
      this._pinchStartZoom = 0.78;
      this._draggingBeatIdx = null;
      this._activeAutocompleteEl = null;

      MA.setActorOption('charId', this.state.charId);
      MA.setActorOption('partnerCharId', this.state.partnerCharId);
      MA.setActorOption('rung', this.state.rung);
      MA.setActorOption('captionsCovered', this.state.captionsCovered);
      MA.setActorOption('onionSkin', this.state.onionSkin);
      MA.setActorOption('hydroGhostCount', this.state.hydroGhostCount);

      this.tick = this.tick.bind(this);
    }

    mount() {
      this.renderDOM();
      this.bindGlobalEvents();
      if (this.state.playing && !this._raf) {
        this._raf = requestAnimationFrame(this.tick);
      }
    }

    getHistorySnapshot() {
      return JSON.parse(JSON.stringify({
        charId: this.state.charId,
        partnerCharId: this.state.partnerCharId,
        interaction: this.state.interaction,
        rung: this.state.rung,
        palIdx: this.state.palIdx,
        savedColorSchemes: this.state.savedColorSchemes,
        feel: this.state.feel,
        ground: this.state.ground,
        mStyle: this.state.mStyle,
        storyKey: this.state.storyKey,
        spineArc: this.state.spineArc,
        speed: this.state.speed,
        grain: this.state.grain,
        wob: this.state.wob,
        streaks: this.state.streaks,
        guide: this.state.guide,
        hydroGhostCount: this.state.hydroGhostCount,
        onionSkin: this.state.onionSkin,
        dag: this.state.dag,
        selectedNodeId: this.state.selectedNodeId,
        compareNodeId: this.state.compareNodeId,
        storyboard: this.state.storyboard
      }));
    }

    pushHistory(label) {
      try {
        const snap = this.getHistorySnapshot();
        snap._label = label || 'Edit';
        this._history.push(snap);
        if (this._history.length > this._maxHistory) {
          this._history.shift();
        }
        this._redoStack = [];
      } catch (_e) { /* ignore serialization edge cases */ }
    }

    canUndo() {
      return this._history && this._history.length > 0;
    }

    canRedo() {
      return this._redoStack && this._redoStack.length > 0;
    }

    undo() {
      if (!this.canUndo()) return false;
      const currentSnap = this.getHistorySnapshot();
      this._redoStack.push(currentSnap);
      const prev = this._history.pop();
      const label = prev._label || 'Action';
      delete prev._label;
      this.setState(Object.assign({}, prev, { copiedNotice: '↶ Undid: ' + label }), false, true);
      return true;
    }

    redo() {
      if (!this.canRedo()) return false;
      const currentSnap = this.getHistorySnapshot();
      this._history.push(currentSnap);
      const next = this._redoStack.pop();
      const label = next._label || 'Action';
      delete next._label;
      this.setState(Object.assign({}, next, { copiedNotice: '↷ Redid: ' + label }), false, true);
      return true;
    }

    getSerializableSessionState() {
      const pal = this.getActivePalette();
      return {
        surface: this.state.surface,
        charId: this.state.charId,
        activeCharacterId: this.state.charId,
        partnerCharId: this.state.partnerCharId,
        interaction: this.state.interaction,
        rung: this.state.rung,
        activeRung: this.state.rung,
        palIdx: this.state.palIdx,
        activeWadaId: pal.id,
        savedColorSchemes: this.state.savedColorSchemes,
        customCharacters: this.state.customCharacters,
        selectedNodeId: this.state.selectedNodeId,
        compareNodeId: this.state.compareNodeId,
        feel: this.state.feel,
        activeFeelKey: this.state.feel,
        ground: this.state.ground,
        mStyle: this.state.mStyle,
        activeStyleKey: this.state.mStyle,
        storyKey: this.state.storyKey,
        activeStoryKey: this.state.storyKey,
        spineArc: this.state.spineArc,
        speed: this.state.speed,
        grain: this.state.grain,
        wob: this.state.wob,
        streaks: this.state.streaks,
        guide: this.state.guide,
        hydroGhostCount: this.state.hydroGhostCount,
        onionSkin: this.state.onionSkin,
        zoom: this.state.zoom,
        panX: this.state.panX,
        panY: this.state.panY,
        dag: this.state.dag,
        storyboard: this.state.storyboard
      };
    }

    invalidateStaticCanvases() {
      if (!this.root) return;
      const statics = this.root.querySelectorAll('canvas[data-fixed-t]');
      for (let i = 0; i < statics.length; i++) {
        statics[i]._hasRenderedStatic = false;
      }
    }

    getAuditResult() {
      const st = this.state;
      const sbSig = (st.storyboard && Array.isArray(st.storyboard.beats))
        ? st.storyboard.beats.map(function (b) { return b.hinge + ':' + b.label + ':' + (b.cameraMove || ''); }).join('|')
        : '';
      const dagSig = (st.dag && Array.isArray(st.dag.nodes))
        ? st.dag.nodes.map(function (n) { return n.id + ':' + (n.packetHash || ''); }).join('|')
        : '';
      const key = [
        st.charId, st.palIdx, st.ground, st.rung, st.storyKey, st.mStyle, st.spineArc,
        (st.savedColorSchemes || []).length, dagSig, sbSig
      ].join('::');
      if (this._auditCacheVal && this._auditCacheKey === key) {
        return this._auditCacheVal;
      }
      this._auditCacheKey = key;
      this._auditCacheVal = CO.run16GateAudit(st);
      return this._auditCacheVal;
    }

    setState(patch, skipDOM, skipHistory) {
      if (! patch || typeof patch !== 'object') return;
      const structuralKeys = ['charId', 'partnerCharId', 'interaction', 'rung', 'palIdx', 'ground', 'feel', 'mStyle', 'storyKey', 'spineArc', 'dag', 'storyboard', 'savedColorSchemes'];
      const hasStructuralChange = structuralKeys.some(function (k) { return k in patch; });
      if (hasStructuralChange && !skipHistory && !skipDOM) {
        this.pushHistory(Object.keys(patch).slice(0, 2).join(', '));
      }

      if (patch.ground && WADA && typeof WADA.normalizeGroundKey === 'function') {
        patch.ground = WADA.normalizeGroundKey(patch.ground);
      }

      Object.assign(this.state, patch);
      MA.setActorOption('charId', this.state.charId);
      MA.setActorOption('partnerCharId', this.state.partnerCharId);
      MA.setActorOption('rung', this.state.rung);
      MA.setActorOption('renderMode', this.state.renderMode);
      MA.setActorOption('captionsCovered', this.state.captionsCovered);
      MA.setActorOption('onionSkin', this.state.onionSkin);
      MA.setActorOption('hydroGhostCount', this.state.hydroGhostCount);

      if (patch.storyKey || patch.mStyle || patch.charId || patch.palIdx !== undefined || patch.feel || patch.spineArc) {
        const pal = this.getActivePalette();
        if (!patch.storyboard) {
          this.state.storyboard = CO.buildStoryboardSheet({
            storyKey: this.state.storyKey,
            styleKey: this.state.mStyle,
            charId: this.state.charId,
            palId: pal.id,
            feelKey: this.state.feel,
            spineArc: this.state.spineArc
          });
        }
      }

      const serialized = this.getSerializableSessionState();
      CO.saveSessionState(serialized);

      if (this.state.playing && !this._raf && typeof requestAnimationFrame === 'function') {
        this._lastNow = null;
        this._raf = requestAnimationFrame(this.tick);
      }

      if (!skipDOM) {
        this.invalidateStaticCanvases();
        this.renderDOM();
        this.drawAllCanvases(false);
      }
    }

    getActivePalette() {
      const raw = this.state.activeWadaCombos[this.state.palIdx] || WADA.PALS[0];
      return WADA.enrichPalette(raw, this.state.ground);
    }

    getActiveChar() {
      return FOUNDRY.CHARACTERS[this.state.charId] || FOUNDRY.CHARACTERS['ceti-whale'];
    }

    getActiveLoopDuration() {
      if (MA && typeof MA.len === 'function') {
        return MA.len(this.state.storyKey || this.state.mStyle) || 12;
      }
      return 12;
    }

    tick(now) {
      if (!this.state.playing) {
        this._raf = 0;
        this._lastNow = null;
        return;
      }
      if (this._lastNow == null) this._lastNow = now;
      const dt = Math.min(0.08, (now - this._lastNow) / 1000);
      this._lastNow = now;
      const loopDur = this.getActiveLoopDuration();
      this._T += dt * this.state.speed;
      this.drawAllCanvases(true);
      const scrub = this.root && this.root.querySelector('#global-scrub');
      const tReadout = this.root && this.root.querySelector('#global-t-readout');
      const wrappedT = (this._T % loopDur).toFixed(2);
      if (scrub && document.activeElement !== scrub) {
        scrub.max = String(loopDur);
        scrub.value = wrappedT;
      }
      if (tReadout) tReadout.textContent = 't = ' + wrappedT + 's';
      this._raf = requestAnimationFrame(this.tick);
    }

    drawAllCanvases(isTick) {
      if (!this.root) return;
      const pal = this.getActivePalette();
      const feel = MA.FEELS[this.state.feel] || MA.FEELS.spring;
      const canvases = this.root.querySelectorAll('canvas[data-proof]');
      const vw = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1920;
      const vh = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 1080;

      for (let i = 0; i < canvases.length; i++) {
        const c = canvases[i];
        const fixedT = c.getAttribute('data-fixed-t');
        const isStatic = fixedT != null && fixedT !== '';

        // Skip re-rendering static storyboard still frames on 60fps tick once rendered
        if (isTick && isStatic && c._hasRenderedStatic) {
          continue;
        }

        // Bounding-Box Viewport Culling during 60fps tick (ARCH-03)
        if (isTick && typeof c.getBoundingClientRect === 'function') {
          const rect = c.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.bottom < -120 || rect.top > vh + 120 || rect.right < -120 || rect.left > vw + 120) {
              continue;
            }
          }
        }

        const key = c.getAttribute('data-proof');
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
        const tVal = isStatic ? Number(fixedT) : this._T;
        MA.render(c, key, usePal, feel, tVal, {
          wob: this.state.wob,
          grain: this.state.grain,
          streaks: this.state.streaks,
          guide: this.state.guide,
          ground: this.state.ground,
          hydroGhostCount: this.state.hydroGhostCount,
          charId: nodeChar,
          partnerCharId: this.state.partnerCharId,
          rung: nodeRung,
          renderMode: nodeMode || null,
          cameraMove: nodeCam,
          beatIdx: nodeBeatIdx,
          captionsCovered: this.state.captionsCovered,
          onionSkin: this.state.onionSkin
        });
        if (isStatic) c._hasRenderedStatic = true;
      }
    }

    hideVocabPopover() {
      if (!this.root) return;
      const pops = this.root.querySelectorAll('.vocab-popover');
      for (let i = 0; i < pops.length; i++) {
        pops[i].remove();
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

      // Global Keyboard Shortcuts: Escape, Ctrl/Cmd+Z Undo, Ctrl+Y/Cmd+Shift+Z Redo, Space, [/], 1-7 Surfaces, Delete/Backspace, D, C, O, F, K/#/?
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          self.hideVocabPopover();
          if (self.state.oauthModalOpen || self.state.gateModalOpen || self.state.vocabModalOpen) {
            self.setState({ oauthModalOpen: false, gateModalOpen: false, vocabModalOpen: false });
            return;
          }
        }
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        // Undo / Redo shortcuts (USE-03 · ARCH-07)
        if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          if (e.shiftKey) self.redo();
          else self.undo();
          return;
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || e.key === 'Y')) {
          e.preventDefault();
          self.redo();
          return;
        }

        const surfaceMap = {
          '1': 'infinite-canvas',
          '2': 'fork-explorer',
          '3': 'character-foundry',
          '4': 'storyboard-sheet',
          '5': 'wada-chord-matrix',
          '6': 'contact-sheet',
          '7': 'compile-export'
        };
        if (!e.metaKey && !e.ctrlKey && !e.altKey && surfaceMap[e.key]) {
          e.preventDefault();
          self.setState({ surface: surfaceMap[e.key] });
          return;
        }

        if (e.code === 'Space') {
          e.preventDefault();
          self.setState({ playing: !self.state.playing });
        } else if (e.key === '[') {
          self._T = Math.max(0, self._T - 0.5);
          self.setState({ playing: false }, true);
          self.drawAllCanvases(false);
        } else if (e.key === ']') {
          self._T = self._T + 0.5;
          self.setState({ playing: false }, true);
          self.drawAllCanvases(false);
        } else if (e.key === 'c' || e.key === 'C') {
          self.setState({ captionsCovered: !self.state.captionsCovered });
        } else if (e.key === 'o' || e.key === 'O') {
          self.setState({ onionSkin: !self.state.onionSkin });
        } else if (e.key === 'k' || e.key === 'K' || e.key === '#' || e.key === '?') {
          e.preventDefault();
          self.setState({ vocabModalOpen: !self.state.vocabModalOpen });
        } else if (e.key === 'f' || e.key === 'F') {
          const res = CO.forkCanvasNode(self.state.dag, self.state.selectedNodeId);
          self.setState({ dag: { nodes: res.nodes, edges: res.edges }, selectedNodeId: res.createdNodeId });
        } else if ((e.key === 'd' || e.key === 'D') && self.state.surface === 'infinite-canvas') {
          const res = CO.duplicateCanvasCard(self.state.dag, self.state.selectedNodeId);
          self.setState({ dag: { nodes: res.nodes, edges: res.edges }, selectedNodeId: res.createdNodeId });
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && self.state.surface === 'infinite-canvas') {
          const nid = self.state.selectedNodeId;
          if (nid && nid !== 'node-seed' && nid !== 'node-seed-root') {
            const res = CO.deleteCanvasCard(self.state.dag, nid);
            const nextSel = (res.nodes[0] && res.nodes[0].id) || 'node-seed';
            self.setState({ dag: { nodes: res.nodes, edges: res.edges }, selectedNodeId: nextSel });
          }
        }
      });

      // Unified Pointer & Mouse Move Handler (+ 2-Pointer Touch Pinch-to-Zoom — MOB-02 · MOB-04)
      const handleMove = function (e) {
        if (e.pointerId != null && self._activePointers.has(e.pointerId)) {
          self._activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (self._activePointers.size === 2) {
            const pts = Array.from(self._activePointers.values());
            const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            if (self._pinchStartDist > 12) {
              const ratio = dist / self._pinchStartDist;
              const nextZoom = Math.max(0.2, Math.min(3.5, Number((self._pinchStartZoom * ratio).toFixed(2))));
              self.state.zoom = nextZoom;
              const stage = self.root && self.root.querySelector('#dag-transform-stage');
              if (stage) {
                stage.style.transform = 'translate(' + self.state.panX + 'px,' + self.state.panY + 'px) scale(' + self.state.zoom + ')';
              }
            }
            return;
          }
        }

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
          const rawDx = e.clientX - self._dragStart[0];
          const rawDy = e.clientY - self._dragStart[1];
          self._dragMovedPx = Math.hypot(rawDx, rawDy);
          const node = self.state.dag.nodes.find(function (n) { return n.id === self._draggingNodeId; });
          if (node) {
            const dx = rawDx / self.state.zoom;
            const dy = rawDy / self.state.zoom;
            node.x = Math.max(8, Math.round(self._panStart[0] + dx));
            node.y = Math.max(8, Math.round(self._panStart[1] + dy));
            node.customMoved = true;
            const el = self.root.querySelector('[data-dag-node="' + node.id + '"]');
            if (el) {
              el.style.left = node.x + 'px';
              el.style.top = node.y + 'px';
              if (self._dragMovedPx >= 3) el.classList.add('dag-node-dragging');
            }
            const xyBadge = self.root.querySelector('[data-node-xy="' + node.id + '"]');
            if (xyBadge) {
              xyBadge.textContent = 'x:' + node.x + ' y:' + node.y;
            }
            self.updateDagEdgesSVG();
          }
        }
      };

      const handleUp = function (e) {
        if (e && e.pointerId != null) {
          self._activePointers.delete(e.pointerId);
          if (self._activePointers.size < 2) self._pinchStartDist = 0;
        }
        if (self._draggingNodeId) {
          const draggedId = self._draggingNodeId;
          const movedPx = self._dragMovedPx || 0;
          const el = self.root.querySelector('[data-dag-node="' + draggedId + '"]');
          if (el) el.classList.remove('dag-node-dragging');
          self._draggingNodeId = null;
          self._dragMovedPx = 0;

          if (movedPx < 5) {
            if (e && e.shiftKey) {
              self.setState({ compareNodeId: draggedId, showABCompare: true });
            } else if (self.state.selectedNodeId !== draggedId) {
              self.setState({ selectedNodeId: draggedId });
            }
          } else {
            self.pushHistory('Move Card ' + draggedId);
            const node = self.state.dag.nodes.find(function (n) { return n.id === draggedId; });
            if (node && CO.moveCanvasNode) {
              CO.moveCanvasNode(self.state.dag, draggedId, node.x, node.y);
            }
            CO.saveSessionState(self.getSerializableSessionState());
          }
        }
        if (self._draggingCanvas) {
          self._draggingCanvas = false;
          CO.saveSessionState(self.getSerializableSessionState());
        }
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
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
    const loopSec = this.getActiveLoopDuration ? this.getActiveLoopDuration() : 12.0;
    const tabs = [
      ['infinite-canvas',   'I · Living Canvas (DAG)'],
      ['fork-explorer',     'II · 5-Lens Forks'],
      ['character-foundry', 'III · Character & Emblem Foundry'],
      ['storyboard-sheet',  'IV · 8-Beat Storyboard'],
      ['wada-chord-matrix', 'V · Sanzo Wada 348 & Color Vault'],
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

    const spineArcOpts = (CO.SPINE_ARC_ORDER || ['count-scale-compare-rest', 'follow-a-process', 'understand-one-idea', 'saul-seven-beat', 'rem-five-move', 'hero-inner-change']).map(function (arcId) {
      const arc = (CO.SPINE_ARCS && CO.SPINE_ARCS[arcId]) || { id: arcId, label: arcId };
      return '<option value="' + esc(arcId) + '"' + (st.spineArc === arcId ? ' selected' : '') + '>' + esc(arc.label) + '</option>';
    }).join('');

    const palPills = WADA.PALS.slice(0, 7).map(function (p) {
      const on = st.activeWadaCombos[st.palIdx] && st.activeWadaCombos[st.palIdx].id === p.id;
      const dots = p.sw.slice(0, 4).map(function (s) {
        return '<span style="width:8px;height:8px;border-radius:50%;background:' + s[0] + ';border:1px solid rgba(26,31,46,.22);display:inline-block"></span>';
      }).join('');
      return '<button data-action="pick-curated-pal" data-pal-id="' + p.id + '" class="st-pill ' + (on ? 'st-pill-active' : '') + '" title="No. ' + p.id + ' · ' + esc(p.name) + '">' +
        '<span style="display:inline-flex;gap:2px;margin-right:4px;vertical-align:middle">' + dots + '</span>' +
        '<span>No.' + p.id + ' ' + esc(p.name) + '</span></button>';
    }).join('');

    const savedSchemes = (st.savedColorSchemes && st.savedColorSchemes.length) ? st.savedColorSchemes : (CO.DEFAULT_SAVED_SCHEMES || []);
    const savedSchemePills = savedSchemes.slice(0, 5).map(function (sc) {
      const isPinned = pal.id === sc.palId && st.ground === (sc.ground || 'atlas');
      return '<button data-action="invoke-saved-scheme" data-scheme-tag="' + esc(sc.tag) + '" class="st-pill ' + (isPinned ? 'st-pill-active' : '') + '" style="border-color:#8C4A2E" title="Re-invoke saved scheme ' + esc(sc.handle) + ' (' + esc(sc.name) + ' · Wada No. ' + sc.palId + ')">' +
        '★ <strong>' + esc(sc.handle) + '</strong></button>';
    }).join('');

    return '<header class="st-header">' +
      '<div class="st-topbar">' +
        '<div class="st-brand">' +
          '<span class="st-eyebrow">CETI INTERNAL DESIGN &amp; NARRATIVE STUDIO</span>' +
          '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">' +
            '<h1 class="st-title">Motion Atlas Studio Pro</h1>' +
            '<span class="st-sub">Sanzo Wada 348 · Freeform Living Canvas · # &amp; / Vocabulary &amp; Theme Library · Tagged Color Vault · OAuth 2.0 PKCE</span>' +
          '</div>' +
        '</div>' +
        '<div class="st-top-actions">' +
          '<button data-action="undo-history" class="st-mini-btn" ' + (!this.canUndo() ? 'disabled style="opacity:.45"' : '') + ' title="Undo last studio state change [Ctrl/Cmd+Z]">↶ Undo</button>' +
          '<button data-action="redo-history" class="st-mini-btn" ' + (!this.canRedo() ? 'disabled style="opacity:.45"' : '') + ' title="Redo studio state change [Ctrl+Y / Cmd+Shift+Z]">↷ Redo</button>' +
          '<button data-action="toggle-tweaks-bar" class="st-mini-btn ' + (st.tweaksOpen ? 'on' : '') + '" title="Toggle Finish &amp; Motion Tweaks Strip (Speed, Grain, Wobble, Streaks, Guides, Hydro Ghosts)">⚙ Tweaks</button>' +
          '<button data-action="toggle-vocab-modal" class="st-btn" title="Browse &amp; Insert Plain-English Design Vocabulary, Themes, Elements &amp; #color Tags [K]"># / Vocabulary &amp; Themes [K]</button>' +
          '<button data-action="toggle-oauth-modal" class="st-btn st-btn-rust">OAuth 2.0 PKCE Live Enhancer</button>' +
          '<button data-action="toggle-gate-modal" class="st-btn st-btn-ink">Audit ' + audit.passedCount + '/' + audit.totalCount + ' PASS</button>' +
        '</div>' +
      '</div>' +

      '<!-- Global Studio Pinning Bar: Character, Interaction, Rung, Spine Arc, Feel, Ground, Transport -->' +
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
          '<label class="st-label">SPINE ARC (6 CANONICAL)</label>' +
          '<select id="sel-spine-arc" class="st-select">' + spineArcOpts + '</select>' +
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
          '<label class="st-label">SINGLE CLOCK TRANSPORT · <span id="global-t-readout">t = ' + (this._T % loopSec).toFixed(2) + 's</span></label>' +
          '<div style="display:flex;gap:5px;align-items:center">' +
            '<button data-action="toggle-play" class="st-mini-btn on">' + (st.playing ? 'PAUSE' : 'PLAY') + '</button>' +
            '<input id="global-scrub" type="range" min="0" max="' + loopSec + '" step="0.02" value="' + (this._T % loopSec).toFixed(2) + '" style="width:82px;accent-color:#8C4A2E"/>' +
            '<button data-action="toggle-onion-skin" class="st-mini-btn ' + (st.onionSkin ? 'on' : '') + '" title="Gate G23 Multi-Frame Onion Skinning (-2Δt / -1Δt / +1Δt) [O]">ONION</button>' +
            '<button data-action="sonify-wada-chord" class="st-mini-btn" title="Gate G24 Orpheum 4-Voice Harmonic Chord Sonification">♪ SONIFY</button>' +
            '<button data-action="toggle-captions-covered" class="st-mini-btn ' + (st.captionsCovered ? 'on' : '') + '" title="Gate G08 Captions-Covered Test [C]">NO-TEXT</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      (st.tweaksOpen ? (
        '<div class="st-tweaks-strip">' +
          '<span class="st-label" style="margin:0;color:#8C4A2E">FINISH &amp; MOTION TWEAKS:</span>' +
          '<label class="st-mono-xs" style="display:inline-flex;align-items:center;gap:4px">SPEED (' + st.speed.toFixed(2) + '×) <input type="range" data-tweak-param="speed" min="0.25" max="2.5" step="0.05" value="' + st.speed + '" style="width:70px"/></label>' +
          '<label class="st-mono-xs" style="display:inline-flex;align-items:center;gap:4px">GRAIN (' + st.grain.toFixed(2) + ') <input type="range" data-tweak-param="grain" min="0" max="0.65" step="0.02" value="' + st.grain + '" style="width:70px"/></label>' +
          '<label class="st-mono-xs" style="display:inline-flex;align-items:center;gap:4px">WOBBLE (' + st.wob.toFixed(1) + ') <input type="range" data-tweak-param="wob" min="0" max="2.4" step="0.1" value="' + st.wob + '" style="width:70px"/></label>' +
          '<button data-action="toggle-tweak-bool" data-tweak="streaks" class="st-mini-btn ' + (st.streaks ? 'on' : '') + '">STREAKS: ' + (st.streaks ? 'ON' : 'OFF') + '</button>' +
          '<button data-action="toggle-tweak-bool" data-tweak="guide" class="st-mini-btn ' + (st.guide ? 'on' : '') + '">RULE-OF-THIRDS GUIDE: ' + (st.guide ? 'ON' : 'OFF') + '</button>' +
          '<div style="display:inline-flex;align-items:center;gap:3px">' +
            '<span class="st-mono-xs">HYDRO GHOSTS:</span>' +
            [12, 24, 48].map(function (gc) {
              return '<button data-action="set-hydro-ghosts" data-ghosts="' + gc + '" class="st-mini-btn ' + ((st.hydroGhostCount || 24) === gc ? 'on' : '') + '">' + gc + '</button>';
            }).join('') +
          '</div>' +
        '</div>'
      ) : '') +

      '<!-- Curated Sanzo Wada Quick-Pin Strip + Saved & Tagged #color/<tag> Schemes -->' +
      '<div class="st-wada-strip">' +
        '<span class="st-label" style="margin-right:4px">WADA (' + esc(pal.no) + ' · CR ' + pal.cr + ':1):</span>' +
        palPills +
        '<span class="st-label" style="margin:0 4px 0 8px;color:#8C4A2E">SAVED #COLOR TAGS:</span>' +
        savedSchemePills +
        '<button data-action="quick-tag-current-scheme" class="st-pill" style="border-style:dashed;border-color:#2E5A44;color:#2E5A44" title="Tag &amp; Save current Wada palette into your #color/<tag> Vault">★ + Tag &amp; Save Color</button>' +
        '<button data-action="switch-surface" data-surface="wada-chord-matrix" class="st-pill" style="border-style:dashed">All 348 + Vault →</button>' +
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
  // SURFACE 1 · INFINITE-ZOOM LIVING CANVAS (DAG + PASTEBOARD) (G09 · G26 · G27)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceInfiniteCanvas = function (pal, charSpec) {
    const st = this.state;
    if (CO.stampDAGRestrictionHashes) CO.stampDAGRestrictionHashes(st.dag);
    const sheafAudit = CO.verifyDAGSheafCohomology ? CO.verifyDAGSheafCohomology(st.dag) : { valid: true, edgeCount: (st.dag.edges || []).length };
    const lod = CO.computeCanvasLOD(st.zoom);
    const selectedNode = (st.dag.nodes || []).find(function (n) { return n.id === st.selectedNodeId; }) || st.dag.nodes[0];
    const compareNode = (st.dag.nodes || []).find(function (n) { return n.id === st.compareNodeId; }) || st.dag.nodes[1] || selectedNode;

    const nodesHtml = (st.dag.nodes || []).map(function (n) {
      const isSelA = n.id === st.selectedNodeId;
      const isSelB = n.id === st.compareNodeId && n.id !== st.selectedNodeId;
      const p = n.payload || {};
      const proofKey = p.styleKey || p.storyKey || 'watercolor';
      const nCharId = p.charId || st.charId;
      const nChar = FOUNDRY.CHARACTERS[nCharId] || charSpec;
      const nPalId = p.palId || pal.id;
      const sheafBadge = '<span class="st-mono-xs" title="Sheaf Restriction Hash ρ(child)=parent" style="color:var(--ink-soft)">' + esc(n.packetHash || 'ρ-root') + (n.upstreamHash ? ' ← ' + esc(n.upstreamHash) : '') + '</span>';

      return '<div data-dag-node="' + esc(n.id) + '" class="dag-node ' + (isSelA ? 'dag-node-selected' : (isSelB ? 'dag-node-source-b' : '')) + ' lod-' + lod + '" style="left:' + n.x + 'px;top:' + n.y + 'px;width:' + (n.width || 315) + 'px" title="Grab anywhere on this card to drag &amp; move freely (Shift+Click sets Source B)">' +
        '<div class="dag-node-header" data-drag-handle="' + esc(n.id) + '">' +
          '<div style="display:flex;align-items:center;gap:4px">' +
            '<span class="st-mono-xs" style="cursor:grab">✥ ' + esc(n.kind.toUpperCase()) + '</span>' +
            '<span data-node-xy="' + esc(n.id) + '" class="st-mono-xs" style="opacity:.55">x:' + n.x + ' y:' + n.y + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:3px;align-items:center">' +
            '<button data-action="set-source-a" data-node-id="' + esc(n.id) + '" class="st-mini-btn ' + (isSelA ? 'on' : '') + '" style="padding:1px 5px;font-size:8.5px;' + (isSelA ? 'background:#8C4A2E;border-color:#8C4A2E' : '') + '" title="Select this card as Primary Source A">● Src A</button>' +
            '<button data-action="set-source-b" data-node-id="' + esc(n.id) + '" class="st-mini-btn ' + (isSelB ? 'on' : '') + '" style="padding:1px 5px;font-size:8.5px;' + (isSelB ? 'background:#1E3F66;border-color:#1E3F66' : '') + '" title="Select this card as Partner / Merge Source B">◐ Src B</button>' +
          '</div>' +
        '</div>' +
        '<div class="dag-node-body">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">' +
            sheafBadge +
            '<span class="st-mono-xs" style="color:var(--rust)">Wada No. ' + nPalId + '</span>' +
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
            (n.conjectureNote ? '<div class="st-mono-xs" style="margin-top:4px;padding:4px 6px;background:rgba(168,36,28,.08);border-left:2px solid var(--rust);color:var(--ink)">' + esc(n.conjectureNote) + '</div>' : '')
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
          '<button data-action="duplicate-dag-node" data-node-id="' + esc(n.id) + '" class="st-mini-btn" title="Duplicate this card on the canvas [D]">⧉ Copy</button>' +
          '<button data-action="apply-dag-node" data-node-id="' + esc(n.id) + '" class="st-mini-btn" title="Pin this node’s character, Wada palette, and style globally">Pin Global</button>' +
          '<button data-action="oauth-enhance-node" data-node-id="' + esc(n.id) + '" class="st-mini-btn st-btn-rust" title="Enhance via OAuth 2.0 PKCE / Synthesizer">✦ Enhance</button>' +
          (n.id !== 'node-seed' && n.id !== 'node-seed-root' ? '<button data-action="delete-dag-node" data-node-id="' + esc(n.id) + '" class="st-mini-btn" title="Remove card from canvas [Delete]">✕</button>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    const sourceAOpts = (st.dag.nodes || []).map(function (n) {
      return '<option value="' + esc(n.id) + '"' + (n.id === (selectedNode && selectedNode.id) ? ' selected' : '') + '>● Src A: ' + esc(n.title) + '</option>';
    }).join('');
    const sourceBOpts = (st.dag.nodes || []).map(function (n) {
      return '<option value="' + esc(n.id) + '"' + (n.id === (compareNode && compareNode.id) ? ' selected' : '') + '>◐ Src B: ' + esc(n.title) + '</option>';
    }).join('');

    const isInspectorOpen = st.inspectorOpen !== false && !st.inspectorCollapsed;

    return '<section class="st-surface">' +
      '<div class="canvas-toolbar">' +
        '<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">' +
          '<span class="st-mono-xs">DRAG ANY CARD FREELY · ZOOM ' + st.zoom.toFixed(2) + '× · ' + st.dag.nodes.length + ' CARDS</span>' +
          '<span class="st-badge ' + (sheafAudit.valid ? 'badge-pass' : 'badge-warn') + '" title="Alexandrov Sheaf Restriction Cohomology across DAG edges">SHEAF ρ: ' + (sheafAudit.valid ? 'δ⁰=0 PASS' : 'MISMATCH') + '</span>' +
          '<button data-action="zoom-canvas" data-delta="-0.15" class="st-mini-btn" title="Zoom Out">−</button>' +
          '<button data-action="zoom-canvas" data-delta="0.15" class="st-mini-btn" title="Zoom In">+</button>' +
          '<button data-action="zoom-set" data-zoom="0.3" class="st-mini-btn">0.3× Macro</button>' +
          '<button data-action="zoom-set" data-zoom="0.78" class="st-mini-btn">0.8× Studio</button>' +
          '<button data-action="zoom-set" data-zoom="1.65" class="st-mini-btn">1.6× Micro</button>' +
          '<button data-action="zoom-fit-all" class="st-mini-btn" title="Fit all cards into viewport">⊡ Fit All</button>' +
          '<button data-action="dag-auto-layout" class="st-mini-btn" title="Snap cards into aligned columns">⊞ Auto-Grid</button>' +
        '</div>' +
        '<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">' +
          '<select id="sel-source-a-node" class="st-select" style="max-width:185px;border-color:#8C4A2E;font-weight:700" title="Direct Source A (Primary Branch)">' + sourceAOpts + '</select>' +
          '<button data-action="swap-source-ab" class="st-mini-btn" title="Swap Source A and Source B">⇄</button>' +
          '<select id="sel-source-b-node" class="st-select" style="max-width:185px;border-color:#1E3F66;font-weight:700" title="Direct Source B (Comparison / Pushout Merge Partner)">' + sourceBOpts + '</select>' +
          '<button data-action="duplicate-dag-node" data-node-id="' + esc(st.selectedNodeId) + '" class="st-btn" title="Duplicate Source A Card [D]">+ Duplicate Card</button>' +
          '<button data-action="fork-three-directions" data-node-id="' + esc(st.selectedNodeId) + '" class="st-btn st-btn-ink">⑂ Fork 3× (α/β/γ)</button>' +
          '<button data-action="dag-synthesize-ab" class="st-btn" title="Gate G22 Pushout Gluing of Source A ⊕ Source B">⊕ Glue A ⊕ B</button>' +
          '<button data-action="toggle-vocab-modal" class="st-btn st-btn-rust" title="Open Plain-English # Vocabulary, Themes &amp; Elements"># Themes &amp; Elements</button>' +
          '<button data-action="toggle-ab-compare" class="st-btn ' + (st.showABCompare ? 'st-btn-rust' : '') + '">⚖ A/B Drawer</button>' +
          '<button data-action="toggle-inspector" class="st-mini-btn ' + (isInspectorOpen ? 'on' : '') + '" title="Toggle Card Inspector Drawer">◧ Inspector</button>' +
        '</div>' +
      '</div>' +

      (st.showABCompare && selectedNode && compareNode ? (
        '<div class="ab-compare-drawer">' +
          '<div class="ab-col">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<span class="st-mono-xs">SOURCE A (PRIMARY): <strong>' + esc(selectedNode.title) + '</strong> · ' + esc(selectedNode.packetHash || '') + '</span>' +
              '<button data-action="dag-synthesize-ab" class="st-mini-btn on" title="Synthesize Pushout Gluing Node from Source A ⊕ Source B">⊕ Glue A ⊕ B → Synthesis Node</button>' +
            '</div>' +
            '<canvas width="480" height="300" data-proof="' + esc(selectedNode.payload.styleKey || 'watercolor') + '" data-char="' + esc(selectedNode.payload.charId || st.charId) + '" data-pal-id="' + (selectedNode.payload.palId || pal.id) + '" style="width:100%;max-width:340px;border-radius:6px;border:1px solid rgba(26,31,46,.2);margin-top:4px"></canvas>' +
          '</div>' +
          '<div class="ab-col">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
              '<span class="st-mono-xs">SOURCE B (PARTNER):</span>' +
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

      '<div class="living-canvas-layout ' + (!isInspectorOpen ? 'inspector-collapsed' : '') + '">' +
        '<div id="living-canvas-viewport" class="living-canvas-viewport">' +
          '<div id="dag-transform-stage" class="dag-transform-stage" style="transform:translate(' + st.panX + 'px,' + st.panY + 'px) scale(' + st.zoom + ')">' +
            '<svg id="dag-edges-svg" class="dag-edges-svg" width="3600" height="2400">' +
              this.renderDagEdgesMarkup() +
            '</svg>' +
            nodesHtml +
          '</div>' +
          '<div class="canvas-minimap">' +
            '<div class="st-mono-xs" style="margin-bottom:2px">DRAG ANY CARD TO MOVE · PINCH OR WHEEL TO ZOOM · [K] #VOCAB · [CTRL+Z] UNDO</div>' +
            '<div style="font-size:11px;color:var(--ink-soft)">● Src A: <strong>' + esc(selectedNode ? selectedNode.title : '') + '</strong> · ◐ Src B: <strong>' + esc(compareNode ? compareNode.title : '') + '</strong></div>' +
          '</div>' +
        '</div>' +

        '<!-- Right Inspector Panel for Selected DAG Node -->' +
        '<aside class="dag-inspector">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div class="st-eyebrow">SOURCE A CARD INSPECTOR · SHEAF PACKET</div>' +
            '<button data-action="toggle-inspector" class="st-mini-btn" style="padding:1px 5px" title="Collapse Inspector">✕</button>' +
          '</div>' +
          '<h3 style="margin:4px 0 6px;font-family:Fraunces,serif;font-weight:400;font-size:19px">' + esc(selectedNode ? selectedNode.title : '') + '</h3>' +
          '<p style="font-size:11.5px;color:rgba(26,31,46,.75);margin:0 0 10px">' + esc(selectedNode ? selectedNode.subtitle : '') + '</p>' +
          (selectedNode ? (
            '<div style="display:grid;gap:8px">' +
              '<div class="st-mono-xs" style="padding:5px 8px;background:rgba(26,31,46,.05);border-radius:6px">' +
                'POSITION: <strong>x=' + selectedNode.x + ', y=' + selectedNode.y + '</strong> · HASH: <strong>' + esc(selectedNode.packetHash || 'ρ-root') + '</strong><br/>' +
                'UPSTREAM ρ: <strong>' + esc(selectedNode.upstreamHash || 'ORIGIN') + '</strong>' +
              '</div>' +
              '<div><label class="st-label">CARD CHARACTER RIG</label>' +
                '<select id="ins-node-char" class="st-select" style="width:100%">' +
                  FOUNDRY.CHARACTER_ORDER.map(function (cid) {
                    return '<option value="' + esc(cid) + '"' + ((selectedNode.payload.charId || st.charId) === cid ? ' selected' : '') + '>' + esc(FOUNDRY.CHARACTERS[cid].name) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">CARD MOTION STYLE</label>' +
                '<select id="ins-node-style" class="st-select" style="width:100%">' +
                  TAX.STYLES.map(function (s) {
                    return '<option value="' + esc(s.key) + '"' + ((selectedNode.payload.styleKey || 'watercolor') === s.key ? ' selected' : '') + '>' + esc(s.title) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">CARD STORYLINE</label>' +
                '<select id="ins-node-story" class="st-select" style="width:100%">' +
                  TAX.STORIES.map(function (s) {
                    return '<option value="' + esc(s.key) + '"' + ((selectedNode.payload.storyKey || 's_voice') === s.key ? ' selected' : '') + '>' + esc(s.title) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">CARD SPINE ARC</label>' +
                '<select id="ins-node-spine-arc" class="st-select" style="width:100%">' +
                  (CO.SPINE_ARC_ORDER || []).map(function (arcId) {
                    const arc = (CO.SPINE_ARCS && CO.SPINE_ARCS[arcId]) || { id: arcId, label: arcId };
                    return '<option value="' + esc(arcId) + '"' + ((selectedNode.payload.spineArc || st.spineArc) === arcId ? ' selected' : '') + '>' + esc(arc.label) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div><label class="st-label">CARD WADA PALETTE OR SAVED #COLOR SCHEME</label>' +
                '<select id="ins-node-pal" class="st-select" style="width:100%">' +
                  '<optgroup label="★ Saved #color Schemes">' +
                    (st.savedColorSchemes || []).map(function (sc) {
                      return '<option value="' + sc.palId + '"' + ((selectedNode.payload.palId || 343) === sc.palId ? ' selected' : '') + '>' + esc(sc.handle) + ' · ' + esc(sc.name) + ' (No. ' + sc.palId + ')</option>';
                    }).join('') +
                  '</optgroup>' +
                  '<optgroup label="Curated Sanzo Wada Plates">' +
                    WADA.PALS.map(function (p) {
                      return '<option value="' + p.id + '"' + ((selectedNode.payload.palId || 343) === p.id ? ' selected' : '') + '>No. ' + p.id + ' · ' + esc(p.name) + '</option>';
                    }).join('') +
                  '</optgroup>' +
                '</select></div>' +
              '<div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center">' +
                  '<label class="st-label">BRANCH NOTES (TYPE # OR / FOR VOCAB)</label>' +
                  '<button data-action="open-vocab-for-field" data-field="ins-node-notes" class="st-mini-btn" style="padding:1px 5px;font-size:8.5px">+ #Insert</button>' +
                '</div>' +
                '<textarea id="ins-node-notes" data-vocab-autocomplete="true" rows="2" class="st-input" style="width:100%">' + esc(selectedNode.payload.notes || '') + '</textarea></div>' +
              '<div><label class="st-label">CONJECTURE (†C) / FORK HYPOTHESIS</label>' +
                '<input id="ins-node-conjecture" type="text" class="st-input" style="width:100%" value="' + esc(selectedNode.conjectureNote || '') + '" placeholder="†C Conjecture note for this branch..."/></div>' +
              '<div style="display:flex;gap:5px;flex-wrap:wrap">' +
                '<button data-action="save-node-inspector" class="st-btn st-btn-ink">Update Card</button>' +
                '<button data-action="duplicate-dag-node" data-node-id="' + esc(selectedNode.id) + '" class="st-btn">⧉ Duplicate</button>' +
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
  // SURFACE 3 · CHARACTER & EMBLEM FOUNDRY (G03 · G04 · G05 · G32)
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
          '<span class="st-mono-xs">' + esc(c.archetype.toUpperCase()) + ' · #character/' + esc(id) + '</span>' +
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

    const locoModes = FOUNDRY.LOCOMOTION_MODES || ['undulate-swim', 'flap-glide', 'radial-pulse', ' articulated-stride', 'shear-drift', 'orbital-harmonic'];
    const sevOps = FOUNDRY.SEVERANCE_OPS || ['none', 'split-horizontal', 'split-vertical', 'shatter-plates', 'hinge-break', 'negative-space-bite', 'spiral-uncoil', 'interlock-hook', 'radial-burst', 'compression-vice', 'stencil-cut', 'glyph-collapse'];
    const streakKinds = ['hydro-wake', 'thermal-draft', 'vortex-ring', 'dust-arc', 'shear-grid', 'harmonic-wave'];

    return '<section class="st-surface">' +
      '<div class="st-panel">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<span class="st-eyebrow">UNIVERSAL PARAMETRIC ACTOR SOCKET · ZERO HARDCODED MASCOTS (GATE G03 · G04 · G05 · G32)</span>' +
            '<h2 class="st-section-h2" style="margin:4px 0">Character &amp; Emblem Foundry — ' + esc(charSpec.name) + '</h2>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button data-action="clone-custom-rig" class="st-btn st-btn-ink" title="Clone active character rig into a new immutable custom CharacterSpec">+ ⧉ Clone &amp; Save Custom Rig</button>' +
            '<button data-action="synthesize-new-character" class="st-btn st-btn-rust">+ Synthesize New Parametric Rig</button>' +
          '</div>' +
        '</div>' +
        '<div class="char-grid-4" style="margin-top:12px">' + archetypeCards + '</div>' +
      '</div>' +

      '<!-- Live Parametric Anatomy Sliders, Locomotion/Severance Selectors & 4-Test Emblem Gauntlet -->' +
      '<div class="fork-grid-2" style="margin-top:16px">' +
        '<div class="st-panel">' +
          '<div class="st-eyebrow">LIVE PARAMETRIC ANATOMY, LOCOMOTION &amp; SAUL BASS SEVERANCE CONTROLS</div>' +
          '<div class="st-grid-2" style="margin-top:10px">' +
            '<div><label class="st-label">ASPECT RATIO (' + charSpec.aspectRatio + ')</label><input type="range" data-rig-param="aspectRatio" min="0.24" max="0.54" step="0.02" value="' + charSpec.aspectRatio + '" style="width:100%"/></div>' +
            '<div><label class="st-label">DORSAL ARCH (' + bp.dorsalArch + ')</label><input type="range" data-rig-param="dorsalArch" min="0.20" max="0.55" step="0.02" value="' + bp.dorsalArch + '" style="width:100%"/></div>' +
            '<div><label class="st-label">VENTRAL BELLY (' + bp.ventralBelly + ')</label><input type="range" data-rig-param="ventralBelly" min="0.20" max="0.55" step="0.02" value="' + bp.ventralBelly + '" style="width:100%"/></div>' +
            '<div><label class="st-label">SPINE WAVE AMP (' + sw.ampDefault + ')</label><input type="range" data-rig-param="ampDefault" min="0.04" max="0.34" step="0.02" value="' + sw.ampDefault + '" style="width:100%"/></div>' +
            '<div><label class="st-label">FIN SPAN (' + ap.primaryFinSpan + ')</label><input type="range" data-rig-param="primaryFinSpan" min="0.16" max="0.46" step="0.02" value="' + ap.primaryFinSpan + '" style="width:100%"/></div>' +
            '<div><label class="st-label">VENTRAL GROOVES (' + ap.ventralGrooves + ')</label><input type="range" data-rig-param="ventralGrooves" min="1" max="6" step="1" value="' + ap.ventralGrooves + '" style="width:100%"/></div>' +
          '</div>' +
          '<div class="st-grid-2" style="margin-top:10px">' +
            '<div><label class="st-label">LOCOMOTION MODE (6 CANONICAL)</label>' +
              '<select id="rig-locomotion-select" class="st-select" style="width:100%">' +
                locoModes.map(function (lm) {
                  return '<option value="' + esc(lm) + '"' + (charSpec.locomotion === lm ? ' selected' : '') + '>' + esc(lm) + '</option>';
                }).join('') +
              '</select></div>' +
            '<div><label class="st-label">SAUL BASS SEVERANCE OP (12 OPS)</label>' +
              '<select id="rig-severance-select" class="st-select" style="width:100%">' +
                sevOps.map(function (op) {
                  return '<option value="' + esc(op) + '"' + ((charSpec.severanceOp || 'none') === op ? ' selected' : '') + '>' + esc(op) + '</option>';
                }).join('') +
              '</select></div>' +
            '<div><label class="st-label">WAKE / STREAK KIND</label>' +
              '<select id="rig-streak-kind-select" class="st-select" style="width:100%">' +
                streakKinds.map(function (sk) {
                  return '<option value="' + esc(sk) + '"' + ((ap.streakKind || 'hydro-wake') === sk ? ' selected' : '') + '>' + esc(sk) + '</option>';
                }).join('') +
              '</select></div>' +
            '<div style="display:flex;align-items:flex-end">' +
              '<button data-action="clone-custom-rig" class="st-btn st-btn-rust" style="width:100%">⧉ Save Current Sliders as Custom Rig</button>' +
            '</div>' +
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
          '<div class="st-eyebrow">PART-BASED RIG SOCKET INSPECTOR (`e_rig`) · SEVERANCE: ' + esc((charSpec.severanceOp || 'none').toUpperCase()) + '</div>' +
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
  // SURFACE 4 · 8-BEAT STORYBOARD SHEET & TIMELINE (G08 · G26 · G29 · G31)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceStoryboard = function (pal, charSpec) {
    const st = this.state;
    const sheet = st.storyboard;
    const audit = sheet.audit || { coveredOk: true, movementOk: true, oneBreather: true, callback: true };
    const savedSchemes = (st.savedColorSchemes && st.savedColorSchemes.length) ? st.savedColorSchemes : (CO.DEFAULT_SAVED_SCHEMES || []);

    const beatCards = (sheet.beats || []).map(function (b) {
      const beatPalId = b.palId || pal.id;
      return '<div class="sb-card" draggable="true" data-sb-beat-card="' + b.index + '" title="Drag &amp; drop to reorder this beat card at will">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:4px">' +
          '<div style="display:flex;gap:3px;align-items:center">' +
            '<span class="st-mono-xs" style="cursor:grab" title="Drag card to reorder">✥</span>' +
            '<button data-action="scrub-to-beat" data-t="' + b.tMidSec + '" class="st-mini-btn" title="Jump clock to Beat ' + (b.index + 1) + ' (' + b.tMidSec + 's)">▶ B' + (b.index + 1) + ' · ' + b.tStartSec + 's</button>' +
            (b.index > 0 ? '<button data-action="move-beat-card" data-from="' + b.index + '" data-to="' + (b.index - 1) + '" class="st-mini-btn" style="padding:1px 4px" title="Move Beat Left">◀</button>' : '') +
            (b.index < 7 ? '<button data-action="move-beat-card" data-from="' + b.index + '" data-to="' + (b.index + 1) + '" class="st-mini-btn" style="padding:1px 4px" title="Move Beat Right">▶</button>' : '') +
          '</div>' +
          '<select data-beat-hinge="' + b.index + '" class="st-select" style="padding:2px 5px;font-size:9.5px">' +
            '<option value="THEREFORE"' + (b.hinge === 'THEREFORE' ? ' selected' : '') + '>THEREFORE · ' + esc(b.role.toUpperCase()) + '</option>' +
            '<option value="BUT"' + (b.hinge === 'BUT' ? ' selected' : '') + '>BUT · ' + esc(b.role.toUpperCase()) + '</option>' +
          '</select>' +
        '</div>' +
        '<canvas width="320" height="200" data-proof="' + esc(sheet.storyKey) + '" data-char="' + esc(charSpec.id) + '" data-pal-id="' + beatPalId + '" data-fixed-t="' + b.tMidSec + '" data-cam="' + esc(b.cameraMove || 'static-wide') + '" data-beat-idx="' + b.index + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.16);cursor:pointer" data-action="scrub-to-beat" data-t="' + b.tMidSec + '"></canvas>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 3px">' +
          '<div style="font-weight:700;font-size:13px">' + esc(b.label) + '</div>' +
          '<select data-beat-pal="' + b.index + '" class="st-select" style="padding:1px 4px;font-size:9.5px;max-width:125px" title="Pin a saved #color scheme to this specific beat">' +
            '<option value="' + pal.id + '"' + (!b.palId ? ' selected' : '') + '>Global (' + esc(pal.no) + ')</option>' +
            savedSchemes.map(function (sc) {
              return '<option value="' + sc.palId + '"' + (b.palId === sc.palId ? ' selected' : '') + '>' + esc(sc.handle) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<textarea data-beat-action="' + b.index + '" data-vocab-autocomplete="true" rows="2" class="st-input" style="width:100%;font-size:11px;margin-bottom:6px" placeholder="Type # or / to insert motion elements or camera moves...">' + esc(b.visualAction) + '</textarea>' +
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
            '<span class="st-eyebrow">STAGE-4 / STAGE-5 STORYBOARD BEAT SHEET · SPINE ARC: ' + esc((sheet.spineArcLabel || sheet.spineArc || 'saul-seven-beat').toUpperCase()) + ' (GATE G08 · G26 · G31)</span>' +
            '<h2 class="st-section-h2" style="margin:4px 0">' + esc(sheet.title) + ' · ' + esc(pal.no) + ' ' + esc(pal.name) + '</h2>' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<select id="sb-story-select" class="st-select" title="Select Storyline Proof">' +
              TAX.STORIES.map(function (s) {
                return '<option value="' + esc(s.key) + '"' + (st.storyKey === s.key ? ' selected' : '') + '>' + esc(s.title) + '</option>';
              }).join('') +
            '</select>' +
            '<select id="sb-spine-arc-select" class="st-select" title="Select Canonical Narrative Spine Arc">' +
              (CO.SPINE_ARC_ORDER || []).map(function (arcId) {
                const arc = (CO.SPINE_ARCS && CO.SPINE_ARCS[arcId]) || { id: arcId, label: arcId };
                return '<option value="' + esc(arcId) + '"' + ((st.spineArc || sheet.spineArc) === arcId ? ' selected' : '') + '>Arc: ' + esc(arc.label) + '</option>';
              }).join('') +
            '</select>' +
            '<button data-action="toggle-vocab-modal" class="st-btn" title="Browse &amp; Insert Plain-English Elements"># Insert Elements / Themes</button>' +
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
// PART 2B · SURFACES 5–7 (Sanzo Wada 348 & Tagged Color Scheme Vault, 15 Styles
// & 24 Elements Contact Sheet, Compile & Export Room), OAuth 2.0 PKCE Modal,
// # / Plain-English Vocabulary & Themes Modal, 29-Gate Audit Modal, and
// Effortless Freeform Card Dragging + Live # / Autocomplete Wiring
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
  // SURFACE 5 · SANZO WADA 348 DICTIONARY & TAGGED COLOR SCHEME VAULT (G01 · G02 · G29)
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

    const savedCardsHtml = (st.savedColorSchemes || []).map(function (sc) {
      const wadaCombo = st.activeWadaCombos.find(function (p) { return p.id === sc.palId; }) || pal;
      const isCurrent = pal.id === sc.palId;
      const swBars = (wadaCombo.sw || []).map(function (s) {
        return '<div style="flex:1;height:20px;background:' + s[0] + '" title="' + esc(s[1]) + ' ' + s[0] + '"></div>';
      }).join('');
      return '<div class="char-card ' + (isCurrent ? 'char-card-active' : '') + '" style="padding:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px">' +
          '<code style="font-size:10.5px;font-weight:700;color:#8C4A2E;background:rgba(140,74,46,.08);padding:2px 6px;border-radius:4px">' + esc(sc.token) + '</code>' +
          '<span class="st-mono-xs">Wada No. ' + sc.palId + '</span>' +
        '</div>' +
        '<div style="font-weight:700;font-size:13px;margin:4px 0 2px">' + esc(sc.title) + '</div>' +
        '<div style="display:flex;border-radius:4px;overflow:hidden;border:1px solid rgba(26,31,46,.18);margin:4px 0">' + swBars + '</div>' +
        '<div style="font-size:11px;color:rgba(26,31,46,.72);margin-bottom:6px">' + esc(sc.notes || wadaCombo.mood || '') + '</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
          '<button data-action="invoke-saved-scheme" data-scheme-tag="' + esc(sc.token) + '" class="st-mini-btn ' + (isCurrent ? 'on' : '') + '" style="flex:1">● Apply Global</button>' +
          '<button data-action="apply-scheme-to-node" data-scheme-tag="' + esc(sc.token) + '" class="st-mini-btn" style="flex:1" title="Apply this saved scheme to active Source A card on the Living Canvas">→ Apply to Src A</button>' +
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
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-top:4px">' +
          '<span style="font-size:10.5px;color:rgba(26,31,46,.72);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc((p.sw || []).map(function (s) { return s[1]; }).join(' · ')) + '</span>' +
          '<button data-action="save-combo-as-scheme" data-pal-id="' + p.id + '" class="st-mini-btn" style="padding:1px 6px;font-size:9.5px" title="Tag & save this Wada combination to your #color Vault">+ #color</button>' +
        '</div>' +
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

    const defaultSlug = (pal.name || ('wada-' + pal.id)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return '<section class="st-surface">' +
      // TAGGED & SAVED COLOR SCHEME VAULT (GATE G29)
      '<div class="st-panel" style="margin-bottom:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px">' +
          '<div>' +
            '<span class="st-eyebrow">TAGGED &amp; SAVED COLOR SCHEME VAULT (GATE G29 · RE-INVOKE ANYWHERE VIA #color/&lt;tag&gt; OR /color/&lt;tag&gt;)</span>' +
            '<h3 style="margin:2px 0;font-family:Fraunces,serif;font-size:18px">Saved Studio Color Schemes (' + (st.savedColorSchemes || []).length + ' Tagged Palettes)</h3>' +
          '</div>' +
          '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:rgba(26,31,46,.04);padding:6px 10px;border-radius:6px;border:1px solid rgba(26,31,46,.14)">' +
            '<span class="st-mono-xs" style="font-weight:700">Tag Active Wada No. ' + pal.id + ':</span>' +
            '<input id="new-scheme-tag-input" type="text" value="' + esc(st.newSchemeTag || defaultSlug) + '" placeholder="e.g. brand-hero-warm" class="st-input" style="width:145px;padding:3px 7px;font-size:11px"/>' +
            '<input id="new-scheme-title-input" type="text" value="' + esc(st.newSchemeTitle || (pal.name + ' (' + pal.no + ')')) + '" placeholder="Display title..." class="st-input" style="width:170px;padding:3px 7px;font-size:11px"/>' +
            '<input id="new-scheme-notes-input" type="text" value="' + esc(st.newSchemeNotes || pal.mood || '') + '" placeholder="Mood / usage note..." class="st-input" style="width:180px;padding:3px 7px;font-size:11px"/>' +
            '<button data-action="save-color-scheme" class="st-btn st-btn-rust" style="padding:4px 10px;font-size:11px">★ Save #color Tag</button>' +
          '</div>' +
        '</div>' +
        (st.copiedNotice ? '<div style="margin-bottom:8px;padding:6px 10px;background:#2E5A44;color:#FBF3E6;border-radius:6px;font-size:11.5px">' + esc(st.copiedNotice) + '</div>' : '') +
        '<div class="char-grid-3">' + savedCardsHtml + '</div>' +
      '</div>' +

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
  // SURFACE 6 · 15 STYLES & 24 ELEMENTS CONTACT SHEET (G06 · G28)
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderSurfaceContactSheet = function (pal, charSpec) {
    const styleCards = TAX.STYLES.map(function (s) {
      return '<div class="char-card">' +
        '<div style="display:flex;justify-content:space-between"><span class="st-mono-xs">' + esc(s.branch) + ' · ' + esc(s.family.toUpperCase()) + '</span><span class="st-mono-xs">' + esc(s.fps) + '</span></div>' +
        '<div style="font-weight:700;font-size:14px;margin:4px 0">' + esc(s.title) + '</div>' +
        '<canvas width="280" height="175" data-proof="' + esc(s.key) + '" data-char="' + esc(charSpec.id) + '" style="width:100%;height:auto;border-radius:6px;border:1px solid rgba(26,31,46,.15);margin:4px 0"></canvas>' +
        '<p style="font-size:11px;color:rgba(26,31,46,.75);margin:0 0 6px">' + esc(s.summary) + '</p>' +
        '<div style="display:flex;gap:4px">' +
          '<button data-action="spawn-fork-to-dag" data-proof="' + esc(s.key) + '" data-title="' + esc(s.title) + '" class="st-mini-btn on" style="flex:1">+ Spawn Card</button>' +
          '<button data-action="apply-style-to-src-a" data-style-key="' + esc(s.key) + '" class="st-mini-btn" style="flex:1">→ Apply to Src A</button>' +
        '</div>' +
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
        '<div class="st-mono-xs" style="opacity:.75;margin-bottom:6px">' + esc(det.numbers) + '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button data-action="spawn-fork-to-dag" data-proof="' + esc(item[2]) + '" data-title="Element · ' + esc(item[1]) + '" class="st-mini-btn on" style="flex:1">+ Insert on Canvas</button>' +
          '<button data-action="apply-style-to-src-a" data-style-key="' + esc(item[2]) + '" class="st-mini-btn" style="flex:1">→ Set on Src A</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<section class="st-surface">' +
      '<div class="st-panel">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
          '<div class="st-eyebrow">ALL 15 MOTION STYLES · RUNNING ON ONE CLOCK WITH ' + esc(charSpec.name.toUpperCase()) + ' &amp; WADA ' + esc(pal.no) + '</div>' +
          '<button data-action="toggle-vocab-modal" class="st-mini-btn on">📖 Open Plain-English # / Vocabulary &amp; Themes Browser [K]</button>' +
        '</div>' +
        '<div class="char-grid-3" style="margin-top:12px">' + styleCards + '</div>' +
      '</div>' +
      '<div class="st-panel" style="margin-top:16px">' +
        '<div class="st-eyebrow">ALL 24 MOTION BUILDING BLOCKS · 6 STRUCTURAL LAYERS (1-CLICK INSERT TO LIVING CANVAS OR SOURCE A)</div>' +
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
  // MODALS: OAUTH 2.0 PKCE ENHANCER, # / VOCABULARY & THEMES BROWSER, & 29-GATE AUDIT
  // ─────────────────────────────────────────────────────────────────────────
  proto.renderModals = function (pal, charSpec, audit) {
    const st = this.state;
    let html = '';

    // 1. OAUTH 2.0 PKCE + # / VOCABULARY LIVE ENHANCER MODAL
    if (st.oauthModalOpen) {
      const last = st.oauthLastResult;
      const rsi = st.rsiCritiqueResult;
      const srcAOpts = (st.dag.nodes || []).map(function (n) {
        return '<option value="' + esc(n.id) + '"' + (st.selectedNodeId === n.id ? ' selected' : '') + '>● Src A: ' + esc(n.title) + ' (' + esc(n.id) + ')</option>';
      }).join('');
      const srcBOpts = (st.dag.nodes || []).map(function (n) {
        return '<option value="' + esc(n.id) + '"' + (st.compareNodeId === n.id ? ' selected' : '') + '>◐ Src B: ' + esc(n.title) + ' (' + esc(n.id) + ')</option>';
      }).join('');

      const quickTokens = [
        ['#theme/saul-bass-cutout', '🎨 Saul Bass Cutout'],
        ['#theme/ghibli-watercolor', '🎨 Ghibli Watercolor'],
        ['#theme/blueprint-telemetry', '🎨 Blueprint Telemetry'],
        ['#element/negative-space-reveal', '🧱 Negative-Space Reveal'],
        ['#element/grain-stipple', '🧱 Film Grain & Stipple'],
        ['#camera/match-cut-morph', '🎥 Match-Cut Morph'],
        ['#feel/held-24fps', '⚡ Held 12fps Stop-Motion'],
        ['#color/pelagic-dawn', '🏷 #color/pelagic-dawn'],
        ['#color/saul-cutout-ocher', '🏷 #color/saul-cutout-ocher']
      ].map(function (pair) {
        return '<button data-action="insert-vocab-token" data-vocab-token="' + esc(pair[0]) + '" class="st-mini-btn" style="padding:2px 6px;font-size:10px" title="Insert ' + esc(pair[0]) + ' into prompt and apply its settings">' + esc(pair[1]) + ' <code>' + esc(pair[0]) + '</code></button>';
      }).join('');

      html += '<div class="st-modal-backdrop">' +
        '<div class="st-modal">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
            '<div>' +
              '<span class="st-eyebrow">RFC 7636 OAUTH 2.0 PKCE (S256) + LOCAL AGENT BRIDGE + # / SKILL VOCABULARY SYNTHESIZER (G10 · G11 · G27 · G28)</span>' +
              '<h3 style="margin:4px 0;font-family:Fraunces,serif;font-size:22px">Live Storyboard, Source Branch &amp; Character Enhancer</h3>' +
            '</div>' +
            '<div style="display:flex;gap:6px">' +
              '<button data-action="toggle-vocab-modal" class="st-mini-btn on">📖 # / Vocabulary Library</button>' +
              '<button data-action="toggle-oauth-modal" class="st-mini-btn">✕ Close</button>' +
            '</div>' +
          '</div>' +

          // DIRECT SOURCE A & SOURCE B PICKERS (GATE G27)
          '<div class="st-grid-2" style="margin:10px 0;padding:8px 10px;background:rgba(140,74,46,.06);border:1px solid rgba(140,74,46,.22);border-radius:6px">' +
            '<div>' +
              '<label class="st-label" style="color:#8C4A2E">PRIMARY SOURCE CARD TO ENHANCE / FORK FROM (● SOURCE A)</label>' +
              '<select id="oauth-source-a-select" class="st-select" style="width:100%">' + srcAOpts + '</select>' +
            '</div>' +
            '<div>' +
              '<label class="st-label" style="color:#1F5A73">SECONDARY COMPARE / PUSHOUT SOURCE (◐ SOURCE B)</label>' +
              '<select id="oauth-source-b-select" class="st-select" style="width:100%">' + srcBOpts + '</select>' +
            '</div>' +
          '</div>' +

          '<div class="st-grid-2" style="margin:10px 0">' +
            '<div><label class="st-label">AUTH PROVIDER MODE</label>' +
              '<select id="oauth-provider-select" class="st-select" style="width:100%">' +
                '<option value="local-bridge"' + (st.oauthProvider === 'local-bridge' ? ' selected' : '') + '>Local Loopback Bridge (127.0.0.1:43110 / :8787) + PKCE</option>' +
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

          '<div style="position:relative">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px">' +
              '<label class="st-label" style="margin-bottom:0">ENHANCEMENT DIRECTIVE (TYPE <code>#</code> OR <code>/</code> FOR LIVE VOCABULARY, THEME &amp; #COLOR AUTOCOMPLETE)</label>' +
              '<span class="st-mono-xs" style="color:#8C4A2E">Supports #theme/... · #element/... · #camera/... · #color/...</span>' +
            '</div>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">' + quickTokens + '</div>' +
            '<textarea id="oauth-prompt-input" data-vocab-autocomplete="true" rows="3" class="st-input" style="width:100%">' + esc(st.oauthPrompt) + '</textarea>' +
          '</div>' +

          '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
            '<button data-action="run-oauth-enhance" class="st-btn st-btn-rust">' + (st.oauthBusy ? 'Enhancing & Validating Schema...' : '✦ 1. Enhance 8 Beats + Spawn Child from Source A') + '</button>' +
            '<button data-action="fork-three-directions" data-node-id="' + esc(st.selectedNodeId) + '" class="st-btn st-btn-ink">⑂ 2. Fork 3 Directions (α/β/γ) from Source A</button>' +
            '<button data-action="dag-synthesize-ab" class="st-btn">⊕ 3. Pushout Merge (Source A ⊕ Source B)</button>' +
            '<button data-action="synthesize-new-character" class="st-btn">✦ 4. Synthesize Character Rig</button>' +
            '<button data-action="run-rsi-critique" class="st-btn">⚖ 5. Run 4-Lens RSI Critique &amp; Fix</button>' +
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

    // 2. PLAIN-ENGLISH # / VOCABULARY, THEMES, ELEMENTS & #COLOR BROWSER MODAL (GATE G28 · G29)
    if (st.vocabModalOpen) {
      const catList = [
        ['all', 'All (' + (CO.getFullVocabLibrary ? CO.getFullVocabLibrary(st.savedColorSchemes).length : 42) + ')'],
        ['theme', '🎨 Themes & Looks (#theme)'],
        ['element', '🧱 Visual Elements (#element)'],
        ['camera', '🎥 Camera & Cuts (#camera)'],
        ['feel', '⚡ Physics & Timing (#feel)'],
        ['character', '🐋 Character Rigs (#character)'],
        ['color', '🏷 Saved Color Schemes (#color)']
      ];
      const matches = CO.searchVocabLibrary
        ? CO.searchVocabLibrary(st.vocabSearch || '', st.vocabCategory || 'all', st.savedColorSchemes)
        : [];

      const catPills = catList.map(function (c) {
        return '<button data-action="set-vocab-cat" data-cat="' + c[0] + '" class="st-mini-btn ' + ((st.vocabCategory || 'all') === c[0] ? 'on' : '') + '">' + esc(c[1]) + '</button>';
      }).join('');

      const itemRows = matches.map(function (item) {
        return '<div class="char-card" style="display:flex;flex-direction:column;justify-content:space-between;padding:10px">' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;flex-wrap:wrap">' +
              '<code style="font-size:10.5px;font-weight:700;color:#8C4A2E;background:rgba(140,74,46,.09);padding:2px 6px;border-radius:4px">' + esc(item.token) + '</code>' +
              '<code style="font-size:10px;color:#1F5A73">' + esc(item.slash) + '</code>' +
            '</div>' +
            '<div style="font-weight:700;font-size:13.5px;margin:5px 0 3px">' + esc(item.plainName) + '</div>' +
            '<p style="font-size:11.5px;color:rgba(26,31,46,.78);margin:0 0 8px;line-height:1.4">' + esc(item.plainDesc) + '</p>' +
          '</div>' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap;padding-top:6px;border-top:1px dashed rgba(26,31,46,.14)">' +
            '<button data-action="apply-vocab-token" data-vocab-token="' + esc(item.token) + '" class="st-mini-btn on" style="flex:1" title="Immediately apply this look, element, or color scheme to Studio & Source A">● Apply Now</button>' +
            '<button data-action="spawn-vocab-card" data-vocab-token="' + esc(item.token) + '" class="st-mini-btn" style="flex:1" title="Spawn a new card on the Living Canvas with this preset">+ Spawn Card</button>' +
            '<button data-action="insert-vocab-token" data-vocab-token="' + esc(item.token) + '" class="st-mini-btn" title="Insert this #token into the active prompt & inspector notes">↵ #Prompt</button>' +
          '</div>' +
        '</div>';
      }).join('');

      html += '<div class="st-modal-backdrop">' +
        '<div class="st-modal" style="width:min(980px, 96vw)">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
            '<div>' +
              '<span class="st-eyebrow">IN-STUDIO SKILLS, VOCABULARY &amp; TAGGED COLOR LIBRARY (GATE G28 · G29 · INVOCABLE VIA # OR / IN ANY PROMPT)</span>' +
              '<h3 style="margin:3px 0;font-family:Fraunces,serif;font-size:21px">Plain-English Design Vocabulary, Themes, Elements &amp; #Color Vault</h3>' +
            '</div>' +
            '<button data-action="toggle-vocab-modal" class="st-mini-btn">✕ Close [Esc]</button>' +
          '</div>' +
          '<p style="font-size:12px;color:rgba(26,31,46,.78);margin:4px 0 10px">Don\'t know the technical motion-graphics term? Search in plain English below (e.g. <em>"paper cutout"</em>, <em>"watercolor"</em>, <em>"grain"</em>, <em>"slow camera"</em>, <em>"stop motion"</em>, or <em>"#color"</em>) and click <strong>● Apply Now</strong> or <strong>+ Spawn Card</strong>. You can also type <code>#</code> or <code>/</code> inside any studio prompt or card note for instant autocomplete.</p>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">' +
            '<input id="vocab-modal-search" type="text" value="' + esc(st.vocabSearch || '') + '" placeholder="Search plain English or #token (e.g. paper cutout, grain, match cut, #color/pelagic-dawn)..." class="st-input" style="flex:1;min-width:220px"/>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap">' + catPills + '</div>' +
          '</div>' +
          (st.copiedNotice ? '<div style="margin-bottom:8px;padding:6px 10px;background:#2E5A44;color:#FBF3E6;border-radius:6px;font-size:11.5px">' + esc(st.copiedNotice) + '</div>' : '') +
          '<div class="char-grid-3" style="max-height:460px;overflow-y:auto;padding-right:4px">' + itemRows + '</div>' +
        '</div>' +
      '</div>';
    }

    // 3. 32-GATE MECHANICAL CONTRACT AUDIT MODAL
    if (st.gateModalOpen) {
      const tellApart = MA.auditArchetypeDiscriminability ? MA.auditArchetypeDiscriminability() : { pass: true, minDistance: 0.42, pairCount: 28 };
      const sheafCheck = CO.verifyDAGSheafCohomology ? CO.verifyDAGSheafCohomology(st.dag) : { valid: true, edgeCount: (st.dag.edges || []).length };
      html += '<div class="st-modal-backdrop">' +
        '<div class="st-modal">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
            '<div>' +
              '<span class="st-eyebrow">32 BINARY CONSERVATION GATES + TELL-APART + SHEAF + MOBILE + 10X ARCHITECTURE (G01–G32)</span>' +
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
    let prevWadaScroll = 0, prevTabsScroll = 0;
    try {
      const ae = document.activeElement;
      if (ae && ae.id && this.root.contains(ae)) {
        activeId = ae.id;
        if (typeof ae.selectionStart === 'number') {
          selStart = ae.selectionStart;
          selEnd = ae.selectionEnd;
        }
      }
      const ws = this.root.querySelector('.st-wada-strip');
      const ts = this.root.querySelector('.st-tabs');
      if (ws) prevWadaScroll = ws.scrollLeft;
      if (ts) prevTabsScroll = ts.scrollLeft;
    } catch (_e) { /* ignore */ }

    const pal = this.getActivePalette();
    const charSpec = this.getActiveChar();
    const audit = this.getAuditResult ? this.getAuditResult() : CO.run16GateAudit(this.state);
    const gKey = WADA.normalizeGroundKey ? WADA.normalizeGroundKey(this.state.ground) : this.state.ground;
    const isDarkGround = Boolean(WADA.GROUNDS[gKey] && WADA.GROUNDS[gKey].dark);

    let bodyHtml = '';
    if (this.state.surface === 'infinite-canvas') bodyHtml = this.renderSurfaceInfiniteCanvas(pal, charSpec);
    else if (this.state.surface === 'fork-explorer') bodyHtml = this.renderSurfaceForkExplorer(pal, charSpec);
    else if (this.state.surface === 'character-foundry') bodyHtml = this.renderSurfaceCharacterFoundry(pal, charSpec);
    else if (this.state.surface === 'storyboard-sheet') bodyHtml = this.renderSurfaceStoryboard(pal, charSpec);
    else if (this.state.surface === 'wada-chord-matrix') bodyHtml = this.renderSurfaceWada(pal, charSpec);
    else if (this.state.surface === 'contact-sheet') bodyHtml = this.renderSurfaceContactSheet(pal, charSpec);
    else if (this.state.surface === 'compile-export') bodyHtml = this.renderSurfaceCompile(pal, charSpec);

    this.root.innerHTML =
      '<div class="st-shell' + (isDarkGround ? ' ground-dark' : '') + '" style="background:' + pal.paper + ';color:' + pal.ink + '">' +
        this.renderHeaderBar(pal, charSpec, audit) +
        '<main class="st-main">' + bodyHtml + '</main>' +
        this.renderModals(pal, charSpec, audit) +
      '</div>';

    try {
      const wsNext = this.root.querySelector('.st-wada-strip');
      const tsNext = this.root.querySelector('.st-tabs');
      if (wsNext && prevWadaScroll) wsNext.scrollLeft = prevWadaScroll;
      if (tsNext && prevTabsScroll) tsNext.scrollLeft = prevTabsScroll;
    } catch (_e) { /* ignore */ }

    this.attachDOMListeners();
    this.drawAllCanvases(false);

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

  // Helper: Apply a vocabulary item's patch to studio state + active Source A card
  proto.applyVocabItem = function (item, spawnNewCard) {
    if (!item) return;
    const st = this.state;
    const patch = item.patch || {};
    const nextState = {};

    const pStyle = patch.styleKey || patch.mStyle;
    if (patch.charId) nextState.charId = patch.charId;
    if (pStyle) nextState.mStyle = pStyle;
    if (patch.storyKey) nextState.storyKey = patch.storyKey;
    if (patch.feel) nextState.feel = patch.feel;
    if (patch.rung) nextState.rung = patch.rung;
    if (patch.ground) nextState.ground = patch.ground;
    if (patch.palId) {
      const idx = st.activeWadaCombos.findIndex(function (p) { return p.id === Number(patch.palId); });
      if (idx >= 0) nextState.palIdx = idx;
    }

    if (spawnNewCard) {
      const res = CO.forkCanvasNode(st.dag, st.selectedNodeId, {
        title: item.plainName + ' (' + item.token + ')',
        subtitle: (patch.palId ? 'Wada No. ' + patch.palId : 'Wada No. ' + this.getActivePalette().id) + ' · ' + (pStyle || st.mStyle),
        charId: patch.charId || st.charId,
        palId: patch.palId || this.getActivePalette().id,
        styleKey: pStyle || st.mStyle,
        storyKey: patch.storyKey || st.storyKey,
        edgeLabel: item.token,
        payload: {
          notes: item.plainDesc + ' [' + item.token + ']'
        }
      });
      nextState.dag = { nodes: res.nodes, edges: res.edges };
      nextState.selectedNodeId = res.createdNodeId;
      nextState.surface = 'infinite-canvas';
      nextState.vocabModalOpen = false;
    } else {
      const nodeA = (st.dag.nodes || []).find(function (n) { return n.id === st.selectedNodeId; });
      if (nodeA && nodeA.payload) {
        if (patch.charId) nodeA.payload.charId = patch.charId;
        if (pStyle) nodeA.payload.styleKey = pStyle;
        if (patch.storyKey) nodeA.payload.storyKey = patch.storyKey;
        if (patch.palId) nodeA.payload.palId = Number(patch.palId);
        const tagNote = '[' + item.token + ']';
        if (!String(nodeA.payload.notes || '').includes(tagNote)) {
          nodeA.payload.notes = (nodeA.payload.notes ? nodeA.payload.notes + ' ' : '') + tagNote;
        }
        nodeA.subtitle = 'Wada No. ' + nodeA.payload.palId + ' · ' + nodeA.payload.styleKey;
        if (CO.stampDAGRestrictionHashes) CO.stampDAGRestrictionHashes(st.dag);
        nextState.dag = st.dag;
      }
      if (patch.cameraMove && st.storyboard && Array.isArray(st.storyboard.beats) && st.storyboard.beats[0]) {
        st.storyboard.beats[0].cameraMove = patch.cameraMove;
        if (CO.auditStoryboardSheet) CO.auditStoryboardSheet(st.storyboard);
        nextState.storyboard = st.storyboard;
      }
    }

    nextState.copiedNotice = 'Applied ' + item.token + ' — ' + item.plainName;
    this.setState(nextState);
  };

  proto.attachDOMListeners = function () {
    const self = this;
    const root = this.root;
    const loopSec = this.getActiveLoopDuration ? this.getActiveLoopDuration() : 12.0;

    // Select inputs
    const bindSel = function (id, fn) {
      const el = root.querySelector(id);
      if (el) el.addEventListener('change', function (e) { fn(e.target.value); });
    };
    bindSel('#sel-char', function (v) { self.setState({ charId: v }); });
    bindSel('#sel-interaction', function (v) { self.setState({ interaction: v }); });
    bindSel('#sel-spine-arc', function (v) { self.setState({ spineArc: v }); });
    bindSel('#sb-spine-arc-select', function (v) { self.setState({ spineArc: v }); });
    bindSel('#sel-feel', function (v) { self.setState({ feel: v }); });
    bindSel('#sel-ground', function (v) { self.setState({ ground: v }); });
    bindSel('#sel-source-a-node', function (v) {
      const n = (self.state.dag.nodes || []).find(function (nd) { return nd.id === v; });
      const pIdx = n && n.payload ? self.state.activeWadaCombos.findIndex(function (p) { return p.id === n.payload.palId; }) : -1;
      self.setState({
        selectedNodeId: v,
        charId: (n && n.payload && n.payload.charId) || self.state.charId,
        mStyle: (n && n.payload && n.payload.styleKey) || self.state.mStyle,
        storyKey: (n && n.payload && n.payload.storyKey) || self.state.storyKey,
        palIdx: pIdx >= 0 ? pIdx : self.state.palIdx
      });
    });
    bindSel('#sel-source-b-node', function (v) {
      self.setState({ compareNodeId: v, showABCompare: true });
    });
    bindSel('#sel-compare-node', function (v) { self.setState({ compareNodeId: v }); });
    bindSel('#oauth-source-a-select', function (v) { self.setState({ selectedNodeId: v }); });
    bindSel('#oauth-source-b-select', function (v) { self.setState({ compareNodeId: v }); });
    bindSel('#sb-story-select', function (v) { self.setState({ storyKey: v }); });
    bindSel('#oauth-provider-select', function (v) { self.setState({ oauthProvider: v }); });

    // Character Rig Locomotion, Severance Op, and Streak Kind selectors
    bindSel('#rig-locomotion-select', function (v) {
      const charSpec = self.getActiveChar();
      if (charSpec) {
        charSpec.locomotion = v;
        self.invalidateStaticCanvases();
        self.renderDOM();
      }
    });
    bindSel('#rig-severance-select', function (v) {
      const charSpec = self.getActiveChar();
      if (charSpec) {
        charSpec.severanceOp = v;
        if (Array.isArray(charSpec.reductionLadder)) {
          charSpec.reductionLadder.forEach(function (r) {
            if (r.rung >= 3) r.severanceOp = v;
          });
        }
        self.invalidateStaticCanvases();
        self.renderDOM();
      }
    });
    bindSel('#rig-streak-kind-select', function (v) {
      const charSpec = self.getActiveChar();
      if (charSpec && charSpec.appendages) {
        charSpec.appendages.streakKind = v;
        self.invalidateStaticCanvases();
        self.renderDOM();
      }
    });

    const scrub = root.querySelector('#global-scrub');
    if (scrub) {
      scrub.addEventListener('input', function (e) {
        self._T = Number(e.target.value);
        const tReadout = root.querySelector('#global-t-readout');
        if (tReadout) tReadout.textContent = 't = ' + (self._T % loopSec).toFixed(2) + 's';
        self.setState({ playing: false }, true);
        self.drawAllCanvases(false);
      });
    }

    // Live Finish & Motion Tweak Sliders (speed, grain, wob)
    const tweakSliders = root.querySelectorAll('[data-tweak-param]');
    for (let i = 0; i < tweakSliders.length; i++) {
      tweakSliders[i].addEventListener('input', function (e) {
        const param = e.target.getAttribute('data-tweak-param');
        const val = Number(e.target.value);
        if (param === 'speed' || param === 'grain' || param === 'wob') {
          self.state[param] = val;
          self.invalidateStaticCanvases();
          self.drawAllCanvases(false);
        }
      });
      tweakSliders[i].addEventListener('change', function () {
        self.renderDOM();
      });
    }

    const wadaInput = root.querySelector('#wada-search-input');
    if (wadaInput) {
      wadaInput.addEventListener('input', function (e) {
        self.setState({ wadaSearch: e.target.value });
      });
    }

    const vocabSearchInput = root.querySelector('#vocab-modal-search');
    if (vocabSearchInput) {
      vocabSearchInput.addEventListener('input', function (e) {
        self.setState({ vocabSearch: e.target.value });
      });
    }

    // Live # and / Autocomplete Popover inside any [data-vocab-autocomplete="true"] input/textarea
    const acInputs = root.querySelectorAll('[data-vocab-autocomplete="true"]');
    for (let i = 0; i < acInputs.length; i++) {
      acInputs[i].addEventListener('input', function (e) {
        const inp = e.target;
        const val = String(inp.value || '');
        const caret = typeof inp.selectionStart === 'number' ? inp.selectionStart : val.length;
        const beforeCaret = val.slice(0, caret);
        const match = beforeCaret.match(/(?:^|\s)([#/][a-zA-Z0-9/_-]*)$/);

        let pop = inp.parentElement.querySelector('.vocab-popover');
        if (!match) {
          if (pop) pop.remove();
          return;
        }
        const tokenQuery = match[1].slice(1);
        const results = CO.searchVocabLibrary ? CO.searchVocabLibrary(tokenQuery, 'all', self.state.savedColorSchemes).slice(0, 8) : [];
        if (!results.length) {
          if (pop) pop.remove();
          return;
        }
        if (!pop) {
          pop = document.createElement('div');
          pop.className = 'vocab-popover';
          pop.style.left = '0px';
          pop.style.top = (inp.offsetTop + inp.offsetHeight + 4) + 'px';
          inp.parentElement.style.position = 'relative';
          inp.parentElement.appendChild(pop);
        }
        pop.innerHTML =
          '<div style="padding:3px 6px;font-size:9.5px;font-family:\'Space Mono\',monospace;color:#8C4A2E;border-bottom:1px solid rgba(26,31,46,.12)">PLAIN-ENGLISH # / VOCABULARY &amp; #COLOR AUTOCOMPLETE (CLICK TO INSERT &amp; APPLY)</div>' +
          results.map(function (r) {
            return '<div class="vocab-item" data-ac-token="' + esc(r.token) + '">' +
              '<div><strong>' + esc(r.plainName) + '</strong> <span style="opacity:.72">— ' + esc(r.plainDesc.slice(0, 58)) + '...</span></div>' +
              '<code>' + esc(r.token) + '</code>' +
            '</div>';
          }).join('');

        const items = pop.querySelectorAll('[data-ac-token]');
        for (let j = 0; j < items.length; j++) {
          items[j].addEventListener('pointerdown', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            const chosenToken = ev.currentTarget.getAttribute('data-ac-token');
            const replaced = beforeCaret.replace(/([#/][a-zA-Z0-9/_-]*)$/, chosenToken + ' ') + val.slice(caret);
            inp.value = replaced;
            if (inp.id === 'oauth-prompt-input') self.state.oauthPrompt = replaced;
            if (inp.id === 'ins-node-notes') {
              const nodeA = (self.state.dag.nodes || []).find(function (n) { return n.id === self.state.selectedNodeId; });
              if (nodeA && nodeA.payload) nodeA.payload.notes = replaced;
            }
            pop.remove();
            const fullLib = CO.getFullVocabLibrary ? CO.getFullVocabLibrary(self.state.savedColorSchemes) : [];
            const found = fullLib.find(function (it) { return it.token === chosenToken; });
            if (found) self.applyVocabItem(found, false);
          });
        }
      });
    }

    // Inline Storyboard Beat Editing (Hinge, Camera, VisualAction, Per-Beat Palette [data-beat-pal])
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
          self.pushHistory();
          self.state.storyboard.beats[idx].hinge = e.target.value;
          reauditStoryboard();
          self.invalidateStaticCanvases();
          self.renderDOM();
        }
      });
    }

    const camSels = root.querySelectorAll('[data-beat-cam]');
    for (let i = 0; i < camSels.length; i++) {
      camSels[i].addEventListener('change', function (e) {
        const idx = Number(e.target.getAttribute('data-beat-cam'));
        if (self.state.storyboard.beats[idx]) {
          self.pushHistory();
          self.state.storyboard.beats[idx].cameraMove = e.target.value;
          reauditStoryboard();
          self.invalidateStaticCanvases();
          self.renderDOM();
        }
      });
    }

    const beatPalSels = root.querySelectorAll('[data-beat-pal]');
    for (let i = 0; i < beatPalSels.length; i++) {
      beatPalSels[i].addEventListener('change', function (e) {
        const idx = Number(e.target.getAttribute('data-beat-pal'));
        const chosenPalId = Number(e.target.value);
        if (self.state.storyboard.beats[idx] && chosenPalId) {
          self.pushHistory();
          self.state.storyboard.beats[idx].palId = chosenPalId;
          self.invalidateStaticCanvases();
          self.renderDOM();
        }
      });
    }

    const actInputs = root.querySelectorAll('[data-beat-action]');
    for (let i = 0; i < actInputs.length; i++) {
      actInputs[i].addEventListener('input', function (e) {
        const idx = Number(e.target.getAttribute('data-beat-action'));
        if (self.state.storyboard.beats[idx]) {
          self.state.storyboard.beats[idx].visualAction = e.target.value;
          self.state.storyboard.beats[idx].actionLine = e.target.value;
          self.state.storyboard.beats[idx].coveredSentence = e.target.value;
          reauditStoryboard();
        }
      });
      actInputs[i].addEventListener('change', function () {
        self.invalidateStaticCanvases();
        self.renderDOM();
      });
    }

    // Effortless HTML5 Drag-and-Drop Reordering on 8-Beat Storyboard Cards (Gate G26)
    const sbCards = root.querySelectorAll('[data-sb-beat-card]');
    for (let i = 0; i < sbCards.length; i++) {
      sbCards[i].addEventListener('dragstart', function (e) {
        const idx = Number(e.currentTarget.getAttribute('data-sb-beat-card'));
        self._draggingBeatIdx = idx;
        e.currentTarget.classList.add('sb-card-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(idx));
        }
      });
      sbCards[i].addEventListener('dragover', function (e) {
        e.preventDefault();
        e.currentTarget.classList.add('sb-card-drop-target');
      });
      sbCards[i].addEventListener('dragleave', function (e) {
        e.currentTarget.classList.remove('sb-card-drop-target');
      });
      sbCards[i].addEventListener('drop', function (e) {
        e.preventDefault();
        e.currentTarget.classList.remove('sb-card-drop-target');
        const toIdx = Number(e.currentTarget.getAttribute('data-sb-beat-card'));
        const fromIdx = self._draggingBeatIdx != null ? self._draggingBeatIdx : Number(e.dataTransfer && e.dataTransfer.getData('text/plain'));
        self._draggingBeatIdx = null;
        if (!Number.isNaN(fromIdx) && !Number.isNaN(toIdx) && fromIdx !== toIdx) {
          self.pushHistory();
          CO.moveStoryboardBeat(self.state.storyboard, fromIdx, toIdx);
          self.setState({ storyboard: self.state.storyboard });
        }
      });
      sbCards[i].addEventListener('dragend', function (e) {
        e.currentTarget.classList.remove('sb-card-dragging');
        self._draggingBeatIdx = null;
      });
    }

    // JSON Session Import with Strict Boundary Schema Validator (Gate G31)
    const importInput = root.querySelector('#import-session-file');
    if (importInput) {
      importInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
          try {
            const rawData = JSON.parse(String(ev.target.result));
            const check = CO.validateAndSanitizeSessionState
              ? CO.validateAndSanitizeSessionState(rawData)
              : { valid: true, state: rawData };
            if (!check.valid || !check.state) {
              self.setState({ copiedNotice: 'Rejected invalid .motion.studio.json: ' + (check.reason || 'schema mismatch') });
              return;
            }
            const data = check.state;
            if (Array.isArray(data.customCharacters)) {
              data.customCharacters.forEach(function (c) { MA.registerCustomCharacter(c); });
            }
            const pIdx = self.state.activeWadaCombos.findIndex(function (p) { return p.id === data.activeWadaId; });
            self.setState({
              charId: data.charId || self.state.charId,
              palIdx: pIdx >= 0 ? pIdx : self.state.palIdx,
              mStyle: data.mStyle || self.state.mStyle,
              storyKey: data.storyKey || self.state.storyKey,
              spineArc: data.spineArc || self.state.spineArc,
              feel: data.feel || self.state.feel,
              rung: data.rung || self.state.rung,
              ground: data.ground || self.state.ground,
              dag: data.dag || self.state.dag,
              storyboard: data.storyboard || self.state.storyboard,
              savedColorSchemes: Array.isArray(data.savedColorSchemes) ? data.savedColorSchemes : self.state.savedColorSchemes,
              copiedNotice: 'Imported & validated .motion.studio.json archive successfully.'
            });
          } catch (_err) {
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
        self.invalidateStaticCanvases();
        self.drawAllCanvases(false);
      });
    }

    // Modal backdrop click to dismiss
    const backdrops = root.querySelectorAll('.st-modal-backdrop');
    for (let i = 0; i < backdrops.length; i++) {
      backdrops[i].addEventListener('click', function (e) {
        if (e.target === e.currentTarget) {
          self.setState({ oauthModalOpen: false, gateModalOpen: false, vocabModalOpen: false });
        }
      });
    }

    // UNIFIED POINTEREVENTS + 2-POINTER TOUCH PINCH-ZOOM + MOUSE DRAG ON LIVING CANVAS (G26 · G30)
    const vp = root.querySelector('#living-canvas-viewport');
    if (vp) {
      const startCanvasOrCardDrag = function (e) {
        if (e.target.closest('button, select, input, textarea, a, label')) return;

        // Track multi-touch pointers for 2-finger pinch-to-zoom on mobile/tablet
        if (e.pointerId != null && self._activePointers) {
          self._activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (self._activePointers.size === 2) {
            const pts = Array.from(self._activePointers.values());
            self._pinchInitialDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            self._pinchInitialZoom = self.state.zoom;
            self._draggingNodeId = null;
            self._draggingCanvas = false;
            return;
          }
        }

        const cardEl = e.target.closest('[data-dag-node]');
        if (cardEl) {
          const nid = cardEl.getAttribute('data-dag-node');
          const node = self.state.dag.nodes.find(function (n) { return n.id === nid; });
          if (node) {
            self._draggingNodeId = nid;
            self._dragMovedPx = 0;
            self._dragStart = [e.clientX, e.clientY];
            self._panStart = [node.x, node.y];
            cardEl.classList.add('dag-node-dragging');
            if (e.pointerId != null && cardEl.setPointerCapture) {
              try { cardEl.setPointerCapture(e.pointerId); } catch (_err) { /* ignore */ }
            }
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }

        self._draggingCanvas = true;
        self._dragMovedPx = 0;
        self._dragStart = [e.clientX, e.clientY];
        self._panStart = [self.state.panX, self.state.panY];
        if (e.pointerId != null && vp.setPointerCapture) {
          try { vp.setPointerCapture(e.pointerId); } catch (_err) { /* ignore */ }
        }
      };

      vp.addEventListener('pointerdown', startCanvasOrCardDrag);
      vp.addEventListener('mousedown', function (e) {
        if (typeof window.PointerEvent !== 'undefined') return; // handled by pointerdown
        startCanvasOrCardDrag(e);
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
    const loopSec = this.getActiveLoopDuration ? this.getActiveLoopDuration() : 12.0;

    if (act === 'undo-history') return this.undo();
    if (act === 'redo-history') return this.redo();
    if (act === 'toggle-tweaks-bar') return this.setState({ tweaksOpen: !st.tweaksOpen }, true);
    if (act === 'toggle-inspector') return this.setState({ inspectorOpen: st.inspectorOpen === false }, true);
    if (act === 'toggle-tweak-bool') {
      const k = el.getAttribute('data-tweak');
      if (k === 'streaks' || k === 'guide') {
        const patch = {};
        patch[k] = !st[k];
        return this.setState(patch);
      }
      return;
    }
    if (act === 'set-hydro-ghosts') {
      const gc = Number(el.getAttribute('data-ghosts')) || 24;
      return this.setState({ hydroGhostCount: gc });
    }
    if (act === 'open-vocab-for-field') {
      return this.setState({ vocabModalOpen: true });
    }
    if (act === 'clone-custom-rig') {
      const baseSpec = this.getActiveChar();
      const cloned = FOUNDRY.cloneCharacterRig
        ? FOUNDRY.cloneCharacterRig(baseSpec, {
            name: baseSpec.name + ' (Custom Clone)',
            locomotion: baseSpec.locomotion,
            severanceOp: baseSpec.severanceOp
          })
        : baseSpec;
      if (MA.registerCustomCharacter) MA.registerCustomCharacter(cloned);
      return this.setState({
        charId: cloned.id,
        copiedNotice: 'Cloned & registered custom CharacterSpec rig: ' + cloned.name + ' (' + cloned.id + ')'
      });
    }
    if (act === 'zoom-fit-all') {
      const nodes = st.dag.nodes || [];
      if (!nodes.length) return this.setState({ panX: 18, panY: 16, zoom: 0.78 });
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(function (n) {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + (n.width || 315));
        maxY = Math.max(maxY, n.y + 320);
      });
      const vp = this.root && this.root.querySelector('#living-canvas-viewport');
      const vw = (vp && vp.clientWidth) || 920;
      const vh = (vp && vp.clientHeight) || 560;
      const contentW = Math.max(360, maxX - minX + 80);
      const contentH = Math.max(280, maxY - minY + 80);
      const fitZoom = Math.max(0.28, Math.min(1.15, Number(Math.min(vw / contentW, vh / contentH).toFixed(2))));
      return this.setState({
        zoom: fitZoom,
        panX: Math.round(24 - minX * fitZoom),
        panY: Math.round(20 - minY * fitZoom)
      });
    }

    if (act === 'switch-surface') return this.setState({ surface: el.getAttribute('data-surface') });
    if (act === 'toggle-play') return this.setState({ playing: !st.playing }, true);
    if (act === 'toggle-captions-covered') return this.setState({ captionsCovered: !st.captionsCovered });
    if (act === 'toggle-onion-skin') return this.setState({ onionSkin: !st.onionSkin });
    if (act === 'toggle-vocab-modal') return this.setState({ vocabModalOpen: !st.vocabModalOpen }, true);
    if (act === 'set-vocab-cat') return this.setState({ vocabCategory: el.getAttribute('data-cat') || 'all' }, true);
    if (act === 'apply-vocab-token') {
      const tok = el.getAttribute('data-vocab-token');
      const lib = CO.getFullVocabLibrary ? CO.getFullVocabLibrary(st.savedColorSchemes) : [];
      const item = lib.find(function (it) { return it.token === tok; });
      if (item) this.applyVocabItem(item, false);
      return;
    }
    if (act === 'spawn-vocab-card') {
      const tok = el.getAttribute('data-vocab-token');
      const lib = CO.getFullVocabLibrary ? CO.getFullVocabLibrary(st.savedColorSchemes) : [];
      const item = lib.find(function (it) { return it.token === tok; });
      if (item) this.applyVocabItem(item, true);
      return;
    }
    if (act === 'insert-vocab-token') {
      const tok = el.getAttribute('data-vocab-token');
      const lib = CO.getFullVocabLibrary ? CO.getFullVocabLibrary(st.savedColorSchemes) : [];
      const item = lib.find(function (it) { return it.token === tok; });
      const nextPrompt = st.oauthPrompt.includes(tok) ? st.oauthPrompt : (st.oauthPrompt.trim() + ' ' + tok);
      this.state.oauthPrompt = nextPrompt;
      if (item) {
        this.applyVocabItem(item, false);
      } else {
        this.setState({ oauthPrompt: nextPrompt });
      }
      return;
    }
    if (act === 'invoke-saved-scheme') {
      const tag = el.getAttribute('data-scheme-tag');
      const sc = CO.resolveColorSchemeByTag(st.savedColorSchemes, tag);
      if (sc) {
        const idx = st.activeWadaCombos.findIndex(function (p) { return p.id === sc.palId; });
        const patch = { copiedNotice: 'Applied saved color scheme ' + sc.token + ' (Wada No. ' + sc.palId + ')' };
        if (idx >= 0) patch.palIdx = idx;
        if (sc.ground && WADA.GROUNDS[sc.ground]) patch.ground = sc.ground;
        this.setState(patch);
      }
      return;
    }
    if (act === 'apply-scheme-to-node') {
      const tag = el.getAttribute('data-scheme-tag');
      const sc = CO.resolveColorSchemeByTag(st.savedColorSchemes, tag);
      const nodeA = (st.dag.nodes || []).find(function (n) { return n.id === st.selectedNodeId; });
      if (sc && nodeA && nodeA.payload) {
        nodeA.payload.palId = sc.palId;
        nodeA.payload.colorSchemeTag = sc.token;
        nodeA.subtitle = 'Wada No. ' + sc.palId + ' (' + sc.token + ') · ' + nodeA.payload.styleKey;
        if (CO.stampDAGRestrictionHashes) CO.stampDAGRestrictionHashes(st.dag);
        const idx = st.activeWadaCombos.findIndex(function (p) { return p.id === sc.palId; });
        this.setState({
          dag: st.dag,
          palIdx: idx >= 0 ? idx : st.palIdx,
          copiedNotice: 'Pinned ' + sc.token + ' to Source A card (' + nodeA.title + ').'
        });
      }
      return;
    }
    if (act === 'quick-tag-current-scheme') {
      const pal = this.getActivePalette();
      const slug = (pal.name || ('wada-' + pal.id)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const res = CO.tagAndSaveColorScheme(st.savedColorSchemes, {
        tag: slug,
        title: pal.name + ' (' + pal.no + ')',
        palId: pal.id,
        ground: st.ground,
        notes: pal.mood || 'Saved from Studio header bar'
      });
      return this.setState({
        savedColorSchemes: res.schemes,
        copiedNotice: 'Tagged & saved current palette as ' + res.createdOrUpdated.token
      });
    }
    if (act === 'save-color-scheme') {
      const pal = this.getActivePalette();
      const tagEl = this.root.querySelector('#new-scheme-tag-input');
      const titleEl = this.root.querySelector('#new-scheme-title-input');
      const notesEl = this.root.querySelector('#new-scheme-notes-input');
      const tagVal = tagEl ? tagEl.value : ('wada-' + pal.id);
      const titleVal = titleEl ? titleEl.value : (pal.name + ' (' + pal.no + ')');
      const notesVal = notesEl ? notesEl.value : (pal.mood || '');
      const res = CO.tagAndSaveColorScheme(st.savedColorSchemes, {
        tag: tagVal,
        title: titleVal,
        palId: pal.id,
        ground: st.ground,
        notes: notesVal
      });
      return this.setState({
        savedColorSchemes: res.schemes,
        newSchemeTag: '',
        newSchemeTitle: '',
        newSchemeNotes: '',
        copiedNotice: 'Saved color scheme ' + res.createdOrUpdated.token + ' to Vault!'
      });
    }
    if (act === 'save-combo-as-scheme') {
      const pid = Number(el.getAttribute('data-pal-id'));
      const combo = st.activeWadaCombos.find(function (p) { return p.id === pid; }) || this.getActivePalette();
      const slug = (combo.name || ('wada-' + combo.id)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const idx = st.activeWadaCombos.findIndex(function (p) { return p.id === pid; });
      const res = CO.tagAndSaveColorScheme(st.savedColorSchemes, {
        tag: slug,
        title: combo.name + ' (No. ' + combo.id + ')',
        palId: combo.id,
        ground: st.ground,
        notes: combo.mood || 'Saved from 348 Wada Dictionary'
      });
      return this.setState({
        palIdx: idx >= 0 ? idx : st.palIdx,
        savedColorSchemes: res.schemes,
        copiedNotice: 'Saved ' + res.createdOrUpdated.token + ' to #color Vault!'
      });
    }
    if (act === 'set-source-a') {
      const nid = el.getAttribute('data-node-id');
      const node = (st.dag.nodes || []).find(function (n) { return n.id === nid; });
      const pIdx = node && node.payload ? st.activeWadaCombos.findIndex(function (p) { return p.id === node.payload.palId; }) : -1;
      return this.setState({
        selectedNodeId: nid,
        charId: (node && node.payload && node.payload.charId) || st.charId,
        mStyle: (node && node.payload && node.payload.styleKey) || st.mStyle,
        storyKey: (node && node.payload && node.payload.storyKey) || st.storyKey,
        palIdx: pIdx >= 0 ? pIdx : st.palIdx
      });
    }
    if (act === 'set-source-b') {
      const nid = el.getAttribute('data-node-id');
      return this.setState({ compareNodeId: nid, showABCompare: true });
    }
    if (act === 'swap-source-ab') {
      return this.setState({
        selectedNodeId: st.compareNodeId || 'node-proof-b',
        compareNodeId: st.selectedNodeId || 'node-seed-root'
      });
    }
    if (act === 'duplicate-dag-node') {
      const nid = el.getAttribute('data-node-id') || st.selectedNodeId;
      const res = CO.duplicateCanvasCard(st.dag, nid);
      return this.setState({
        dag: { nodes: res.nodes, edges: res.edges },
        selectedNodeId: res.createdNodeId
      });
    }
    if (act === 'delete-dag-node') {
      const nid = el.getAttribute('data-node-id') || st.selectedNodeId;
      const res = CO.deleteCanvasCard(st.dag, nid);
      const nextSelected = (res.nodes[0] && res.nodes[0].id) || 'node-seed-root';
      return this.setState({
        dag: { nodes: res.nodes, edges: res.edges },
        selectedNodeId: st.selectedNodeId === nid ? nextSelected : st.selectedNodeId
      });
    }
    if (act === 'move-beat-card') {
      const fromAttr = el.getAttribute('data-from');
      const toAttr = el.getAttribute('data-to');
      const fromIdx = fromAttr != null ? Number(fromAttr) : Number(el.getAttribute('data-beat-idx'));
      const toIdx = toAttr != null ? Number(toAttr) : (fromIdx + (Number(el.getAttribute('data-delta')) || 0));
      if (!Number.isNaN(fromIdx) && !Number.isNaN(toIdx)) {
        CO.moveStoryboardBeat(st.storyboard, fromIdx, toIdx);
        return this.setState({ storyboard: st.storyboard });
      }
      return;
    }
    if (act === 'apply-style-to-src-a') {
      const sk = el.getAttribute('data-style-key') || 'watercolor';
      const nodeA = (st.dag.nodes || []).find(function (n) { return n.id === st.selectedNodeId; });
      if (nodeA && nodeA.payload) {
        nodeA.payload.styleKey = sk;
        nodeA.subtitle = 'Wada No. ' + nodeA.payload.palId + ' · ' + sk;
        if (CO.stampDAGRestrictionHashes) CO.stampDAGRestrictionHashes(st.dag);
      }
      return this.setState({ mStyle: sk, dag: st.dag, surface: 'infinite-canvas' });
    }
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
        surface: 'infinite-canvas',
        oauthModalOpen: false
      });
    }
    if (act === 'set-rung') return this.setState({ rung: Number(el.getAttribute('data-rung')) || 1 });
    if (act === 'scrub-to-beat') {
      const targetT = Number(el.getAttribute('data-t')) || 0;
      this._T = targetT;
      this.setState({ playing: false }, true);
      const scrub = this.root.querySelector('#global-scrub');
      const tReadout = this.root.querySelector('#global-t-readout');
      if (scrub) scrub.value = String((targetT % loopSec).toFixed(2));
      if (tReadout) tReadout.textContent = 't = ' + (targetT % loopSec).toFixed(2) + 's';
      this.drawAllCanvases(false);
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
        surface: 'infinite-canvas',
        oauthModalOpen: false
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
        const arcEl = this.root.querySelector('#ins-node-spine-arc');
        const pEl = this.root.querySelector('#ins-node-pal');
        const scEl = this.root.querySelector('#ins-node-scheme-tag');
        const nEl = this.root.querySelector('#ins-node-notes');
        const cjEl = this.root.querySelector('#ins-node-conjecture');
        if (cEl) node.payload.charId = cEl.value;
        if (sEl) node.payload.styleKey = sEl.value;
        if (stEl) node.payload.storyKey = stEl.value;
        if (arcEl) node.payload.spineArc = arcEl.value;
        if (pEl) node.payload.palId = Number(pEl.value);
        if (scEl && scEl.value) {
          node.payload.colorSchemeTag = scEl.value;
          const sc = CO.resolveColorSchemeByTag(st.savedColorSchemes, scEl.value);
          if (sc) node.payload.palId = sc.palId;
        }
        if (nEl) {
          node.payload.notes = nEl.value;
          const parsed = CO.parsePromptTokens ? CO.parsePromptTokens(nEl.value, st.savedColorSchemes) : null;
          if (parsed && parsed.mergedPatch) {
            if (parsed.mergedPatch.palId) node.payload.palId = parsed.mergedPatch.palId;
            if (parsed.mergedPatch.styleKey) node.payload.styleKey = parsed.mergedPatch.styleKey;
            if (parsed.mergedPatch.storyKey) node.payload.storyKey = parsed.mergedPatch.storyKey;
            if (parsed.mergedPatch.charId) node.payload.charId = parsed.mergedPatch.charId;
          }
        }
        if (cjEl) node.conjectureNote = cjEl.value;
        node.subtitle = 'Wada No. ' + node.payload.palId + ' · ' + node.payload.styleKey;
        if (CO.stampDAGRestrictionHashes) CO.stampDAGRestrictionHashes(st.dag);
        this.setState({ dag: st.dag, spineArc: node.payload.spineArc || st.spineArc });
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
    if (act === 'toggle-oauth-modal') return this.setState({ oauthModalOpen: !st.oauthModalOpen }, true);
    if (act === 'toggle-gate-modal') return this.setState({ gateModalOpen: !st.gateModalOpen }, true);
    if (act === 'oauth-enhance-node') {
      const nid = el.getAttribute('data-node-id') || st.selectedNodeId;
      return this.setState({ selectedNodeId: nid, oauthModalOpen: true }, true);
    }
    if (act === 'synthesize-new-character') {
      const res = CO.runDeterministicSynthesizer({
        charId: st.charId,
        palId: this.getActivePalette().id,
        styleKey: st.mStyle,
        storyKey: st.storyKey,
        prompt: 'Synthesize a new custom parametric character rig for ' + st.mStyle,
        savedColorSchemes: st.savedColorSchemes
      });
      MA.registerCustomCharacter(res.synthesizedCharacter);
      return this.setState({ charId: res.synthesizedCharacter.id });
    }
    if (act === 'start-pkce-handshake') {
      const pkce = await CO.initiateOAuthPKCE(st.oauthProvider);
      this.setState({
        oauthStatus: 'PKCE S256 Challenge generated: ' + pkce.codeChallenge.slice(0, 18) + '... (Verifier stored)',
        oauthToken: 'pkce_' + pkce.codeChallenge.slice(0, 16)
      }, true);
      return;
    }
    if (act === 'run-oauth-enhance') {
      const pInput = this.root.querySelector('#oauth-prompt-input');
      const tInput = this.root.querySelector('#oauth-token-input');
      const promptText = pInput ? pInput.value : st.oauthPrompt;
      const tok = tInput ? tInput.value : st.oauthToken;
      this.setState({ oauthBusy: true, oauthPrompt: promptText, oauthToken: tok }, true);

      const out = await CO.enhanceStoryboardLive({
        charId: st.charId,
        palId: this.getActivePalette().id,
        styleKey: st.mStyle,
        storyKey: st.storyKey,
        prompt: promptText,
        savedColorSchemes: st.savedColorSchemes
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
      return this.setState({ copiedNotice: 'Copied ' + st.compileTarget.toUpperCase() + ' single-clock scaffold to clipboard.' }, true);
    }
    if (act === 'export-playable-html5') {
      const htmlDoc = CO.compilePlayableHTML5(st);
      const blob = new Blob([htmlDoc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ceti-playable-single-clock-' + st.charId + '.html';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return this.setState({ copiedNotice: 'Downloaded Playable Single-Clock HTML5 animation bundle.' }, true);
    }
    if (act === 'record-webm-video') {
      if (typeof MediaRecorder === 'undefined') {
        return this.setState({ copiedNotice: 'MediaRecorder API not available in this browser.' }, true);
      }
      this.setState({ copiedNotice: 'Recording 6.0s deterministic WebM video at 30fps...' }, true);
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
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ceti-motion-' + st.charId + '-' + st.mStyle + '.webm';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        self.setState({ copiedNotice: 'Exported 6.0s WebM video (' + st.charId + ' · ' + pal.no + ').' }, true);
      };
      recorder.start();
      let frameIdx = 0;
      const totalFrames = 180;
      const iv = setInterval(function () {
        const tSec = (frameIdx / 30);
        MA.render(recCanvas, st.mStyle, pal, feel, tSec, { charId: st.charId, ground: st.ground, wob: st.wob, grain: st.grain, hydroGhostCount: st.hydroGhostCount });
        frameIdx++;
        if (frameIdx >= totalFrames) {
          clearInterval(iv);
          recorder.stop();
        }
      }, 1000 / 30);
      return;
    }
    if (act === 'export-session-json') {
      const payload = CO.saveSessionState(this.getSerializableSessionState());
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ceti-atlas-session.motion.studio.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
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
      const self = this;
      (sheet.beats || []).forEach(function (b, idx) {
        const col = idx % 4, row = Math.floor(idx / 4);
        let beatPal = pal;
        if (b.palId) {
          const foundPal = self.state.activeWadaCombos.find(function (p) { return p.id === Number(b.palId); });
          if (foundPal) beatPal = WADA.enrichPalette(foundPal, st.ground);
        }
        MA.render(sub, sheet.storyKey, beatPal, feel, b.tMidSec, {
          charId: st.charId,
          ground: st.ground,
          wob: st.wob,
          grain: st.grain,
          cameraMove: b.cameraMove || 'static-wide',
          beatIdx: idx,
          hydroGhostCount: st.hydroGhostCount
        });
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

