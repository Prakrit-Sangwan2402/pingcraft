const dns = require('dns');
const net = require('net');
const { URL } = require('url');

const BLOCKED_IPV4_RANGES = [
  { start: ipToLong('0.0.0.0'), end: ipToLong('0.255.255.255') },
  { start: ipToLong('10.0.0.0'), end: ipToLong('10.255.255.255') },
  { start: ipToLong('100.64.0.0'), end: ipToLong('100.127.255.255') },
  { start: ipToLong('127.0.0.0'), end: ipToLong('127.255.255.255') },
  { start: ipToLong('169.254.0.0'), end: ipToLong('169.254.255.255') },
  { start: ipToLong('172.16.0.0'), end: ipToLong('172.31.255.255') },
  { start: ipToLong('192.0.0.0'), end: ipToLong('192.0.0.255') },
  { start: ipToLong('192.0.2.0'), end: ipToLong('192.0.2.255') },
  { start: ipToLong('192.168.0.0'), end: ipToLong('192.168.255.255') },
  { start: ipToLong('198.18.0.0'), end: ipToLong('198.19.255.255') },
  { start: ipToLong('198.51.100.0'), end: ipToLong('198.51.100.255') },
  { start: ipToLong('203.0.113.0'), end: ipToLong('203.0.113.255') },
  { start: ipToLong('224.0.0.0'), end: ipToLong('239.255.255.255') },
  { start: ipToLong('240.0.0.0'), end: ipToLong('255.255.255.255') }
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'broadcasthost',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
  'metadata.aws'
]);

const DISALLOWED_HEADERS = new Set([
  'host',
  'cookie',
  'cookie2',
  'authorization',
  'proxy-authorization',
  'connection',
  'upgrade',
  'keep-alive',
  'proxy-connection',
  'transfer-encoding',
  'te',
  'trailer',
  'content-length',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site'
]);

function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0) >>> 0;
}

function isProhibitedIPv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return true;
  for (const part of parts) {
    const num = Number(part);
    if (!Number.isInteger(num) || num < 0 || num > 255) return true;
  }

  const longVal = ipToLong(ip);
  return BLOCKED_IPV4_RANGES.some(range => longVal >= range.start && longVal <= range.end);
}

function isProhibitedIPv6(ip) {
  const normalized = ip.toLowerCase();

  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  const ipv4MappedMatch = normalized.match(/^(?:::ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (ipv4MappedMatch) {
    return isProhibitedIPv4(ipv4MappedMatch[1]);
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (/^fe[89ab]/i.test(normalized)) return true;
  if (normalized.startsWith('ff')) return true;
  if (normalized.startsWith('2001:db8:')) return true;

  return false;
}

function isProhibitedIP(ip) {
  if (net.isIPv4(ip)) return isProhibitedIPv4(ip);
  if (net.isIPv6(ip)) return isProhibitedIPv6(ip);
  return true;
}

async function validateTargetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Target URL is required' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { valid: false, error: `Invalid protocol '${parsedUrl.protocol}'. Only 'http:' and 'https:' are supported.` };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (!hostname) {
    return { valid: false, error: 'URL must contain a valid host' };
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, error: `Access to '${hostname}' is restricted for security (SSRF prevention).` };
  }

  if (net.isIP(hostname)) {
    if (isProhibitedIP(hostname)) {
      return { valid: false, error: `Target IP '${hostname}' is in a private or restricted network range.` };
    }
    return { valid: true, parsedUrl, resolvedIps: [hostname] };
  }

  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: `Could not resolve host '${hostname}'` };
    }

    const resolvedIps = addresses.map(a => a.address);

    for (const addr of addresses) {
      if (isProhibitedIP(addr.address)) {
        return {
          valid: false,
          error: `Host '${hostname}' resolved to private address '${addr.address}'`
        };
      }
    }

    return { valid: true, parsedUrl, resolvedIps };
  } catch (dnsErr) {
    return { valid: false, error: `DNS resolution failed for '${hostname}': ${dnsErr.message}` };
  }
}

function sanitizeRequestHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof key !== 'string' || typeof value !== 'string') continue;
    const lowerKey = key.trim().toLowerCase();

    if (DISALLOWED_HEADERS.has(lowerKey)) continue;
    if (lowerKey.length > 64 || value.length > 1024) continue;

    sanitized[key.trim()] = value.trim();
  }
  return sanitized;
}

module.exports = {
  validateTargetUrl,
  sanitizeRequestHeaders,
  isProhibitedIP,
  isProhibitedIPv4,
  isProhibitedIPv6,
  DISALLOWED_HEADERS
};
