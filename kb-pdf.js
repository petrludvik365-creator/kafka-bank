// Builds a one-page A4 PDF that contains a JPEG image (no libraries).
// kbBuildPdf(jpegBytes: Uint8Array, imgW: number, imgH: number) -> Uint8Array
(function (root) {
  function kbBuildPdf(jpeg, imgW, imgH) {
    var enc = new TextEncoder(), parts = [], len = 0, offs = [];
    function push(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(n, body) { offs[n] = len; push(n + ' 0 obj\n' + body + '\nendobj\n'); }

    var pw = 595.28, ph = 841.89, m = 18;
    var sc = Math.min((pw - 2 * m) / imgW, (ph - 2 * m) / imgH);
    var w = imgW * sc, h = imgH * sc, x = (pw - w) / 2, y = (ph - h) / 2;
    var content = 'q ' + w.toFixed(2) + ' 0 0 ' + h.toFixed(2) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /Im0 Do Q';

    push('%PDF-1.4\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>');
    obj(4, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    offs[5] = len;
    push('5 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH +
         ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n');
    push(jpeg);
    push('\nendstream\nendobj\n');

    var xref = len, t = 'xref\n0 6\n0000000000 65535 f \n', n;
    for (n = 1; n <= 5; n++) t += ('0000000000' + offs[n]).slice(-10) + ' 00000 n \n';
    t += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    push(t);

    var out = new Uint8Array(len), p = 0;
    parts.forEach(function (b) { out.set(b, p); p += b.length; });
    return out;
  }
  root.kbBuildPdf = kbBuildPdf;
  if (typeof module !== 'undefined' && module.exports) module.exports = kbBuildPdf;
})(typeof window !== 'undefined' ? window : globalThis);
