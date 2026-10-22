// ============================================================
// ENGAGEMENT.JS — Likes + Vues + Commentaires + Partage
// Réutilisable sur toutes les pages (article, vidéo, photo, etc.)
// Design intégré : rouge #3d0000 + or #d4af5a
// ============================================================

import { db } from './firebase-config.js';
import {
  doc, setDoc, onSnapshot, collection, addDoc, query, orderBy,
  serverTimestamp, increment, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   INJECTION DU CSS — une seule fois par page
   ============================================================ */
if (!document.getElementById('engagement-style')) {
  const style = document.createElement('style');
  style.id = 'engagement-style';
  style.textContent = `
    .eng-box {
      margin: 2rem 0;
      padding: 1.6rem;
      background: linear-gradient(180deg, rgba(86,10,10,.4), rgba(26,0,0,.7));
      border: 1px solid rgba(212,175,90,.24);
      border-radius: 8px;
      font-family: 'Lato', system-ui, sans-serif;
      color: #e6dccb;
    }
    .eng-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1.4rem;
      margin-bottom: 1.2rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: #b8a691;
    }
    .eng-stats span { display: inline-flex; align-items: center; gap: 0.4rem; }
    .eng-stats b { color: #d4af5a; font-weight: 700; }

    .eng-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.7rem;
      margin-bottom: 1.6rem;
      padding-bottom: 1.4rem;
      border-bottom: 1px solid rgba(212,175,90,.18);
    }

    .eng-btn-like {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      border-radius: 4px;
      font-family: 'Cinzel', serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.3s;
      border: 1px solid rgba(212,175,90,.3);
      background: rgba(26,0,0,.5);
      color: #e6dccb;
    }
    .eng-btn-like:hover { border-color: #d4af5a; color: #d4af5a; background: rgba(212,175,90,.08); }
    .eng-btn-like.liked { background: #d4af5a; color: #1a0000; border-color: #d4af5a; }
    .eng-btn-like.liked .ico { animation: engHeart 0.4s ease; }
    @keyframes engHeart { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }

    .eng-share-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-left: auto;
    }
    .eng-share-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.45rem 0.85rem;
      border-radius: 3px;
      font-size: 0.68rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: none;
    }
    .eng-share-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.35); }
    .eng-share-wa { background: #25D366; color: #fff; }
    .eng-share-fb { background: #1877F2; color: #fff; }
    .eng-share-tw { background: #000; color: #fff; }
    .eng-share-tk { background: #000; color: #fff; border: 1px solid #fe2c55; }
    .eng-share-cp { background: #d4af5a; color: #1a0000; }

    .eng-comments { margin-top: 0.4rem; }
    .eng-comments h4 {
      font-family: 'Cinzel', serif;
      color: #d4af5a;
      font-size: 1rem;
      margin-bottom: 1rem;
      letter-spacing: 0.04em;
    }
    .eng-form {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      margin-bottom: 1.6rem;
      padding: 1.1rem;
      background: rgba(26,0,0,.6);
      border: 1px solid rgba(212,175,90,.15);
      border-radius: 6px;
    }
    .eng-form input, .eng-form textarea {
      width: 100%;
      padding: 0.75rem 0.9rem;
      background: rgba(26,0,0,.8);
      border: 1px solid rgba(212,175,90,.2);
      border-radius: 4px;
      color: #f7f2e9;
      font-family: 'Lato', sans-serif;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.3s;
    }
    .eng-form input:focus, .eng-form textarea:focus { border-color: #d4af5a; }
    .eng-form textarea { min-height: 80px; resize: vertical; }
    .eng-form button {
      align-self: flex-start;
      padding: 0.65rem 1.5rem;
      background: #d4af5a;
      color: #1a0000;
      border: none;
      border-radius: 4px;
      font-family: 'Cinzel', serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.3s;
    }
    .eng-form button:hover:not(:disabled) { background: #e8c869; transform: translateY(-1px); }
    .eng-form button:disabled { opacity: 0.5; cursor: not-allowed; }

    .eng-list { display: flex; flex-direction: column; gap: 0.7rem; }
    .eng-empty {
      text-align: center;
      padding: 1.5rem;
      color: #b8a691;
      font-size: 0.85rem;
      font-style: italic;
      border: 1px dashed rgba(212,175,90,.15);
      border-radius: 6px;
    }
    .eng-comment {
      padding: 0.9rem 1rem;
      background: rgba(86,10,10,.3);
      border: 1px solid rgba(212,175,90,.12);
      border-radius: 4px;
    }
    .eng-comment-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.4rem;
      font-size: 0.82rem;
    }
    .eng-comment-head b { color: #d4af5a; font-family: 'Cinzel', serif; }
    .eng-comment-head span { color: #7a7060; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; }
    .eng-comment-body { color: #e6dccb; font-size: 0.9rem; line-height: 1.55; }

    @media (max-width: 640px) {
      .eng-actions { flex-direction: column; align-items: stretch; }
      .eng-share-group { margin-left: 0; justify-content: flex-start; }
    }
  `;
  document.head.appendChild(style);
}

/* ============================================================
   HELPERS
   ============================================================ */
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

/* ============================================================
   LOGIQUE
   ============================================================ */
const engagementRef = (type, id) => doc(db, 'engagements', type + '_' + id);

async function incrementView(type, id) {
  if (!type || !id) return;
  const key = 'eng_v_' + type + '_' + id;
  if (sessionStorage.getItem(key)) return;
  try {
    await setDoc(engagementRef(type, id), {
      type, itemId: id,
      vues: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
    sessionStorage.setItem(key, '1');
  } catch (e) { console.warn('[Engagement] view:', e); }
}

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
    return !alreadyLiked;
  } catch (e) {
    console.warn('[Engagement] like:', e);
    return alreadyLiked;
  }
}

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
  } catch (e) {
    console.warn('[Engagement] comment:', e);
    throw e;
  }
}

