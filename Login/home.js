 (function(){
  // Matrix canvas + RAF + debounce
  const canvas = document.getElementById('matrix');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  let cols = 0, ypos = [], rafId = null, running = true;

  function debounce(fn, wait){ let t = null; return function(...a){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), wait); }; }

  function resize(){
    if(!canvas) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    cols = Math.max(8, Math.floor(canvas.width / 12)); ypos = Array(cols).fill(0).map(()=>Math.random()*20);
  }
  const onResize = debounce(resize, 120);

  function loop(){
    if(!ctx || !running) return;
    ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(0,255,120,0.85)'; ctx.font = '12px "Share Tech Mono", monospace';
    for(let i=0;i<cols;i++){
      const ch = String.fromCharCode(33 + Math.random()*94);
      const x = i * 14; ctx.fillText(ch, x, ypos[i]*14);
      if(ypos[i]*14 > canvas.height && Math.random()>0.97) ypos[i]=0;
      ypos[i] += 1.4 + Math.random()*1.0;
    }
    rafId = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', onResize);
  resize(); loop();
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ running=false; if(rafId) cancelAnimationFrame(rafId); } else { running=true; loop(); } });

  // simple storage helpers
  function getUsers(){ try{return JSON.parse(localStorage.getItem('users')||'[]')}catch(e){return []} }
  function saveUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }
  function getSession(){ try{return JSON.parse(localStorage.getItem('sessionUser'))}catch(e){return null} }
  function setSession(s){ localStorage.setItem('sessionUser', JSON.stringify(s)); }

  // UI elements
  const welcome = document.getElementById('home-welcome');
  const avatar = document.getElementById('avatar');
  const signout = document.getElementById('signout');
  const tiles = Array.from(document.querySelectorAll('.tiles .tile'));
  const content = document.getElementById('content');

  const session = getSession();
  if(!session){ window.location.href = 'index.html'; return; }

  function refreshHeader(){ welcome.textContent = `Hello, ${session.name.split(' ')[0]}`; avatar.textContent = session.name.split(' ')[0].charAt(0).toUpperCase(); }
  refreshHeader();

  signout && signout.addEventListener('click', ()=>{ localStorage.removeItem('sessionUser'); window.location.href = 'index.html'; });

  // view renderers
  function renderDashboard(){
    const users = getUsers();
    content.innerHTML = `
      <h3>Dashboard</h3>
      <div class="panel-row">
        <div class="tile-stat">
          <div class="small">Registered users</div>
          <div class="tile-value">${users.length}</div>
        </div>
        <div class="tile-stat">
          <div class="small">Your email</div>
          <div class="tile-value">${escapeHtml(session.email)}</div>
        </div>
      </div>
      <p class="small">This is a client-side demo dashboard. Data is stored in localStorage.</p>
    `;
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function renderProfile(){
    content.innerHTML = `
      <h3>Profile</h3>
      <form id="profile-form">
        <div class="field"><label>Full name</label><input id="pf-name" value="${escapeHtml(session.name)}" /></div>
        <div class="field"><label>Email</label><input id="pf-email" value="${escapeHtml(session.email)}" /></div>
        <div class="field"><label>Change password (leave blank to keep)</label><input id="pf-pass" type="password" placeholder="New password" /></div>
        <div class="panel-row"><button type="submit" class="btn">Save</button><div id="profile-msg" class="small"></div></div>
      </form>
    `;
    const form = document.getElementById('profile-form');
    form && form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('pf-name').value.trim();
      const email = document.getElementById('pf-email').value.trim().toLowerCase();
      const pass = document.getElementById('pf-pass').value;
      const users = getUsers();
      const other = users.find(u=>u.email===email && u.email !== session.email);
      const msgEl = document.getElementById('profile-msg');
      if(!name||!email){ if(msgEl) msgEl.textContent = 'Name and email are required'; return }
      if(other){ if(msgEl) msgEl.textContent = 'Email already in use by another account'; return }
      const idx = users.findIndex(u=>u.email===session.email);
      if(idx!==-1){ users[idx].name = name; users[idx].email = email; if(pass) users[idx].password = pass; saveUsers(users); session.name = name; session.email = email; setSession(session); refreshHeader(); if(msgEl) msgEl.textContent = 'Saved';
        if(window && window.showToast) window.showToast('Profile saved', 'success');
      }
    });
  }

  function renderAbout(){
    content.innerHTML = `
      <h3>About Us</h3>
      <p>This is a demo 3D-styled authentication portal built as a client-side example. No server is used — accounts and data are stored in your browser's localStorage.</p>
      <p class="small">Features: 3D auth card, neon/matrix visual theme, local registration/login, and a small dashboard.</p>
      <p class="small">This demo is for learning and prototyping only. Do not use it for real authentication.</p>
    `;
  }

  // Messages feature removed — replaced by About Us page.

  function applyTheme(t){ if(t==='dark'){ document.documentElement.style.setProperty('--neon','#aeb6c1'); document.documentElement.style.setProperty('--neon2','#88b0c1'); } else { document.documentElement.style.setProperty('--neon','#00ff6a'); document.documentElement.style.setProperty('--neon2','#33ff99'); } }
  applyTheme(localStorage.getItem('theme')||'neon');

  function setActive(view){ tiles.forEach(b=>{ b.classList.toggle('active', b.dataset.view===view); }); }
  function show(view){ setActive(view); if(view==='dashboard') renderDashboard(); if(view==='profile') renderProfile(); if(view==='about') renderAbout(); }

  tiles.forEach(b=> b.addEventListener('click', ()=> show(b.dataset.view)) );
  show('dashboard');

})();