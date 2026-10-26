/**
 * PingCraft SSRF (Server-Side Request Forgery) Protection Engine
 *
 * Implements strict URL parsing, protocol whitelisting, IP range blacklisting
 * (loopback, private, link-local, multicast, cloud metadata, reserved),
 * DNS resolution validation, and header sanitization.
 */

const dns = require('dns');
const { URL } = require('url');

// Blocked private/reserved IPv4 CIDR blocks
const BLOCKED_IPV4_RANGES = [
  { start: ipToLong('0.0.0.0'), end: ipToLong('0.255.255.255') },       // Current network (RFC 1122)
  { start: ipToLong('10.0.0.0'), end: ipToLong('10.255.255.255') },     // Private Class A (RFC 1918)
  { start: ipToLong('100.64.0.0'), end: ipToLong('100.127.255.255') }, // Shared CGNAT (RFC 6598)
  { start: ipToLong('127.0.0.0'), end: ipToLong('127.255.255.255') },   // Loopback (RFC 1122)
  { start: ipToLong('169.254.0.0'), end: ipToLong('169.254.255.255') }, // Link-local / Cloud metadata (RFC 3927)
  { start: ipToLong('172.16.0.0'), end: ipToLong('172.31.255.255') },   // Private Class B (RFC 1918)
  { start: ipToLong('192.0.0.0'), end: ipToLong('192.0.0.255') },       // IETF Protocol assignments
  { start: ipToLong('192.0.2.0'), end: ipToLong('192.0.2.255') },       // TEST-NET-1 documentation
  { start: ipToLong('192.168.0.0'), end: ipToLong('192.168.255.255') }, // Private Class C (RFC 1918)
  { start: ipToLong('198.18.0.0'), end: ipToLong('198.19.255.255') },   // Benchmark testing
  { start: ipToLong('198.51.100.0'), end: ipToLong('198.51.100.255') }, // TEST-NET-2 documentation
  { start: ipToLong('203.0.113.0'), end: ipToLong('203.0.113.255') },   // TEST-NET-3 documentation
  { start: ipToLong('224.0.0.0'), end: ipToLong('239.255.255.255') },   // Multicast (RFC 5771)
  { start: ipToLong('240.0.0.0'), end: ipToLong('255.255.255.255') }    // Reserved (RFC 1112) / Broadcast
];

// Blocked hostnames (case-insensitive)
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'broadcasthost',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
  'metadata.aws'
]);

// Headers that users must never be allowed to spoof or override
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

/**
 * Checks if an IPv4 address is in any prohibited range.
 */
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

/**
 * Checks if an IPv6 address is prohibited (loopback, private ULA, link-local, multicast, or IPv4-mapped).
 */
function isProhibitedIPv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // IPv4-mapped IPv6 address (::ffff:127.0.0.1 or ::ffff:7f00:1)
  const ipv4MappedMatch = normalized.match(/^(?:::ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (ipv4MappedMatch) {
    return isProhibitedIPv4(ipv4MappedMatch[1]);
  }

  // Unique Local Address (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-Local (fe80::/10)
  if (/^fe[89ab]/i.test(normalized)) return true;
  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) return true;
  // Documentation (2001:db8::/32)
  if (normalized.startsWith('2001:db8:')) return true;

  return false;
}

/**
 * Validates whether an IP address is prohibited.
 */
function isProhibitedIP(ip) {
  if (net.isIPv4(ip)) return isProhibitedIPv4(ip);
  if (net.isIPv6(ip)) return isProhibitedIPv6(ip);
  return true;
}

const net = require('net');

/**
 * Validates a target URL against SSRF rules:
 * - Scheme must be http: or https:
 * - Hostname cannot be empty or in prohibited host list
 * - Port must be a standard valid integer
 * - Resolves DNS and ensures none of the target addresses resolve to private/loopback/cloud metadata IPs
 *
 * @param {string} rawUrl - The user-supplied target URL
 * @returns {Promise<{ valid: boolean, error?: string, parsedUrl?: URL, resolvedIps?: string[] }>}
 */
async function validateTargetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Target URL is required and must be a string' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl.trim());
  } catch (err) {
    return { valid: false, error: 'Malformed or invalid URL format' };
  }

  // 1. Protocol check
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { valid: false, error: `Invalid protocol '${parsedUrl.protocol}'. Only 'http:' and 'https:' are supported.` };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. Reject empty hostname
  if (!hostname) {
    return { valid: false, error: 'URL must contain a valid host' };
  }

  // 3. Reject prohibited hostnames
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, error: `Access to '${hostname}' is restricted for security (SSRF prevention).` };
  }

  // 4. If hostname is directly an IP address
  if (net.isIP(hostname)) {
    if (isProhibitedIP(hostname)) {
      return { valid: false, error: `Target IP '${hostname}' is in a private or restricted network range.` };
    }
    return { valid: true, parsedUrl, resolvedIps: [hostname] };
  }

  // 5. DNS Resolution check (prevent DNS rebinding & private IP resolution)
  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: `Could not resolve hostname '${hostname}'.` };
    }

    const resolvedIps = addresses.map(a => a.address);

    for (const addr of addresses) {
      if (isProhibitedIP(addr.address)) {
        return {
          valid: false,
          error: `Hostname '${hostname}' resolved to prohibited address '${addr.address}' (SSRF protection).`
        };
      }
    }

    return { valid: true, parsedUrl, resolvedIps };
  } catch (dnsErr) {
    return { valid: false, error: `DNS resolution failed for '${hostname}': ${dnsErr.message}` };
  }
}

/**
 * Sanitizes and validates user-provided HTTP headers.
 * Rejects disallowed transport/auth headers and enforces reasonable lengths.
 */
function sanitizeRequestHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof key !== 'string' || typeof value !== 'string') continue;
    const lowerKey = key.trim().toLowerCase();

    // Reject dangerous headers
    if (DISALLOWED_HEADERS.has(lowerKey)) continue;

    // Enforce reasonable key & value lengths
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