function shareUrls(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title || 'Dava David Agossa');
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`
  };
}

/* ============================================================
   RENDU PRINCIPAL
   ============================================================ */
async function render(containerId, type, id, url, title) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[Engagement] Conteneur introuvable :', containerId);
    return;
  }

  container.innerHTML = `
    <div class="eng-box">
      <div class="eng-stats">
        <span>👁️ <b class="eng-vues">0</b> vues</span>
        <span>❤️ <b class="eng-likes">0</b> likes</span>
        <span>💬 <b class="eng-nbcom">0</b> commentaires</span>
      </div>
      <div class="eng-actions">
        <button class="eng-btn-like" type="button">
          <span class="ico">🤍</span>
          <span class="lbl">J'aime</span>
        </button>
        <div class="eng-share-group">
          <a class="eng-share-btn eng-share-wa" target="_blank" rel="noopener">📱 WhatsApp</a>
          <a class="eng-share-btn eng-share-fb" target="_blank" rel="noopener">📘 Facebook</a>
          <a class="eng-share-btn eng-share-tw" target="_blank" rel="noopener">🐦 X</a>
          <button class="eng-share-btn eng-share-tk" type="button">🎵 TikTok</button>
          <button class="eng-share-btn eng-share-cp" type="button">🔗 Copier</button>
        </div>
      </div>
      <div class="eng-comments">
        <h4>💬 Laisser un commentaire</h4>
        <form class="eng-form">
          <input type="text" class="eng-author" placeholder="Votre nom (optionnel)" maxlength="80" />
          <textarea class="eng-text" placeholder="Votre commentaire…" required maxlength="2000"></textarea>
          <button type="submit" class="eng-submit">Publier</button>
        </form>
        <div class="eng-list">
          <div class="eng-empty">Soyez le premier à commenter.</div>
        </div>
      </div>
    </div>
  `;

  // Comptage de vue
  incrementView(type, id);

  // Écoute des compteurs (temps réel)
  onSnapshot(engagementRef(type, id), (snap) => {
    const d = snap.exists() ? snap.data() : { vues: 0, likes: 0, nbCommentaires: 0 };
    const vuesEl = container.querySelector('.eng-vues');
    const likesEl = container.querySelector('.eng-likes');
    const nbEl = container.querySelector('.eng-nbcom');
    if (vuesEl) vuesEl.textContent = formatNum(d.vues || 0);
    if (likesEl) likesEl.textContent = formatNum(d.likes || 0);
    if (nbEl) nbEl.textContent = formatNum(d.nbCommentaires || 0);
  }, (e) => console.warn('[Engagement] listen:', e));

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

  // Partage
  const urls = shareUrls(url, title);
  const waBtn = container.querySelector('.eng-share-wa');
  const fbBtn = container.querySelector('.eng-share-fb');
  const twBtn = container.querySelector('.eng-share-tw');
  if (waBtn) waBtn.href = urls.whatsapp;
  if (fbBtn) fbBtn.href = urls.facebook;
  if (twBtn) twBtn.href = urls.twitter;

  const tkBtn = container.querySelector('.eng-share-tk');
  tkBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      const old = tkBtn.textContent;
      tkBtn.textContent = '✅ Lien copié';
      setTimeout(() => { tkBtn.textContent = old; }, 2000);
    } catch (e) { alert('Lien : ' + url); }
  });

  const cpBtn = container.querySelector('.eng-share-cp');
  cpBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      const old = cpBtn.textContent;
      cpBtn.textContent = '✅ Copié !';
      setTimeout(() => { cpBtn.textContent = old; }, 2000);
    } catch (e) { alert('Lien : ' + url); }
  });

  // Formulaire de commentaire
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
      submitBtn.textContent = '❌ Erreur';
      setTimeout(() => { submitBtn.textContent = 'Publier'; }, 2000);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Écoute des commentaires (temps réel)
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
        </div>
      `;
    }).join('');
  }, (e) => console.warn('[Engagement] comments listen:', e));
}

/* ============================================================
   EXPORT
   ============================================================ */
export const Engagement = {
  render,
  incrementView,
  toggleLike,
  addComment,
  formatNum,
  timeAgo
};

console.log('✅ engagement.js chargé');
