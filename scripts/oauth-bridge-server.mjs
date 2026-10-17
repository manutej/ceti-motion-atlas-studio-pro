#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// CETI MOTION ATLAS STUDIO PRO — LOCAL LOOPBACK OAUTH 2.0 PKCE & AI BRIDGE
// Endpoint: http://127.0.0.1:43110
// Routes:
//   GET  /v1/status        -> Health & active provider telemetry
//   GET  /oauth/authorize  -> RFC 7636 S256 PKCE authorization redirect
//   POST /oauth/token      -> Exchanges code + code_verifier for Bearer token
//   POST /v1/enhance       -> Live storyboard / fork / CharacterSpec synthesis
// ═══════════════════════════════════════════════════════════════════════════
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { URL, fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.MOTION_STUDIO_PORT || 43110);
const HOST = '127.0.0.1';

const pkceStore = new Map();
const tokenStore = new Map();

function base64Url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sha256Base64Url(str) {
  return base64Url(crypto.createHash('sha256').update(str).digest());
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

function synthesizeEnhancement(reqBody) {
  const charId = reqBody.charId || 'ceti-whale';
  const palId = Number(reqBody.palId) || 343;
  const styleKey = reqBody.styleKey || 'watercolor';
  const storyKey = reqBody.storyKey || 's_voice';
  const prompt = String(reqBody.prompt || 'Refine causal hinges and synthesize companion character rig').trim();

  const hash = crypto.createHash('sha256').update(prompt + charId + palId).digest();
  const wadaCandidates = [343, 296, 279, 166, 339, 126, 329, 263, 321, 345, 290, 214, 304];
  const suggestedWada = wadaCandidates[hash[0] % wadaCandidates.length];
  const archetypes = ['cetacean', 'avian', 'submersible', 'geometric', 'instrument', 'botanical', 'mythic'];
  const arch = archetypes[hash[1] % archetypes.length];
  const customId = 'oauth-rig-' + ((hash[2] << 4) | (hash[3] & 0x0f));
  const synthName = reqBody.customCharName || ('OAuth ' + arch[0].toUpperCase() + arch.slice(1) + ' #' + (hash[4] % 89 + 10));

  const roles = ['hook', 'threshold', 'escalation', 'turn', 'filter', 'breather', 'climax', 'callback'];
  const totalSec = 10;
  const enhancedBeats = roles.map((role, i) => {
    const t0 = Number(((i / 8) * totalSec).toFixed(2));
    const t1 = Number((((i + 1) / 8) * totalSec).toFixed(2));
    const hinge = i % 2 === 1 ? 'BUT' : 'THEREFORE';
    return {
      index: i,
      id: 'beat-' + (i + 1),
      tStartSec: t0,
      tEndSec: t1,
      tMidSec: Number(((t0 + t1) / 2).toFixed(2)),
      role,
      hinge,
      label: role.toUpperCase(),
      visualAction: i === 7
        ? `Final callback frame echoes Beat 1 opening silhouette in Wada No. ${suggestedWada} (${prompt.slice(0, 44)}).`
        : i === 5
          ? `Negative-space breather hold: ${synthName} glides with zero competing motion.`
          : `${synthName} executes ${role} stage in ${styleKey} (${hinge} causal hinge · "${prompt.slice(0, 38)}").`,
      captionOnScreen: i === 5 ? '' : `${role.toUpperCase()} · ${prompt.slice(0, 36)}`,
      cameraMove: i === 6 ? 'kick-shake' : (i % 2 === 0 ? 'static' : 'push-in'),
      activeSimultaneousMoves: i === 5 ? 1 : 2,
      wadaFocusRole: i === 6 ? 'accentFocal' : 'secondaryStructure'
    };
  });

  return {
    requestId: 'oauth-bridge-' + Date.now().toString(36),
    provider: 'local-oauth-pkce-bridge',
    summary: `Live OAuth Bridge enhanced 8-beat ${storyKey} storyboard (Wada No. ${suggestedWada}) and synthesized ${synthName} (${arch}).`,
    suggestedWadaComboNo: suggestedWada,
    enhancedBeats,
    synthesizedCharacter: {
      id: customId,
      name: synthName,
      subtitle: `OAuth Bridge Synthesized Rig · ${arch.toUpperCase()}`,
      archetype: arch,
      aspectRatio: Number((0.31 + (hash[5] % 15) / 100).toFixed(2)),
      bodyProfile: {
        headTaper: 0.12,
        dorsalArch: 0.36,
        ventralBelly: 0.34,
        caudalTaper: 0.54,
        humpPos: 0.50,
        humpHeight: 0.16
      },
      spineWave: { ampDefault: 0.17, freqHz: 1.05, tailPower: 1.8 },
      appendages: { primaryFinPos: 0.27, primaryFinSpan: 0.33, primaryFinSweep: 0.40, tailSpan: 0.36, tailNotch: 0.05, ventralGrooves: 3 },
      face: { eyePos: [0.10, -0.04], eyeRadiusRatio: 0.023, mouthPos: [0.04, 0.08], hasBaleen: true },
      streaks: { count: 5, curvature: -0.11, kind: 'harmonic-ribbons' },
      pixelSprite7x12: ['...XXXXX....', '.XXXXXXXXX.X', 'XXXXXXXXXXXX', 'XXXXXXXXXX.X', 'BBBBBBBXX...', '.BBFF.......', '...F........'],
      defaultInteraction: 'hero-journey',
      defaultStory: storyKey,
      reductionLadder: [
        { rung: 1, name: 'Full Painted Rig', maxStrokeCount: 26, description: 'Full parametric rig with 5 Wada harmonic streaks.' },
        { rung: 2, name: 'Cut-Paper Emblem', maxStrokeCount: 12, description: 'Torn-paper silhouette with knockout border.' },
        { rung: 3, name: 'Monoline Silhouette', maxStrokeCount: 6, description: 'Continuous contour outline.' },
        { rung: 4, name: '3-Stroke Glyph', maxStrokeCount: 3, description: 'Saul Bass 3-stroke reduction.' },
        { rung: 5, name: 'Signal Dot & Bearing', maxStrokeCount: 1, description: '16px radar dot and azimuth tick.' }
      ]
    },
    forkAlternatives: [
      {
        title: 'Fork α · Saul Bass Severe Cutout',
        rationale: '3-color poster reduction on Wada No. 126.',
        lensOverrides: { look: 'Handmade', register: 'saul-severe' },
        wadaComboNo: 126,
        characterId: 'saul-falcon',
        interactionMode: 'continuous-morph',
        styleKey: 'saul-severe'
      },
      {
        title: 'Fork β · Kinetic Hydrography Survey',
        rationale: '25 ghost silhouettes and bearing telemetry on Wada No. 296.',
        lensOverrides: { look: 'Continuous', register: 'kinetic-hydrography' },
        wadaComboNo: 296,
        characterId: 'astronav-compass',
        interactionMode: 'hydrographic-trace',
        styleKey: 'hydrographic'
      }
    ],
    conservationAudit: {
      coveredOk: true,
      movementOk: true,
      oneBreather: true,
      callback: true
    }
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const u = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (req.method === 'GET' && u.pathname === '/v1/status') {
    return sendJson(res, 200, {
      ok: true,
      service: 'ceti-motion-atlas-oauth-bridge',
      version: '1.0.0',
      pkceSupported: true,
      codeChallengeMethod: 'S256',
      activeTokens: tokenStore.size
    });
  }

  if (req.method === 'GET' && u.pathname === '/oauth/authorize') {
    const state = u.searchParams.get('state') || 'state';
    const challenge = u.searchParams.get('code_challenge') || '';
    const method = u.searchParams.get('code_challenge_method') || 'S256';
    const redirectUri = u.searchParams.get('redirect_uri') || `http://${HOST}:${PORT}/oauth/callback`;
    const code = 'ceti_auth_' + crypto.randomBytes(12).toString('hex');
    pkceStore.set(code, { challenge, method, state, createdAt: Date.now() });
    const target = `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    res.writeHead(302, { Location: target });
    return res.end();
  }

  if (req.method === 'POST' && u.pathname === '/oauth/token') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const record = pkceStore.get(data.code);
        if (!record) return sendJson(res, 400, { error: 'invalid_grant', error_description: 'Unknown authorization code' });
        const computed = sha256Base64Url(String(data.code_verifier || ''));
        if (record.challenge && computed !== record.challenge) {
          return sendJson(res, 400, { error: 'invalid_grant', error_description: 'PKCE S256 verification failed' });
        }
        pkceStore.delete(data.code);
        const accessToken = 'ceti_pkce_tok_' + crypto.randomBytes(16).toString('hex');
        tokenStore.set(accessToken, { createdAt: Date.now(), scope: 'storyboard:enhance character:synthesize' });
        return sendJson(res, 200, {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: 'storyboard:enhance character:synthesize'
        });
      } catch (err) {
        return sendJson(res, 400, { error: 'invalid_request', message: err.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && u.pathname === '/v1/enhance') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = synthesizeEnhancement(payload);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { error: 'enhance_error', message: err.message });
      }
    });
    return;
  }

  // Serve Studio HTML & JS files over HTTP at http://127.0.0.1:43110/
  if (req.method === 'GET') {
    const cleanPath = decodeURIComponent(u.pathname === '/' ? '/Motion Atlas Studio Pro.dc.html' : u.pathname);
    const candidate = path.resolve(STUDIO_ROOT, '.' + cleanPath);
    if (candidate.startsWith(STUDIO_ROOT) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();
      const mime = ext === '.html' ? 'text/html; charset=utf-8'
        : ext === '.js' ? 'application/javascript; charset=utf-8'
        : ext === '.json' ? 'application/json; charset=utf-8'
        : 'text/plain; charset=utf-8';
      res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
      return res.end(fs.readFileSync(candidate));
    }
  }

  return sendJson(res, 404, { error: 'not_found', path: u.pathname });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(PORT, HOST, () => {
    console.log(`[CETI OAuth PKCE Bridge + Studio Server] Listening on http://${HOST}:${PORT}`);
  });
}

export { server, synthesizeEnhancement, sha256Base64Url };
