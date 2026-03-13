import { lookup } from 'dns/promises';
import net from 'net';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.azure.internal',
  '169.254.169.254',
  '0.0.0.0',
]);

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal'];

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.')
  );
}

function isBlockedIpAddress(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return true;
  return BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

async function resolvesToBlockedIp(hostname: string): Promise<boolean> {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.some((record) => isBlockedIpAddress(record.address));
}

export async function assertSafePublicUrl(
  rawUrl: string,
  allowedProtocols: ReadonlyArray<string> = ['http:', 'https:'],
): Promise<URL> {
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error('URL is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid URL');
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('URL hostname is required');
  }

  if (isBlockedHostname(hostname)) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  if (isBlockedIpAddress(hostname)) {
    throw new Error(`Blocked IP address: ${hostname}`);
  }

  try {
    if (await resolvesToBlockedIp(hostname)) {
      throw new Error(`Hostname resolves to a private IP: ${hostname}`);
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Could not validate hostname: ${hostname}`);
  }

  return parsed;
}
