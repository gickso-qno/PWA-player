// логика плеера
import { addTracks, getAllTracks, deleteTrack } from "./idb.js";

const listEl = document.getElementById("list");
const picker = document.getElementById("picker");
const addBtn = document.getElementById("add");
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const seek = document.getElementById("seek");
const time = document.getElementById("time");
const installBtn = document.getElementById("install");

let tracks = [];
let current = -1;
let deferredPrompt = null;

// PWA install prompt (Android/частично iOS)
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt = null;
  installBtn.style.display = "none";
});

// Регистрация SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
// Попросим «постоянное хранилище», чтобы iOS реже чистил данные
if (navigator.storage?.persist) {
  navigator.storage.persist();
}

addBtn.onclick = () => picker.click();
picker.onchange = async () => {
  if (picker.files?.length) {
    await addTracks(picker.files);
    await refreshList();
  }
};

async function refreshList() {
  tracks = await getAllTracks();
  listEl.innerHTML = "";
  for (const t of tracks) {
    const li = document.createElement("li");
    li.innerHTML = `
      <button data-id="${t.id}" class="play">▶︎</button>
      <div class="title">${t.name}</div>
      <button data-id="${t.id}" class="del">🗑️</button>
    `;
    listEl.appendChild(li);
  }
}
listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.classList.contains("play")) {
    const idx = tracks.findIndex(x => x.id === id);
    if (idx !== -1) loadAndPlay(idx);
  } else if (btn.classList.contains("del")) {
    await deleteTrack(id);
    if (tracks[current]?.id === id) { audio.pause(); current = -1; }
    await refreshList();
  }
});

function loadAndPlay(idx) {
  current = idx;
  const rec = tracks[current];
  // File/Blob -> ObjectURL
  const url = URL.createObjectURL(rec.blob);
  audio.src = url;
  audio.play().catch(()=>{ /* жест запроса нужен на iOS — кнопка Play решит */ });
  setMediaSession(rec.name);
}

playBtn.onclick = () => {
  if (!audio.src && tracks.length) loadAndPlay(0);
  else if (audio.paused) audio.play();
  else audio.pause();
};
prevBtn.onclick = () => {
  if (!tracks.length) return;
  const idx = (current > 0 ? current - 1 : tracks.length - 1);
  loadAndPlay(idx);
};
nextBtn.onclick = () => {
  if (!tracks.length) return;
  const idx = (current + 1) % tracks.length;
  loadAndPlay(idx);
};
audio.addEventListener("ended", () => nextBtn.click());

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  seek.value = String(Math.floor(pct));
  time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
});
seek.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (Number(seek.value) / 100) * audio.duration;
});

function fmt(s) {
  s = Math.floor(s || 0);
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

function setMediaSession(title) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title, artist: "", album: ""
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", () => prevBtn.click());
  navigator.mediaSession.setActionHandler("nexttrack", () => nextBtn.click());
  navigator.mediaSession.setActionHandler("seekto", (d) => {
    if (d.seekTime != null) audio.currentTime = d.seekTime;
  });
}