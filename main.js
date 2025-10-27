const audio = new Audio();
let tracks = [];
let currentIndex = 0;
let isPlaying = false;

const playBtn = document.querySelector(".btn-play i");
const nextBtn = document.querySelector(".fa-step-forward").parentNode;
const prevBtn = document.querySelector(".fa-step-backward").parentNode;
const shuffleBtn = document.querySelector(".fa-random").parentNode;
const repeatBtn = document.querySelector(".fa-repeat").parentNode;
const titleEl = document.getElementById("track-title");
const artistEl = document.getElementById("track-artist");
const coverEl = document.getElementById("cover-img");
const progressEl = document.getElementById("progress");
const progressContainer = document.querySelector(".progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const playlistEl = document.getElementById("playlist");
const fileInput = document.getElementById("fileInput");

// === Функция загрузки папки ===
fileInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files)
    .filter(f => f.name.endsWith(".mp3"))
    .map(f => ({
      title: f.name.replace(".mp3", ""),
      artist: "Локальный файл",
      src: URL.createObjectURL(f),
      cover: "assets/cover.jpg"
    }));

  if (!files.length) return alert("В выбранной папке нет .mp3 файлов 😅");

  tracks = files;
  currentIndex = 0;
  renderPlaylist();
  loadTrack(currentIndex);
});

// === Рендер плейлиста ===
function renderPlaylist() {
  playlistEl.innerHTML = tracks.map((t, i) => `
    <div class="track ${i === currentIndex ? "active" : ""}" data-index="${i}">
      <span>🎵</span> ${t.title}
    </div>
  `).join("");
}

// === Загрузка трека ===
function loadTrack(index) {
  if (!tracks.length) return;
  const track = tracks[index];
  audio.src = track.src;
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist;
  coverEl.src = track.cover;
  document.querySelectorAll(".track").forEach(el => el.classList.remove("active"));
  playlistEl.children[index].classList.add("active");
}

// === Управление ===
function playTrack() {
  if (!tracks.length) return;
  audio.play();
  isPlaying = true;
  playBtn.classList.replace("fa-play", "fa-pause");
}
function pauseTrack() {
  audio.pause();
  isPlaying = false;
  playBtn.classList.replace("fa-pause", "fa-play");
}
function nextTrack() {
  if (!tracks.length) return;
  currentIndex = (currentIndex + 1) % tracks.length;
  loadTrack(currentIndex);
  playTrack();
}
function prevTrack() {
  if (!tracks.length) return;
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentIndex);
  playTrack();
}

// === Прогресс ===
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  progressEl.style.width = `${progressPercent}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});
progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  audio.currentTime = (clickX / width) * audio.duration;
});
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// === Кнопки ===
playBtn.parentNode.addEventListener("click", () => (isPlaying ? pauseTrack() : playTrack()));
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);
shuffleBtn.addEventListener("click", () => {
  if (!tracks.length) return;
  tracks.sort(() => Math.random() - 0.5);
  currentIndex = 0;
  renderPlaylist();
  loadTrack(currentIndex);
});
repeatBtn.addEventListener("click", () => {
  audio.loop = !audio.loop;
  repeatBtn.style.color = audio.loop ? "#1db954" : "#fff";
});

// === Клик по плейлисту ===
playlistEl.addEventListener("click", (e) => {
  const trackDiv = e.target.closest(".track");
  if (!trackDiv) return;
  currentIndex = parseInt(trackDiv.dataset.index);
  loadTrack(currentIndex);
  playTrack();
});