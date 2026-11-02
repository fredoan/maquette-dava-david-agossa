// ============================================================
// ENGAGEMENT.JS — v3 — Vues + Likes + Partages + Commentaires
// ============================================================
import { db } from './firebase-config.js';
import {
  doc, setDoc, onSnapshot, collection, addDoc, query, orderBy,
  serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ---------- CSS (inchangé) ---------- */
if (!document.getElementById('engagement-style')) {
  const style = document.createElement('style');
  style.id = 'engagement-style';
  style.textContent = `
    .eng-box { margin: 2rem 0; padding: 1.6rem; background: linear-gradient(180deg, rgba(86,10,10,.4), rgba(26,0,0,.7)); border: 1px solid rgba(212,175,90,.24); border-radius: 8px; font-family: 'Lato', system-ui, sans-serif; color: #e6dccb; }
    .eng-stats { display: flex; flex-wrap: wrap; gap: 1.4rem; margin-bottom: 1.2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #b8a691; }
    .eng-stats span { display: inline-flex; align-items: center; gap: 0.4rem; }
    .eng-stats b { color: #d4af5a; font-weight: 700; }
    .eng-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.7rem; margin-bottom: 1.6rem; padding-bottom: 1.4rem; border-bottom: 1px solid rgba(212,175,90,.18); }
    .eng-btn-like { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 4px; font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(212,175,90,.3); background: rgba(26,0,0,.5); color: #e6dccb; }
    .eng-btn-like:hover { border-color: #d4af5a; color: #d4af5a; background: rgba(212,175,90,.08); }
    .eng-btn-like.liked { background: #d4af5a; color: #1a0000; border-color: #d4af5a; }
    .eng-btn-like.liked .ico { animation: engHeart 0.4s ease; }
    @keyframes engHeart { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }
    .eng-share-group { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-left: auto; }
    .eng-share-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.45rem 0.85rem; border-radius: 3px; font-size: 0.68rem; font-weight: 700; text-decoration: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; border: none; }
    .eng-share-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.35); }
    .eng-share-wa { background: #25D366; color: #fff; }
    .eng-share-fb { background: #1877F2; color: #fff; }
    .eng-share-tw { background: #000; color: #fff; }
    .eng-share-tk { background: #000; color: #fff; border: 1px solid #fe2c55; }
    .eng-share-cp { background: #d4af5a; color: #1a0000; }
    .eng-comments { margin-top: 0.4rem; }
    .eng-comments h4 { font-family: 'Cinzel', serif; color: #d4af5a; font-size: 1rem; margin-bottom: 1rem; letter-spacing: 0.04em; }
    .eng-form { display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1.6rem; padding: 1.1rem; background: rgba(26,0,0,.6); border: 1px solid rgba(212,175,90,.15); border-radius: 6px; }
    .eng-form input, .eng-form textarea { width: 100%; padding: 0.75rem 0.9rem; background: rgba(26,0,0,.8); border: 1px solid rgba(212,175,90,.2); border-radius: 4px; color: #f7f2e9; font-family: 'Lato', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.3s; }
    .eng-form input:focus, .eng-form textarea:focus { border-color: #d4af5a; }
    .eng-form textarea { min-height: 80px; resize: vertical; }
    .eng-form button { align-self: flex-start; padding: 0.65rem 1.5rem; background: #d4af5a; color: #1a0000; border: none; border-radius: 4px; font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; }
    .eng-form button:hover:not(:disabled) { background: #e8c869; transform: translateY(-1px); }
    .eng-form button:disabled { opacity: 0.5; cursor: not-allowed; }
    .eng-list { display: flex; flex-direction: column; gap: 0.7rem; }
    .eng-empty { text-align: center; padding: 1.5rem; color: #b8a691; font-size: 0.85rem; font-style: italic; border: 1px dashed rgba(212,175,90,.15); border-radius: 6px; }
    .eng-comment { padding: 0.9rem 1rem; background: rgba(86,10,10,.3); border: 1px solid rgba(212,175,90,.12); border-radius: 4px; }
    .eng-comment-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem; font-size: 0.82rem; }
    .eng-comment-head b { color: #d4af5a; font-family: 'Cinzel', serif; }
    .eng-comment-head span { color: #7a7060; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; }
    .eng-comment-body { color: #e6dccb; font-size: 0.9rem; line-height: 1.55; }
    @media (max-width: 640px) { .eng-actions { flex-direction: column; align-items: stretch; } .eng-share-group { margin-left: 0; justify-content: flex-start; } }
  `;
  document.head.appendChild(style);
}

/* ---------- Helpers ---------- */
function formatNum(n) {
  n = parseInt(n, 10) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}
function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + ' h';
  if (s < 2592000) return Math.floor(s / 86400) + ' j';
  return d.toLocaleDateString('fr-FR');
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- Ref Firestore ---------- */
const engagementRef = (type, id) => doc(db, 'engagements', type + '_' + id);

/* ---------- Erreur visible (toast console + page) ---------- */
function reportError(label, err) {
  console.error('[Engagement] ❌', label, err);
  if (err && err.code === 'permission-denied') {
    console.error(
      '%c⚠️ RÈGLES FIRESTORE BLOQUENT LES ÉCRITURES',
      'background:#7f1d1d;color:#fff;padding:6px 12px;border-radius:4px;font-weight:bold',
      '\nVérifiez que les règles sont bien PUBLIÉES sur Firebase Console.',
      '\nMenu → Firestore Database → Règles → Publier'
    );
  }
}

/* ---------- VUES ---------- */
async function incrementView(type, id) {
  if (!type || !id) return;
  const key = 'eng_v_' + type + '_' + id;
  // On garde sessionStorage pour éviter de compter en boucle sur rechargement.
  // Si tu veux compter CHAQUE chargement, change 'sessionStorage' par 'null' ici :
  if (sessionStorage.getItem(key)) return;
  try {
    await setDoc(engagementRef(type, id), {
      type, itemId: id,
      vues: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
    sessionStorage.setItem(key, '1');
    console.log('[Engagement] ✅ vue incrémentée (' + type + '_' + id + ')');
  } catch (e) {
    reportError('incrementView(' + type + ',' + id + ')', e);
  }
}

/* ---------- LIKES ---------- */
async function toggleLike(type, id) {
  const key = 'eng_l_' + type + '_' + id;
  const alreadyLiked = localStorage.getItem(key) === '1';
  try {
    await setDoc(engagementRef(type, id), {
      type, itemId: id,
      likes: increment(alreadyLiked ? -1 : 1),
      updatedAt: serverTimestamp()
    }, { merge: true });
    if (alreadyLiked) localStorage.removeItem(key);
    else localStorage.setItem(key, '1');
    console.log('[Engagement] ✅ like ' + (alreadyLiked ? 'retiré' : 'ajouté') + ' (' + type + '_' + id + ')');
    return !alreadyLiked;
  } catch (e) {
    reportError('toggleLike(' + type + ',' + id + ')', e);
    return alreadyLiked;
  }
}

/* ---------- PARTAGES (nouveau) ---------- */
async function incrementShare(type, id) {
  if (!type || !id) return;
  try {
    await setDoc(engagementRef(type, id), {
      type, itemId: id,
      partages: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('[Engagement] ✅ partage incrémenté (' + type + '_' + id + ')');
  } catch (e) {
    reportError('incrementShare(' + type + ',' + id + ')', e);
  }
}

/* ---------- COMMENTAIRES ---------- */
async function addComment(type, id, auteur, texte) {
  auteur = (auteur || 'Anonyme').trim().slice(0, 80);
  texte = (texte || '').trim().slice(0, 2000);
  if (!texte) throw new Error('Commentaire vide');
  try {
    await addDoc(collection(db, 'engagements', type + '_' + id, 'commentaires'), {
      auteur, texte,
      date: serverTimestamp()
    });
    await setDoc(engagementRef(type, id), {
      nbCommentaires: increment(1)
    }, { merge: true });
    console.log('[Engagement] ✅ commentaire ajouté');
  } catch (e) {
    reportError('addComment(' + type + ',' + id + ')', e);
    throw e;
  }
}

/* ---------- LISTEN ---------- */
function listen(type, id, callback) {
  if (!type || !id) { console.warn('[Engagement] listen: type et id requis'); return () => {}; }
  return onSnapshot(
    engagementRef(type, id),
    (snap) => {
      const d = snap.exists() ? snap.data() : { vues: 0, likes: 0, partages: 0, nbCommentaires: 0 };
      try { callback(d); } catch (e) { reportError('listen callback', e); }
    },
    (e) => reportError('listen(' + type + ',' + id + ')', e)
  );
}

/* ---------- SHARE URLs ---------- */
function shareUrls(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title || 'Dava David Agossa');
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    twitter:  `https://twitter.com/intent/tweet?text=${t}&url=${u}`
  };
}

/* ---------- RENDU ---------- */
async function render(containerId, type, id, url, title) {
  const container = document.getElementById(containerId);
  if (!container) { console.warn('[Engagement] Conteneur introuvable :', containerId); return; }

  container.innerHTML = `
    <div class="eng-box">
      <div class="eng-stats">
        <span>👁️ <b class="eng-vues">0</b> vues</span>
        <span>❤️ <b class="eng-likes">0</b> likes</span>
        <span>🔗 <b class="eng-partages">0</b> partages</span>
        <span>💬 <b class="eng-nbcom">0</b> commentaires</span>
      </div>
      <div class="eng-actions">
        <button class="eng-btn-like" type="button"><span class="ico">🤍</span><span class="lbl">J'aime</span></button>
        <div class="eng-share-group">
          <a class="eng-share-btn eng-share-wa" target="_blank" rel="noopener" data-share="wa">📱 WhatsApp</a>
          <a class="eng-share-btn eng-share-fb" target="_blank" rel="noopener" data-share="fb">📘 Facebook</a>
          <a class="eng-share-btn eng-share-tw" target="_blank" rel="noopener" data-share="tw">🐦 X</a>
          <button class="eng-share-btn eng-share-tk" type="button" data-share="tk">🎵 TikTok</button>
          <button class="eng-share-btn eng-share-cp" type="button" data-share="cp">🔗 Copier</button>
        </div>
      </div>
      <div class="eng-comments">
        <h4>💬 Laisser un commentaire</h4>
        <form class="eng-form">
          <input type="text" class="eng-author" placeholder="Votre nom (optionnel)" maxlength="80" />
          <textarea class="eng-text" placeholder="Votre commentaire…" required maxlength="2000"></textarea>
          <button type="submit" class="eng-submit">Publier</button>
        </form>
        <div class="eng-list"><div class="eng-empty">Soyez le premier à commenter.</div></div>
      </div>
    </div>`;

  // Comptage de vue (1x par session)
  incrementView(type, id);

  // Écoute temps réel
  onSnapshot(engagementRef(type, id), (snap) => {
    const d = snap.exists() ? snap.data() : { vues: 0, likes: 0, partages: 0, nbCommentaires: 0 };
    const set = (sel, val) => { const el = container.querySelector(sel); if (el) el.textContent = formatNum(val); };
    set('.eng-vues', d.vues || 0);
    set('.eng-likes', d.likes || 0);
    set('.eng-partages', d.partages || 0);
    set('.eng-nbcom', d.nbCommentaires || 0);
  }, (e) => reportError('render snapshot', e));

  // Bouton Like
  const btnLike = container.querySelector('.eng-btn-like');
  const icoEl = btnLike.querySelector('.ico');
  const lblEl = btnLike.querySelector('.lbl');
  const isLiked = localStorage.getItem('eng_l_' + type + '_' + id) === '1';
  const setLikeUI = (liked) => {
    btnLike.classList.toggle('liked', liked);
    icoEl.textContent = liked ? '❤️' : '🤍';
    lblEl.textContent = liked ? 'Aimé' : "J'aime";
  };
  setLikeUI(isLiked);

  btnLike.addEventListener('click', async () => {
    btnLike.disabled = true;
    const newState = await toggleLike(type, id);
    setLikeUI(newState);
    btnLike.disabled = false;
  });

  // Partage URLs
  const urls = shareUrls(url, title);
  const waBtn = container.querySelector('[data-share="wa"]');
  const fbBtn = container.querySelector('[data-share="fb"]');
  const twBtn = container.querySelector('[data-share="tw"]');
  if (waBtn) waBtn.href = urls.whatsapp;
  if (fbBtn) fbBtn.href = urls.facebook;
  if (twBtn) twBtn.href = urls.twitter;

  // ⭐ Comptage partages : clique sur WhatsApp/Facebook/X
  if (waBtn) waBtn.addEventListener('click', () => incrementShare(type, id));
  if (fbBtn) fbBtn.addEventListener('click', () => incrementShare(type, id));
  if (twBtn) twBtn.addEventListener('click', () => incrementShare(type, id));

  // TikTok → copier le lien + incrémenter
  const tkBtn = container.querySelector('[data-share="tk"]');
  tkBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      await incrementShare(type, id);
      const old = tkBtn.textContent;
      tkBtn.textContent = '✅ Lien copié';
      setTimeout(() => { tkBtn.textContent = old; }, 2000);
    } catch (e) {
      reportError('partage TikTok', e);
      alert('Lien : ' + url);
    }
  });

  // Copier → incrémenter
  const cpBtn = container.querySelector('[data-share="cp"]');
  cpBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      await incrementShare(type, id);
      const old = cpBtn.textContent;
      cpBtn.textContent = '✅ Copié !';
      setTimeout(() => { cpBtn.textContent = old; }, 2000);
    } catch (e) {
      reportError('copier', e);
      alert('Lien : ' + url);
    }
  });

  // Formulaire commentaire
  const form = container.querySelector('.eng-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = container.querySelector('.eng-author').value;
    const text = container.querySelector('.eng-text').value;
    if (!text.trim()) return;
    const submitBtn = container.querySelector('.eng-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';
    try {
      await addComment(type, id, author, text);
      form.reset();
      submitBtn.textContent = '✅ Publié';
      setTimeout(() => { submitBtn.textContent = 'Publier'; }, 1500);
    } catch (err) {
      submitBtn.textContent = '❌ Erreur (voir console)';
      setTimeout(() => { submitBtn.textContent = 'Publier'; }, 2500);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Liste commentaires temps réel
  const listEl = container.querySelector('.eng-list');
  const q = query(
    collection(db, 'engagements', type + '_' + id, 'commentaires'),
    orderBy('date', 'desc')
  );
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      listEl.innerHTML = '<div class="eng-empty">Soyez le premier à commenter.</div>';
      return;
    }
    listEl.innerHTML = snap.docs.map(d => {
      const c = d.data();
      return `
        <div class="eng-comment">
          <div class="eng-comment-head">
            <b>${escapeHtml(c.auteur)}</b>
            <span>${timeAgo(c.date)}</span>
          </div>
          <div class="eng-comment-body">${escapeHtml(c.texte).replace(/\n/g, '<br>')}</div>
        </div>`;
    }).join('');
  }, (e) => reportError('listen comments', e));
}

/* ---------- EXPORT ---------- */
export const Engagement = {
  render, listen, incrementView, toggleLike, incrementShare, addComment, formatNum, timeAgo
};

console.log('✅ engagement.js v3 chargé (avec partages)');
