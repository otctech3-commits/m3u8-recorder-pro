import { FFmpeg } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';
import { fetchFile, toBlobURL } from 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js';

const ffmpeg = new FFmpeg();
let recording = false;
let abortController = null;

const log = (msg) => {
  const logEl = document.getElementById('logOutput');
  logEl.innerHTML += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
};

const updateProgress = (time, size, status) => {
  document.getElementById('progressTime').textContent = time;
  document.getElementById('progressSize').textContent = size;
  document.getElementById('progressStatus').textContent = status;
};

// Load ffmpeg
async function loadFFmpeg() {
  log('Loading ffmpeg.wasm...');
  ffmpeg.on('log', ({ message }) => log(message));
  
  ffmpeg.on('progress', ({ progress, time }) => {
    const percent = Math.round(progress * 100);
    document.getElementById('progressFill').style.width = `${percent}%`;
    updateProgress(formatTime(time / 1000000), '...', `Processing ${percent}%`);
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  log('FFmpeg loaded ✅');
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 MB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// Start recording
document.getElementById('startBtn').addEventListener('click', async () => {
  const url = document.getElementById('streamUrl').value.trim();
  const format = document.getElementById('formatSelect').value;
  const duration = parseInt(document.getElementById('duration').value) || 0;
  const allAudio = document.getElementById('allAudioTracks').checked;
  const copyCodec = document.getElementById('copyCodec').checked;

  if (!url) return alert('Enter M3U8 URL');
  
  if (!ffmpeg.loaded) await loadFFmpeg();

  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('progress').style.display = 'block';
  document.getElementById('downloadSection').style.display = 'none';
  document.getElementById('logOutput').innerHTML = '';
  recording = true;
  abortController = new AbortController();

  try {
    log(`Starting record: ${url}`);
    updateProgress('00:00', '0 MB', 'Fetching stream...');
    
    // FFmpeg args
    const outputFile = `recording.${format}`;
    const args = [
      '-i', url,
      '-user_agent', 'Mozilla/5.0',
    ];

    // Map all audio streams if checked
    if (allAudio) {
      args.push('-map', '0:v?', '-map', '0:a?'); // v? and a? = all video/audio if exist
    }

    // Duration limit
    if (duration > 0) {
      args.push('-t', duration.toString());
    }

    // Codec handling
    if (copyCodec && format !== 'mp3') {
      args.push('-c', 'copy'); // No re-encode, fastest
    } else if (format === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-q:a', '0'); // Best quality MP3
      args.push('-vn'); // No video
    } else if (format === 'mka') {
      args.push('-c', 'copy', '-vn'); // Audio only, copy all tracks
    } else {
      args.push('-c:v', 'libx264', '-c:a', 'aac'); // Re-encode for MP4
    }

    args.push(outputFile);

    log(`FFmpeg command: ffmpeg ${args.join(' ')}`);
    updateProgress('00:00', '0 MB', 'Recording...');

    await ffmpeg.exec(args, { signal: abortController.signal });
    
    log('Recording finished, preparing download...');
    const data = await ffmpeg.readFile(outputFile);
    const blob = new Blob([data.buffer], { 
      type: format === 'mp3' ? 'audio/mpeg' : format === 'mp4' ? 'video/mp4' : 'application/octet-stream' 
    });
    
    const downloadUrl = URL.createObjectURL(blob);
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.href = downloadUrl;
    downloadBtn.download = outputFile;
    
    document.getElementById('fileInfo').textContent = `${outputFile} • ${formatBytes(blob.size)}`;
    document.getElementById('downloadSection').style.display = 'block';
    updateProgress('Done', formatBytes(blob.size), 'Complete ✅');
    
    await ffmpeg.deleteFile(outputFile);
    
  } catch (err) {
    if (err.name === 'AbortError') {
      log('Recording stopped by user');
    } else {
      log(`Error: ${err.message}`);
      alert(`Recording failed: ${err.message}`);
    }
  } finally {
    recording = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
  }
});

// Stop recording
document.getElementById('stopBtn').addEventListener('click', () => {
  if (recording && abortController) {
    abortController.abort();
    ffmpeg.terminate();
    log('Stopping recording...');
  }
});
