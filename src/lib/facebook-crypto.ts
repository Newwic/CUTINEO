import crypto from 'node:crypto';

export function timingSafeEqualText(received: string, expected: string): boolean {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function verifyFacebookSignature(body: string, header: string, appSecret: string): boolean {
  if (!body || !header || !appSecret || !header.startsWith('sha256=')) return false;

  const receivedHex = header.slice('sha256='.length);
  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) return false;

  const expectedHex = crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  const received = Buffer.from(receivedHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}
