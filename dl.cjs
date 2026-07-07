const axios = require('axios');
const fs = require('fs');

async function downloadBase64(url, type) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return `data:${type};base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
    return '';
  }
}

async function run() {
  const pramukaSvg = await downloadBase64('https://upload.wikimedia.org/wikipedia/commons/9/90/Logo_Gerakan_Pramuka.svg', 'image/svg+xml');
  const jabarPng = await downloadBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Logo_Kwarda_Jawa_Barat.png/320px-Logo_Kwarda_Jawa_Barat.png', 'image/png');
  const mapSvg = await downloadBase64('https://upload.wikimedia.org/wikipedia/commons/e/e4/Indonesia_blank_map.svg', 'image/svg+xml');

  let content = ``;
  if (mapSvg) content += `export const mapSvg = '${mapSvg}';\n`;
  else content += `export const mapSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMjAwIj48cGF0aCBkPSJNMTAgMTAwIFEyMCA5MCA0MCAxMDAgVDYwIDExMCBUODAgMTAwIFQxMDAgOTAgVDEyMCAxMDAgVDE0MCAxMTAgVDE2MCAxMDAgVDE4MCA5MCBUMjAwIDEwMCBUMjIwIDExMCBUMjQwIDEwMCBUMjYwIDkwIFQyODAgMTAwIFQzMDAgMTEwIFQzMjAgMTAwIFQzNDAgOTAgVDM2MCAxMDAgVDM4MCAxMTAgVDM5MCAxMDAgVDQwMCAxMDAgVDM5MCAxMjAgVDM4MCAxNDAgVDM2MCAxMzAgVDM0MCAxNDAgVDMyMCAxMzAgVDMwMCAxMjAgVTI4MCAxMjAgVTI2MCAxNDAgVTI0MCAxMzAgVTIyMCAxMjAgVTIwMCAxNDAgVTE4MCAxMzAgVTE2MCAxMzAgVTE0MCAxNTAgVTEyMCAxMzAgVTEwMCAxNDAgVTgwIDE0MCBVNjAgMTIwIFU0MCAxMzAgVTIwIDEzMCBVMTAgMTEwIFoiIGZpbGw9IiNkMGQwZDAiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==';\n`;
  
  if (pramukaSvg) content += `export const pramukaSvg = '${pramukaSvg}';\n`;
  else content += `export const pramukaSvg = '';\n`;

  if (jabarPng) content += `export const jabarPng = '${jabarPng}';\n`;
  else content += `export const jabarPng = '';\n`;

  fs.writeFileSync('src/components/ktaAssets.ts', content);
  console.log('ktaAssets.ts successfully updated with actual images!');
}

run();
