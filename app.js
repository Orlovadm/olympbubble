const BUBBLE_COUNT = 63;
const grid = document.querySelector('#bubbleGrid');
const mascot = document.querySelector('#mascot');
const resetButton = document.querySelector('#resetButton');
const soundButton = document.querySelector('#soundButton');
const popSounds = Array.from({ length: 6 }, () => {
  const audio = new Audio('./assets/bubble-pop.mp3');
  audio.preload = 'auto';
  audio.volume = .55;
  return audio;
});
let poppedCount = 0;
let soundEnabled = true;
let nextSound = 0;

const colorNames = ['orange', 'lime', 'green'];
let colorVariants;
let mascotBubbleIndex = 0;

function shuffledColors() {
  const colors = Array.from({ length: BUBBLE_COUNT }, (_, index) => colorNames[index % colorNames.length]);
  for (let index = colors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [colors[index], colors[swapIndex]] = [colors[swapIndex], colors[index]];
  }
  return colors;
}

colorVariants = shuffledColors();

function makeBubble(index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `bubble color-${colorVariants[index]}`;
  button.dataset.index = String(index);
  button.setAttribute('aria-label', `Pop bubble ${index + 1}`);
  button.addEventListener('click', () => popBubble(button));
  return button;
}

function playPop() {
  if (!soundEnabled) return;
  const audio = popSounds[nextSound];
  nextSound = (nextSound + 1) % popSounds.length;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function randomizeColors() {
  colorVariants = shuffledColors();
  [...grid.querySelectorAll('.bubble')].forEach((bubble, index) => {
    bubble.classList.remove('color-orange', 'color-lime', 'color-green');
    bubble.classList.add(`color-${colorVariants[index]}`);
  });
}

function positionMascot() {
  const bubbles = [...grid.querySelectorAll('.bubble')];
  const target = bubbles[mascotBubbleIndex];
  if (!target) return;
  mascot.style.left = `${target.offsetLeft + target.offsetWidth / 2 - mascot.offsetWidth / 2}px`;
  mascot.style.top = `${target.offsetTop + target.offsetHeight / 2 - mascot.offsetHeight * .48}px`;
}

function randomizeMascotSpot() {
  mascot.classList.remove('found');
  const row = 1 + Math.floor(Math.random() * 7);
  const column = 1 + Math.floor(Math.random() * 5);
  mascotBubbleIndex = row * 7 + column;
  requestAnimationFrame(positionMascot);
}

function makeParticles(bubble) {
  const gridRect = grid.getBoundingClientRect();
  const rect = bubble.getBoundingClientRect();
  const centerX = rect.left - gridRect.left + rect.width / 2;
  const centerY = rect.top - gridRect.top + rect.height / 2;
  const bubbleColor = getComputedStyle(bubble).getPropertyValue('--bubble-rgb').trim();

  for (let i = 0; i < 6; i += 1) {
    const particle = document.createElement('span');
    const angle = (Math.PI * 2 * i) / 6 + Math.random() * .3;
    const distance = 22 + Math.random() * 14;
    particle.className = 'particle';
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
    particle.style.setProperty('--particle-rgb', bubbleColor);
    grid.append(particle);
    particle.addEventListener('animationend', () => particle.remove());
  }
}

function celebrateIfComplete() {
  if (poppedCount === BUBBLE_COUNT) {
    mascot.classList.remove('celebrate');
    void mascot.offsetWidth;
    mascot.classList.add('celebrate');
  }
}

function popBubble(bubble) {
  if (bubble.classList.contains('popped')) return;
  bubble.classList.add('popped');
  bubble.setAttribute('aria-label', 'Popped bubble');
  bubble.setAttribute('aria-pressed', 'true');
  poppedCount += 1;
  makeParticles(bubble);
  playPop();
  navigator.vibrate?.(18);
  if (Number(bubble.dataset.index) === mascotBubbleIndex) {
    mascot.classList.remove('found');
    void mascot.offsetWidth;
    mascot.classList.add('found');
  }
  celebrateIfComplete();
}

function resetBubbles() {
  const bubbles = [...grid.querySelectorAll('.bubble')];
  poppedCount = 0;
  randomizeColors();
  randomizeMascotSpot();
  bubbles.forEach((bubble, index) => {
    window.setTimeout(() => {
      bubble.classList.remove('popped');
      bubble.classList.add('restoring');
      bubble.setAttribute('aria-label', `Pop bubble ${index + 1}`);
      bubble.removeAttribute('aria-pressed');
      bubble.addEventListener('animationend', () => bubble.classList.remove('restoring'), { once: true });
    }, index * 16);
  });
}

function closeWebView() {
  const message = { type: 'olymptrade:close-breather' };
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  window.webkit?.messageHandlers?.olymptrade?.postMessage(message);

  if (!window.ReactNativeWebView && !window.webkit?.messageHandlers?.olymptrade) {
    if (history.length > 1) history.back();
    else window.close();
  }
}

for (let i = 0; i < BUBBLE_COUNT; i += 1) grid.append(makeBubble(i));
grid.append(mascot);
randomizeMascotSpot();
window.addEventListener('resize', positionMascot);
mascot.addEventListener('animationend', (event) => {
  if (event.animationName === 'mascot-wave') mascot.classList.remove('found');
});
resetButton.addEventListener('click', resetBubbles);
soundButton.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  soundButton.setAttribute('aria-label', soundEnabled ? 'Turn sound off' : 'Turn sound on');
});
document.querySelector('#backButton').addEventListener('click', closeWebView);
