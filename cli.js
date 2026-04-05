const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const extensionPath = process.argv[2] || __dirname;

const binaryPath = path.join(extensionPath, 'bin', 'mpg123.exe');
let streams = null;
async function loadStreams() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/nikhilchoukseyy/terminal_music_player_vscode_extension/refs/heads/main/streams.json');
    const data = await response.json();
    console.log('✅ Streams loaded from remote');
    return data;
  } catch (err) {
    console.log('⚠️ Remote fetch failed, using local...');
    return JSON.parse(fs.readFileSync(path.join(extensionPath, 'streams.json'), 'utf-8'));
  }
}

let player = null;
let state = 'genre'
let currentGenre = null;

(async () => {
  streams = await loadStreams();
  showGenreScreen();
})();

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
  if (state === 'genre') {
    if (key === 'l') playGenre('lofi');
    if (key === 's') showSongsScreen()
  } else if (state === 'songs') {
    if (key === '1') playGenre('english');
    if (key === '2') playGenre('hiphop');
    if (key === '3') playGenre('chill');
  }
  else if (state === 'playing') {
    if (key === 'n') nextSong();
    if (key === 'q') { player.kill(); process.exit(); }
  }
});


function playGenre(genre) {
  currentGenre = genre;
  state = 'playing';
  const list = streams[genre];
  const stream = list[Math.floor(Math.random() * list.length)];
  drawUI(stream, genre);
  startPlayer(stream);
}

function nextSong() {
  playGenre(currentGenre);
}



function startPlayer(stream) {
  if (player) player.kill();
  const args = stream.url.endsWith('.m3u') ? ['-q', '-@', stream.url] : ['-q', stream.url];
  player = spawn(binaryPath, args, {
    cwd: path.join(extensionPath, 'bin'),
    stdio: ['ignore', 'ignore', 'ignore']
  });
  player.on('error', (err) => console.log(`Error: ${err.message}`));
}

function showGenreScreen() {
  state = 'genre';
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('\x1b[36m┌─────────────────────────────────┐\x1b[0m');
  console.log('\x1b[36m│\x1b[0m      🎵  SELECT GENRE          \x1b[36m│\x1b[0m');
  console.log('\x1b[36m├─────────────────────────────────┤\x1b[0m');
  console.log('\x1b[36m│\x1b[0m  [L] Lofi      [S] Songs       \x1b[36m│\x1b[0m');
  console.log('\x1b[36m└─────────────────────────────────┘\x1b[0m');
}

function showSongsScreen() {
  state = 'songs';
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('\x1b[36m┌─────────────────────────────────┐\x1b[0m');
  console.log('\x1b[36m│\x1b[0m      🎵  SELECT SONGS          \x1b[36m│\x1b[0m');
  console.log('\x1b[36m├─────────────────────────────────┤\x1b[0m');
  console.log('\x1b[36m│\x1b[0m  [1] English    \x1b[36m│\x1b[0m');
  console.log('\x1b[36m│\x1b[0m  [2] HipHop     [3] Chill      \x1b[36m│\x1b[0m');
  console.log('\x1b[36m└─────────────────────────────────┘\x1b[0m');
}

function drawUI(stream, genre) {
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('\x1b[36m┌─────────────────────────────────┐\x1b[0m');
  console.log(`\x1b[36m│\x1b[0m      🎵  ${genre.toUpperCase().padEnd(24)}\x1b[36m│\x1b[0m`);
  console.log('\x1b[36m├─────────────────────────────────┤\x1b[0m');
  console.log(`\x1b[36m│\x1b[0m  Now: \x1b[32m${stream.name.padEnd(27)}\x1b[0m\x1b[36m│\x1b[0m`);
  console.log('\x1b[36m├─────────────────────────────────┤\x1b[0m');
  console.log('\x1b[36m│\x1b[0m  [N] Next   [Q] Quit           \x1b[36m│\x1b[0m');
  console.log('\x1b[36m└─────────────────────────────────┘\x1b[0m');
}