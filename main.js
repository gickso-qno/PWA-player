const audio = new Audio();
let tracks = [];
let currentIndex = 0;
let isPlaying = false;

// DOM
const playBtn = document.querySelector(".btn-play i");
const nextBtn = document.querySelector(".fa-step-forward").parentNode;
const prevBtn = document.querySelector(".fa-step-backward").parentNode;
const shuffleBtn = document.querySelector(".fa-random").parentNode;
const repeatBtn = document.querySelector(".fa-repeat").parentNode;
const titleEl = document.getElementById("track-title");
const artistEl = document.getElementById("track-artist");
const progressEl = document.getElementById("progress");
const progressContainer = document.querySelector(".progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const playlistEl = document.getElementById("playlist");

// === Автоматическая загрузка треков ===
async function loadTrackList() {
  try {
    const response = await fetch("assets/tracks.json");
    tracks = await response.json();
    if (!tracks.length) {
      playlistEl.innerHTML = `<p style="text-align:center;color:#777;">Нет треков</p>`;
      return;
    }
    renderPlaylist();
    loadTrack(0);
  } catch (err) {
    console.error("Ошибка загрузки треков:", err);
    playlistEl.innerHTML = `<p style="text-align:center;color:#777;">Ошибка загрузки треков</p>`;
  }
}

// === Вспомогательные функции ===
function renderPlaylist() {
  playlistEl.innerHTML = tracks
    .map((t, i) => `<div class="track ${i===currentIndex?"active":""}" data-index="${i}">🎵 ${t.title}</div>`)
    .join("");
}

function loadTrack(index) {
  const track = tracks[index];
  audio.src = track.src;
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist;
  document.querySelectorAll(".track").forEach(el => el.classList.remove("active"));
  playlistEl.children[index].classList.add("active");
}

function playTrack() {
  audio.play(); isPlaying = true;
  playBtn.classList.replace("fa-play","fa-pause");
}
function pauseTrack() {
  audio.pause(); isPlaying = false;
  playBtn.classList.replace("fa-pause","fa-play");
}
function nextTrack() {
  currentIndex = (currentIndex + 1) % tracks.length;
  loadTrack(currentIndex); playTrack();
}
function prevTrack() {
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentIndex); playTrack();
}

// === Прогресс ===
audio.addEventListener("timeupdate",()=>{
  if(!audio.duration) return;
  const pct = (audio.currentTime/audio.duration)*100;
  progressEl.style.width = `${pct}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
audio.addEventListener("loadedmetadata",()=>{
  durationEl.textContent = formatTime(audio.duration);
});
progressContainer.addEventListener("click",(e)=>{
  const w = progressContainer.clientWidth;
  const x = e.offsetX;
  audio.currentTime = (x/w)*audio.duration;
});
function formatTime(sec){
  const m=Math.floor(sec/60);
  const s=Math.floor(sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

// === Кнопки ===
playBtn.parentNode.addEventListener("click",()=> isPlaying?pauseTrack():playTrack());
nextBtn.addEventListener("click",nextTrack);
prevBtn.addEventListener("click",prevTrack);
shuffleBtn.addEventListener("click",()=>{
  tracks.sort(()=>Math.random()-0.5);
  currentIndex=0;
  renderPlaylist();
  loadTrack(currentIndex);
});
repeatBtn.addEventListener("click",()=>{
  audio.loop=!audio.loop;
  repeatBtn.style.color=audio.loop?"#1db954":"#fff";
});
playlistEl.addEventListener("click",(e)=>{
  const el=e.target.closest(".track");
  if(!el) return;
  currentIndex=parseInt(el.dataset.index);
  loadTrack(currentIndex);
  playTrack();
});

// === Старт ===
loadTrackList();