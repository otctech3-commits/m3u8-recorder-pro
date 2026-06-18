# m3u8-recorder-pro

-:https://mk-bots.blogspot.com/2026/05/mk-bots.html
# M3U8 Recorder Pro 🎥

Client-side HLS/M3U8 recorder with multi-audio track support. Built with ffmpeg.wasm.

## ⚠️ Legal Notice
This tool is for recording streams you OWN or have EXPLICIT PERMISSION to record. 
Recording copyrighted content without permission is ILLEGAL. 
You are responsible for how you use this tool.

## Features
- ✅ Record M3U8/HLS streams in browser
- ✅ All audio tracks - record multiple languages/commentary
- ✅ MP4, MP3, MKA, TS output
- ✅ No server needed - 100% client-side
- ✅ Copy codec mode - no re-encode, instant
- ✅ Duration limit or manual stop

## Deploy to GitHub Pages
1. Fork this repo
2. Settings → Pages → Deploy from main
3. Done

## Tech
- ffmpeg.wasm v0.12 - FFmpeg in browser via WebAssembly
- Vanilla JS + HTML5
- No backend, no tracking

## Limitations
- Large files may crash browser - use duration limit
- CORS - some streams block browser access
- Performance - encoding is slower than native ffmpeg

MIT License - Use responsibly
