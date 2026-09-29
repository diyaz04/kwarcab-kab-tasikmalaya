const https = require('https');
const fs = require('fs');
function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => { file.close(resolve); });
    }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}
async function run() {
  await download('https://upload.wikimedia.org/wikipedia/commons/9/90/Logo_Gerakan_Pramuka.svg', 'public/tunas.svg');
  await download('https://upload.wikimedia.org/wikipedia/commons/3/30/World_Scout_Emblem.svg', 'public/wosm.svg');
  console.log('Downloaded SVGs successfully');
}
run();
