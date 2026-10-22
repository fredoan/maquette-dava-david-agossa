// ============================================================
// ENGAGEMENT.JS — Likes, Vues, Commentaires, Partage
// ============================================================
import { db } from './firebase-config.js';
import { 
  doc, setDoc, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp, increment, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- INJECTION DU CSS (Design GBÈZÉ JUNIOR) ---
const style = document.createElement('style');
style.textContent = `
  .eng-box { margin: 2rem 0; padding: 1.5rem; background: rgba(26,0,0,.6); border: 1px solid rgba(212,175,90,.24); border-radius: 8px; font-family: 'Lato', sans-serif; }
  .eng-stats { display: flex; gap: 1.5rem; margin-bottom: 1.2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #b8a691; }
  .eng-stats b { color: #d4af5a; font-weight: 700; }
  .eng-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1.5rem; }
  .eng-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 4px; font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(212,175,90,.3); background: rgba(26,0,0,.5); color: #e6dccb; text-decoration: none; }
  .eng-btn:hover { border-color: #d4af5a; color: #d4af5a; background: rgba(212,175,90,.08); }
  .eng-btn.liked { background: #d4af5a; color: #1a0000; border-color: #d4af5a; }
  .eng-share-group { display: flex; gap: 0.5rem; margin-left: auto; flex-wrap: wrap; }
  .eng-share-btn { padding: 0.4rem 0.8rem; border-radius: 3px; font-size: 0.7rem; font-weight: 700; text-decoration: none; border: none; cursor: pointer; transition: transform 0.2s; }
  .eng-share-btn:hover { transform: translateY(-2px); }
  .eng-wa { background: #25D366; color: #fff; } .eng-fb { background: #1877F2; color: #fff; } .eng-tw { background: #000; color: #fff; } .eng-tk { background: #000; color: #fff; border: 1px solid #fe2c55; } .eng-cp { background: #d4af5a; color: #1a0000; }
  .eng-comments { margin-top: 1.5rem; border-top: 1px solid rgba(212,175,90,.15); padding-top: 1.5rem; }
  .eng-comments h4 { font-family: 'Cinzel', serif; color: #d4af5a; font-size: 1rem; margin-bottom: 1rem; }
  .eng-form { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
  .eng-form input, .eng-form textarea { width: 100%; padding: 0.8rem; background: rgba(26,0,0,.8); border: 1px solid rgba(212,175,90,.2); border-radius: 4px; color: #f7f2e9; font-family: 'Lato', sans-serif; outline: none; }
  .eng-form textarea { min-height: 80px; resize: vertical; }
  .eng-form button { align-self: flex-start; padding: 0.6rem 1.5rem; background: #d4af5a; color: #1a0000; border: none; border-radius: 4px; font-family: 'Cinzel', serif; font-weight: 700; cursor: pointer; }
  .eng-form button:disabled { opacity: 0.5; cursor: not-allowed; }
  .eng-comment { padding: 1rem; background: rgba(86,10,10,.3); border-radius: 4px; margin-bottom: 0.8rem; }
  .eng-comment-head { display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.8rem; }
  .eng-comment-head b { color: #d4af5a; }
  .eng-comment-head span { color: #7a7060; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; }
  .eng-comment-body { color: #e6dccb; font-size: 0.9rem; }
`;
document.head.appendChild(style);

// --- LOGIQUE ---
export const Engagement = (function() {
  function formatNum(n) {
    n = parseInt(n, 10) || 0;
    if(n >= 1000000) return (n/1000000).toFixed(1).replace('.0','')+'M';
    if(n >= 1000) return (n/1000).toFixed(1).replace('.0','')+'k';
    return String(n);
  }

  function timeAgo(ts) {
    if(!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const s = Math.floor((Date.now() - d.getTime())/1000);
    if(s < 60) return "à l'instant";
    if(s < 3600) return Math.floor(s/60) + ' min';
    if(s < 86400) return Math.floor(s/3600) + ' h';
    if(s < 2592000) return Math.floor(s/86400) + ' j';
    return d.toLocaleDateString('fr-FR');
  }

  // Incrementer les vues (1 fois par session par article)
  async function view(type, id) {
    if(!type || !id) return;
    const key = 'gg_v_'+type+'_'+id;
    if(sessionStorage.getItem(key)) return;
    try {
      await setDoc(doc(db, 'engagements', type + '_' + id), {
        type, itemId: id,
        vues: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
      sessionStorage.setItem(key, '1');
    } catch(e) { console.warn(e); }
  }

  // Toggle Like
  async function toggleLike(type, id) {
    const key = 'gg_l_'+type+'_'+id;
    const liked = localStorage.getItem(key) === '1';
    try {
      await setDoc(doc(db, 'engagements', type + '_' + id), {
        type, itemId: id,
        likes: increment(liked ? -1 : 1),
        updatedAt: serverTimestamp()
      }, { merge: true });
      if(liked) localStorage.removeItem(key); else localStorage.setItem(key, '1');
      return !liked;
    } catch(e) { console.warn(e); return liked; }
  }

  // Ajouter commentaire
  async function addComment(type, id, auteur, texte) {
    auteur = (auteur || 'Anonyme').trim().slice(0, 80);
    texte = (texte || '').trim().slice(0, 2000);
    if(!texte) return;
    try {
      await addDoc(collection(db, 'engagements', type + '_' + id, 'commentaires'), {
        auteur, texte, date: serverTimestamp()
      });
      await setDoc(doc(db, 'engagements', type + '_' + id), {
        nbCommentaires: increment(1)
      }, { merge: true });
    } catch(e) { console.warn(e); }
  }

  // Générer les liens de partage
  function shareUrls(url, title) {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title || 'Dava David Agossa');
    return {
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`
    };
  }

  // --- RENDU DU BLOC COMPLET ---
  async function render(containerId, type, id, url, title) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    container.innerHTML = `
      <div class="eng-box">
        <div class="eng-stats">
          <span>👁️ <b class="e-vues">0</b> vues</span>
          <span>❤️ <b class="e-likes">0</b> likes</span>
          <span>💬 <b class="e-nbcom">0</b> commentaires</span>
        </div>
        <div class="eng-actions">
          <button class="eng-btn e-btn-like">🤍 J'aime</button>
          <div class="eng-share-group">
            <a class="eng-share-btn eng-wa" target="_blank">📱 WhatsApp</a>
            <a class="eng-share-btn eng-fb" target="_blank">📘 Facebook</a>
            <a class="eng-share-btn eng-tw" target="_blank">🐦 X</a>
            <button class="eng-share-btn eng-tk">🎵 TikTok</button>
            <button class="eng-share-btn eng-cp">🔗 Copier</button>
          </div>
        </div>
        <div class="eng-comments">
          <h4>💬 Laisser un commentaire</h4>
          <form class="eng-form">
            <input type="text" class="e-author" placeholder="Votre nom (optionnel)" maxlength="80">
            <textarea class="e-text" placeholder="Votre commentaire..." required maxlength="2000"></textarea>
            <button type="submit" class="e-submit">Publier</button>
          </form>
          <div class="e-list"><p style="color:#7a7060; font-size:0.85rem;">Chargement des commentaires...</p></div>
        </div>
      </div>
    `;

    // Lancer l'incrémentation de vue
    view(type, id);

    // Écouter les compteurs temps réel
    onSnapshot(doc(db, 'engagements', type + '_' + id), (snap) => {
      const d = snap.exists() ? snap.data() : {vues:0, likes:0, nbCommentaires:0};
      container.querySelector('.e-vues').textContent = formatNum(d.vues || 0);
      container.querySelector('.e-likes').textContent = formatNum(d.likes || 0);
      container.querySelector('.e-nbcom').textContent = formatNum(d.nbCommentaires || 0);
    });

    // Bouton Like
    const btnLike = container.querySelector('.e-btn-like');
    const isLiked = localStorage.getItem('gg_l_'+type+'_'+id) === '1';
    if(isLiked) { btnLike.classList.add('liked'); btnLike.innerHTML = '❤️ Aimé'; }
    btnLike.onclick = async () => {
      const newState = await toggleLike(type, id);
      btnLike.classList.toggle('liked', newState);
      btnLike.innerHTML = newState ? '❤️ Aimé' : '🤍 J\'aime';
    };

    // Liens de partage
    const urls = shareUrls(url, title);
    container.querySelector('.eng-wa').href = urls.whatsapp;
    container.querySelector('.eng-fb').href = urls.facebook;
    container.querySelector('.eng-tw').href = urls.twitter;
    
    container.querySelector('.eng-tk').onclick = () => {
      navigator.clipboard.writeText(url);
      alert("Lien copié ! Collez-le dans votre vidéo TikTok.");
    };
    container.querySelector('.eng-cp').onclick = () => {
      navigator.clipboard.writeText(url);
      const btn = container.querySelector('.eng-cp');
      btn.textContent = '✅ Copié !';
      setTimeout(() => btn.textContent = '🔗 Copier', 2000);
    };

    // Formulaire commentaire
    const form = container.querySelector('.eng-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const author = container.querySelector('.e-author').value;
      const text = container.querySelector('.e-text').value;
      const btn = container.querySelector('.e-submit');
      btn.disabled = true; btn.textContent = "Envoi...";
      await addComment(type, id, author, text);
      form.reset();
      btn.disabled = false; btn.textContent = "Publier";
    };

    // Écouter les commentaires temps réel
    const q = query(collection(db, 'engagements', type + '_' + id, 'commentaires'), orderBy('date', 'desc'));
    onSnapshot(q, (snap) => {
      const list = container.querySelector('.e-list');
      if(snap.empty) {
        list.innerHTML = '<p style="color:#7a7060; font-size:0.85rem; font-style:italic;">Soyez le premier à commenter.</p>';
        return;
      }
      list.innerHTML = snap.docs.map(d => {
        const c = d.data();
        return `<div class="eng-comment">
          <div class="eng-comment-head"><b>${c.auteur}</b><span>${timeAgo(c.date)}</span></div>
          <div class="eng-comment-body">${c.texte.replace(/\n/g, '<br>')}</div>
        </div>`;
      }).join('');
    });
  }

  return { view, toggleLike, addComment, render };
})();
