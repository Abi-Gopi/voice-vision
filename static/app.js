const $ = (id) => document.getElementById(id);

function setStatus(msg){
  $("statusLine").textContent = `Status: ${msg}`;
}

async function postJSON(url, body){
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if(!res.ok){
    throw new Error(data?.reply || data?.error || `Request failed: ${res.status}`);
  }
  return data;
}

// ---- Text-to-Speech ----
let lastReply = "";
function speak(text){
  const msg = text || lastReply;
  if(!msg) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(msg);
  u.rate = 1.0;
  u.pitch = 1.0;
  u.onend = () => setStatus("Spoken.");
  u.onerror = () => setStatus("Speech synthesis error.");
  setStatus("Speaking...");
  window.speechSynthesis.speak(u);
}

// ---- Speech Recognition ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;

function setupSpeech(){
  if(!SpeechRecognition){
    setStatus("SpeechRecognition not supported. Use Google Chrome.");
    $("btnStart").disabled = true;
    return;
  }
  recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.lang = "en-US";

  recognizer.onstart = () => setStatus("Listening...");
  recognizer.onerror = (e) => setStatus(`Mic error: ${e.error}`);
  recognizer.onend = () => {
    $("btnStart").disabled = false;
    $("btnStop").disabled = true;
  };
  recognizer.onresult = (e) => {
    const text = e.results[0][0].transcript;
    $("commandText").value = text;
    setStatus("Recognized. Sending...");
    sendCommand(text);
  };
}

async function sendCommand(text){
  try{
    const data = await postJSON("/api/command", { command: text });
    lastReply = data.reply || "";
    $("replyText").value = lastReply;
    speak(lastReply);

    if(data.action === "open"){
      const t = (data.payload?.target || "").trim();
      if(t){
        let url = t;
        if(!/^https?:\/\//i.test(url)){
          url = `https://www.google.com/search?q=${encodeURIComponent(t)}`;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }

    if(data.action === "request_ocr") setStatus("OCR requested. Enable camera and use OCR Read.");
    if(data.action === "request_describe") setStatus("Describe requested. Enable camera and use Describe Scene.");

  }catch(err){
    setStatus(err.message);
  }
}

// ---- Camera ----
let stream = null;

async function enableCamera(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    $("video").srcObject = stream;
    $("btnCapture").disabled = false;
    $("btnOCR").disabled = false;
    $("btnDescribe").disabled = false;
    setStatus("Camera enabled.");
  }catch(err){
    setStatus("Camera error: " + err.message);
  }
}

function captureFrame(){
  const video = $("video");
  const canvas = $("canvas");
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/png");
  setStatus("Captured.");
  return dataUrl;
}

async function doOCR(){
  try{
    const imageDataUrl = captureFrame();
    setStatus("Sending for OCR...");
    const data = await postJSON("/api/ocr", { imageDataUrl });
    $("ocrText").value = data.text || "";
    lastReply = data.reply || "OCR done.";
    $("replyText").value = lastReply;

    if(data.text && data.text.trim()){
      speak(data.text.trim());
    }else{
      speak(lastReply);
    }
    setStatus("OCR complete.");
  }catch(err){
    setStatus(err.message);
  }
}

async function doDescribe(){
  try{
    const imageDataUrl = captureFrame();
    setStatus("Sending for description...");
    const data = await postJSON("/api/describe", { imageDataUrl });
    lastReply = data.reply || "Description complete.";
    $("replyText").value = lastReply;
    speak(lastReply);
    setStatus("Describe complete.");
  }catch(err){
    setStatus(err.message);
  }
}

// ---- UI wiring ----
window.addEventListener("DOMContentLoaded", () => {
  setupSpeech();

  $("btnStart").addEventListener("click", () => {
    if(!recognizer) return;
    $("btnStart").disabled = true;
    $("btnStop").disabled = false;
    recognizer.start();
  });

  $("btnStop").addEventListener("click", () => {
    if(!recognizer) return;
    recognizer.stop();
    $("btnStart").disabled = false;
    $("btnStop").disabled = true;
    setStatus("Stopped listening.");
  });

  $("btnSpeak").addEventListener("click", () => speak());

  $("btnSendCommand").addEventListener("click", () => {
    const text = $("commandText").value;
    sendCommand(text);
  });

  $("btnClear").addEventListener("click", () => {
    $("commandText").value = "";
    $("replyText").value = "";
    $("ocrText").value = "";
    lastReply = "";
    setStatus("Cleared.");
  });

  $("btnCamera").addEventListener("click", enableCamera);
  $("btnCapture").addEventListener("click", () => captureFrame());
  $("btnOCR").addEventListener("click", doOCR);
  $("btnDescribe").addEventListener("click", doDescribe);

  setStatus("Ready.");
});
