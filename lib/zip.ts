// Builds a ZIP archive in the browser from already published files (stored, UTF-8 names),
// so a whole folder or school year can be downloaded without keeping extra ZIP copies on the server.
export type ZipItem = { url: string; path: string };

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(files: { path: string; data: Uint8Array<ArrayBuffer> }[], date = new Date()) {
  const encoder = new TextEncoder(), parts: BlobPart[] = [], central: BlobPart[] = [], names = new Set<string>();
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  let offset = 0, centralSize = 0;
  for (const file of files) {
    let path = file.path;
    for (let n = 2; names.has(path.toLowerCase()); n++) path = file.path.replace(/(\.[^./]+)?$/, ` (${n})$1`);
    names.add(path.toLowerCase());
    const name = encoder.encode(path), crc = crc32(file.data), size = file.data.length;
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 file names
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, name.length, true);
    parts.push(local.buffer, name, file.data);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(12, time, true);
    entry.setUint16(14, day, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, size, true);
    entry.setUint32(24, size, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(entry.buffer, name);
    offset += 30 + name.length + size;
    centralSize += 46 + name.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}

export async function downloadZip(items: ZipItem[], filename: string, progress?: (done: number, total: number) => void) {
  const files: { path: string; data: Uint8Array<ArrayBuffer> }[] = new Array(items.length);
  let next = 0, done = 0, failed = false;
  async function worker() {
    while (next < items.length && !failed) {
      const i = next++;
      try {
        const response = await fetch(items[i].url);
        if (!response.ok) throw new Error(`${response.status} ${items[i].url}`);
        files[i] = { path: items[i].path, data: new Uint8Array(await response.arrayBuffer()) };
      } catch (error) { failed = true; throw error; }
      if (!failed) progress?.(++done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, items.length) }, worker));
  const url = URL.createObjectURL(zip(files));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
