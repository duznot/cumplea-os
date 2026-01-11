// script.js
// Controla la animación del sobre, la aparición de la carta y el carrusel de fotos.

document.addEventListener('DOMContentLoaded', function(){
  const envelope = document.getElementById('envelope');
  const letter = document.getElementById('letter');
  const flap = document.getElementById('flap');
  const photosContainer = document.getElementById('photos');
  const TOTAL_PHOTOS = 27; // img1.jpg .. img27.jpg
  const photos = [];
  let visibleInterval = null;
  // Cards/messages
  const CARD_MESSAGES = [
    `<!-- EDIT: Replace this content with your romantic message #1 -->
     <h2 class="large">Para mi esposa</h2>
     <p>Alguna vez me sentí así…<br>
        perdido, incompleto,<br>
        como si no supiera cómo encajar en este mundo.<br><br>
        Pero entonces apareciste tú,<br>
        y entendí que quizá no era indigno de ser humano,<br>
        solo estaba esperando a la persona correcta.</p>`,
    `<!-- EDIT: Replace this content with your romantic message #2 -->
     <h2 class="large">la mas hermosa</h2>
     <p>No soy perfecto.<br>
No siempre sé expresar lo que siento.<br>
A veces me callo, a veces me rompo por dentro.<br><br>

Pero como esos personajes que aman en silencio,<br>
cuando amo, lo hago de verdad.<br>
Y a ti… te amo sin dudas.</p>`,
    `<!-- EDIT: Replace this content with your romantic message #3 -->
     <h2 class="large">TE AMO</h2>
     <p>Cuando pienso en el mañana,<br>
no imagino un lugar,<br>
imagino tu nombre.<br><br>

Quiero que seas mi esposa.<br>
Quiero que seas mi hogar.<br>
Quiero que seas mi siempre.</p>`,
    `<!-- EDIT: Replace this content with your romantic message #4 -->
     <h2 class="large">MI FUTURA ESPOSA</h2>
     <p>No sueño con grandes cosas.<br>
Sueño con una vida tranquila.<br>
Con despertar a tu lado.<br><br>

Con una casa llena de risas,<br>
y una pequeña vida que lleve un poco de ti<br>
y un poco de mí.</p>`,
    `<!-- EDIT: Replace this content with your romantic message #5 -->
     <h2 class="large">La madre de nuestros hijos</h2>
     <p>No es una idea cualquiera.<br>
No es un deseo vacío.<br><br>

Es contigo o no es.<br>
Porque no imagino ese futuro<br>
si no estás tú.</p>`
  ];
  let cardIndex = 0;
  let cardInterval = null;

  // Iniciar animación: abrir sobre y mostrar carta con pequeño retardo
  // Abrir sobre más lento para efecto elegante
  setTimeout(()=>{
    envelope.classList.add('open');
    // Iniciar fotos tras la apertura
    setTimeout(()=>{
      startFloatingPhotos();
    }, 900);
  }, 900);

  // Después de que la carta salga, separar la carta del sobre y ocultar el sobre
  function releaseLetter(){
    // evitar ejecutar varias veces
    if(envelope.dataset.released) return;
    envelope.dataset.released = '1';
    // mover la carta fuera del sobre al <body> para que no quede oculta por display:none del padre
    const rect = letter.getBoundingClientRect();
    document.body.appendChild(letter);
    // mantener la posición visual actual para que la carta NO salte
    letter.style.position = 'fixed';
    letter.style.left = rect.left + 'px';
    letter.style.top = rect.top + 'px';
    letter.style.width = rect.width + 'px';
    letter.style.height = rect.height + 'px';
    letter.style.margin = '0';
    // Aplicar transform/opacity explícitos para que se vea como "salida" pero no se mueva
    letter.style.transform = 'translateY(-6%)';
    letter.style.opacity = '1';
    letter.style.zIndex = 40;
    // Añadir transición suave
    letter.style.transition = 'transform 600ms ease, opacity 400ms ease, left 400ms ease, top 400ms ease';

    // animar el sobre para desaparecer (solo opacidad) y no moverlo de sitio
    setTimeout(()=>{
      envelope.style.transition = 'opacity 700ms ease';
      envelope.style.opacity = '0';
      envelope.style.pointerEvents = 'none';
      // después de transición, eliminar el sobre sin afectar la carta
      setTimeout(()=>{
        try{ envelope.remove(); }catch(e){ envelope.style.display = 'none'; }
        // iniciar rotación de cartas tras liberar la carta
        startCardRotation();
      }, 750);
    }, 450);
  }

  // Botón para continuar
  // botón eliminado: no hay acción necesaria

  // Genera imágenes img1.jpg .. img27.jpg dentro del contenedor
  function generatePhotos(){
    for(let i=1;i<=TOTAL_PHOTOS;i++){
      // crear un contenedor DIV con background-image para mayor robustez
      const div = document.createElement('div');
      div.className = 'photo';
      div.style.backgroundImage = `url('img${i}.jpg')`;
      div.style.backgroundSize = 'cover';
      div.style.backgroundPosition = 'center';
      // marcar como "cargado" (asumimos que background-image puede tardar, pero el div será visible)
      div.dataset.loaded = '1';
      photosContainer.appendChild(div);
      photos.push(div);
    }
  }

  // Muestra un par de fotos aleatorias, posicionadas en pantalla
  function showTwoRandom(){
    if(photos.length===0) return;
    // ocultar todas
    photos.forEach(p=>p.classList.remove('show'));

    // elegir dos índices distintos (si hay al menos 2 fotos)
    const indices = [];
    while(indices.length < Math.min(6, photos.length)){
      const r = Math.floor(Math.random()*photos.length);
      if(!indices.includes(r)) indices.push(r);
    }

    // compute avoid rects: letter and button
    const avoidRects = [];
    try{
      const letterEl = document.getElementById('letter');
      if(letterEl){ avoidRects.push(letterEl.getBoundingClientRect()); }
      const btnEl = document.getElementById('continueBtn');
      if(btnEl){ avoidRects.push(btnEl.getBoundingClientRect()); }
    }catch(e){/* ignore */}

    indices.forEach((idx, i)=>{
      const el = photos[idx];
      // tamaño conocido en CSS, pero tomar medidas reales si están cargadas
      const w = el.naturalWidth ? Math.min(el.naturalWidth, 220) : (el.offsetWidth || 120);
      const h = el.naturalHeight ? Math.min(el.naturalHeight, 160) : (el.offsetHeight || 90);
      const padding = 24;
      const maxLeft = Math.max(0, window.innerWidth - w - padding);
      const maxTop = Math.max(0, window.innerHeight - h - padding);
      // Intenta evitar solapamiento básico: si i===1, prueba varias posiciones
      let left, top;
      let attempts = 0;
      const maxAttempts = 30;
      const overlaps = (r1, r2) => !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
      do{
        left = Math.floor(Math.random() * maxLeft) + padding/2;
        top = Math.floor(Math.random() * maxTop) + padding/2;
        const rect = {left, top, right: left + w, bottom: top + h};
        // verificar que no solape con avoidRects
        const bad = avoidRects.some(ar => overlaps(rect, ar));
        // también evitar solapamiento con la primera escogida cuando i===1
        let firstRectBad = false;
        if(i===1 && photos[indices[0]] && photos[indices[0]].style.left){
          const aleft = parseInt(photos[indices[0]].style.left||0);
          const atop = parseInt(photos[indices[0]].style.top||0);
          const rect0 = {left:aleft, top:atop, right:aleft + (photos[indices[0]].offsetWidth||w), bottom:atop + (photos[indices[0]].offsetHeight||h)};
          firstRectBad = overlaps(rect, rect0);
        }
        attempts++;
        if(!bad && !firstRectBad) break;
      } while(attempts < maxAttempts);

      el.style.left = left + 'px';
      el.style.top = top + 'px';
      // aplicar rotación ligera aleatoria
      const rot = (Math.random()*12 - 6).toFixed(2);
      el.style.transform = `rotate(${rot}deg) scale(.98)`;
      // mostrar solo si cargó (o después de un timeout)
      if(el.dataset.loaded === '1' || el.complete){
        void el.offsetWidth; el.classList.add('show');
      } else {
        // esperar carga breve y luego mostrar
        el.addEventListener('load', function once(){ void el.offsetWidth; el.classList.add('show'); el.removeEventListener('load', once); });
        // fallback: si no carga en 1.5s, mostrar de todos modos
        setTimeout(()=>{ if(!el.classList.contains('show')){ el.classList.add('show'); } }, 1500);
      }
    });
  }

  function startFloatingPhotos(){
    // stop previous interval if any
    if(visibleInterval) clearInterval(visibleInterval);
    // ensure photos generated only once
    if(photos.length===0) generatePhotos();
    // Mostrar inmediatamente un par, con pequeña espera para permitir carga de imágenes
    setTimeout(()=>{
      showTwoRandom();
    }, 250);
    visibleInterval = setInterval(()=>{
      showTwoRandom();
    }, 4200);
  }

  // CARD rotation: show messages for 35s each with transition
  function showCard(i){
    const paper = letter.querySelector('.paper');
    if(!paper) return;
    // fade-out
    paper.classList.add('hidden');
    setTimeout(()=>{
      // replace content
      paper.innerHTML = CARD_MESSAGES[i];
      // remove hidden to fade-in
      requestAnimationFrame(()=>{ paper.classList.remove('hidden'); });
    }, 540);
  }

  function startCardRotation(){
    if(!CARD_MESSAGES.length) return;
    // keep the initial content visible, then change to the first CARD message after 30s
    cardIndex = 0;
    const delay = 30000; // 30s
    // schedule first change after `delay`
    setTimeout(()=>{
      // show first defined message
      showCard(0);
      // then cycle to subsequent messages every `delay`
      cardInterval = setInterval(()=>{
        cardIndex++;
        if(cardIndex >= CARD_MESSAGES.length){
          clearInterval(cardInterval);
          return;
        }
        showCard(cardIndex);
      }, delay);
    }, delay);
  }

  // Limpieza si la página se oculta
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      clearInterval(visibleInterval);
    } else {
      startFloatingPhotos();
    }
  });

  // Escuchar la apertura sobre el flap y mover la carta cuando termine la transición
  if(flap){
    flap.addEventListener('transitionend', (e)=>{
      if(e.propertyName && e.propertyName.includes('transform')){
        setTimeout(()=>{ releaseLetter(); }, 350);
      }
    });
  }

});