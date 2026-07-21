/**
 * Gravatar URL helper — computes the avatar URL from an email address without
 * pulling in a runtime dependency (`react-gravatar`). Gravatar hashes the
 * lowercased, trimmed email with MD5; we ship a tiny, self-contained MD5 so the
 * package stays lightweight and tree-shakeable.
 *
 * Replaces the legacy `<Gravatar email={…} />` usage in poker-card / card-reveal
 * / dev-sign-in with a plain, accessible `<img>` the components own.
 */

function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xffff);
}

function rotl(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

function cmn(
  q: number,
  a: number,
  b: number,
  x: number,
  s: number,
  t: number,
): number {
  return safeAdd(rotl(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}
function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}
function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}

function bytesToWords(bytes: number[]): number[] {
  const words: number[] = [];
  for (let i = 0, b = 0; i < bytes.length; i++, b += 8) {
    words[b >>> 5] = (words[b >>> 5] ?? 0) | ((bytes[i] ?? 0) & 0xff) << (b % 32);
  }
  return words;
}

function md5(input: string): string {
  // UTF-8 encode.
  const bytes: number[] = [];
  for (const ch of unescape(encodeURIComponent(input))) {
    bytes.push(ch.charCodeAt(0));
  }
  const bitLen = bytes.length * 8;
  const x = bytesToWords(bytes);
  x[bitLen >>> 5] = (x[bitLen >>> 5] ?? 0) | (0x80 << bitLen % 32);
  x[(((bitLen + 64) >>> 9) << 4) + 14] = bitLen;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;
    const w = (j: number) => x[i + j] ?? 0;

    a = ff(a, b, c, d, w(0), 7, -680876936);
    d = ff(d, a, b, c, w(1), 12, -389564586);
    c = ff(c, d, a, b, w(2), 17, 606105819);
    b = ff(b, c, d, a, w(3), 22, -1044525330);
    a = ff(a, b, c, d, w(4), 7, -176418897);
    d = ff(d, a, b, c, w(5), 12, 1200080426);
    c = ff(c, d, a, b, w(6), 17, -1473231341);
    b = ff(b, c, d, a, w(7), 22, -45705983);
    a = ff(a, b, c, d, w(8), 7, 1770035416);
    d = ff(d, a, b, c, w(9), 12, -1958414417);
    c = ff(c, d, a, b, w(10), 17, -42063);
    b = ff(b, c, d, a, w(11), 22, -1990404162);
    a = ff(a, b, c, d, w(12), 7, 1804603682);
    d = ff(d, a, b, c, w(13), 12, -40341101);
    c = ff(c, d, a, b, w(14), 17, -1502002290);
    b = ff(b, c, d, a, w(15), 22, 1236535329);

    a = gg(a, b, c, d, w(1), 5, -165796510);
    d = gg(d, a, b, c, w(6), 9, -1069501632);
    c = gg(c, d, a, b, w(11), 14, 643717713);
    b = gg(b, c, d, a, w(0), 20, -373897302);
    a = gg(a, b, c, d, w(5), 5, -701558691);
    d = gg(d, a, b, c, w(10), 9, 38016083);
    c = gg(c, d, a, b, w(15), 14, -660478335);
    b = gg(b, c, d, a, w(4), 20, -405537848);
    a = gg(a, b, c, d, w(9), 5, 568446438);
    d = gg(d, a, b, c, w(14), 9, -1019803690);
    c = gg(c, d, a, b, w(3), 14, -187363961);
    b = gg(b, c, d, a, w(8), 20, 1163531501);
    a = gg(a, b, c, d, w(13), 5, -1444681467);
    d = gg(d, a, b, c, w(2), 9, -51403784);
    c = gg(c, d, a, b, w(7), 14, 1735328473);
    b = gg(b, c, d, a, w(12), 20, -1926607734);

    a = hh(a, b, c, d, w(5), 4, -378558);
    d = hh(d, a, b, c, w(8), 11, -2022574463);
    c = hh(c, d, a, b, w(11), 16, 1839030562);
    b = hh(b, c, d, a, w(14), 23, -35309556);
    a = hh(a, b, c, d, w(1), 4, -1530992060);
    d = hh(d, a, b, c, w(4), 11, 1272893353);
    c = hh(c, d, a, b, w(7), 16, -155497632);
    b = hh(b, c, d, a, w(10), 23, -1094730640);
    a = hh(a, b, c, d, w(13), 4, 681279174);
    d = hh(d, a, b, c, w(0), 11, -358537222);
    c = hh(c, d, a, b, w(3), 16, -722521979);
    b = hh(b, c, d, a, w(6), 23, 76029189);
    a = hh(a, b, c, d, w(9), 4, -640364487);
    d = hh(d, a, b, c, w(12), 11, -421815835);
    c = hh(c, d, a, b, w(15), 16, 530742520);
    b = hh(b, c, d, a, w(2), 23, -995338651);

    a = ii(a, b, c, d, w(0), 6, -198630844);
    d = ii(d, a, b, c, w(7), 10, 1126891415);
    c = ii(c, d, a, b, w(14), 15, -1416354905);
    b = ii(b, c, d, a, w(5), 21, -57434055);
    a = ii(a, b, c, d, w(12), 6, 1700485571);
    d = ii(d, a, b, c, w(3), 10, -1894986606);
    c = ii(c, d, a, b, w(10), 15, -1051523);
    b = ii(b, c, d, a, w(1), 21, -2054922799);
    a = ii(a, b, c, d, w(8), 6, 1873313359);
    d = ii(d, a, b, c, w(15), 10, -30611744);
    c = ii(c, d, a, b, w(6), 15, -1560198380);
    b = ii(b, c, d, a, w(13), 21, 1309151649);
    a = ii(a, b, c, d, w(4), 6, -145523070);
    d = ii(d, a, b, c, w(11), 10, -1120210379);
    c = ii(c, d, a, b, w(2), 15, 718787259);
    b = ii(b, c, d, a, w(9), 21, -343485551);

    a = safeAdd(a, oa);
    b = safeAdd(b, ob);
    c = safeAdd(c, oc);
    d = safeAdd(d, od);
  }

  const hex = (n: number) => {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += ((n >>> (i * 8 + 4)) & 0x0f).toString(16) + ((n >>> (i * 8)) & 0x0f).toString(16);
    }
    return s;
  };

  return hex(a) + hex(b) + hex(c) + hex(d);
}

/** Options for {@link gravatarUrl}. */
export interface GravatarOptions {
  /** Rendered pixel size (square). Defaults to 80. */
  size?: number;
  /** Fallback style when no avatar exists (Gravatar `d` param). Defaults to `retro`. */
  fallback?: "retro" | "identicon" | "monsterid" | "wavatar" | "robohash" | "mp";
}

/**
 * Build a Gravatar avatar URL for an email address. Email is normalized
 * (trimmed + lowercased) and MD5-hashed per the Gravatar spec.
 */
export function gravatarUrl(
  email: string | undefined,
  { size = 80, fallback = "retro" }: GravatarOptions = {},
): string {
  const hash = md5((email ?? "").trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${fallback}`;
}
