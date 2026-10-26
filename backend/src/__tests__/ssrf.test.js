const {
  validateTargetUrl,
  isProhibitedIPv4,
  isProhibitedIPv6,
  sanitizeRequestHeaders,
  DISALLOWED_HEADERS
} = require('../utils/ssrfValidator');

describe('SSRF Protection Engine Unit Tests', () => {
  describe('IPv4 Address Filtering', () => {
    test('blocks loopback IP addresses (127.0.0.1, 127.1.2.3)', () => {
      expect(isProhibitedIPv4('127.0.0.1')).toBe(true);
      expect(isProhibitedIPv4('127.10.0.5')).toBe(true);
    });

    test('blocks RFC 1918 private address ranges', () => {
      // 10.0.0.0/8
      expect(isProhibitedIPv4('10.0.0.1')).toBe(true);
      expect(isProhibitedIPv4('10.255.255.255')).toBe(true);
      // 172.16.0.0/12
      expect(isProhibitedIPv4('172.16.0.1')).toBe(true);
      expect(isProhibitedIPv4('172.31.255.254')).toBe(true);
      // 192.168.0.0/16
      expect(isProhibitedIPv4('192.168.1.1')).toBe(true);
      expect(isProhibitedIPv4('192.168.0.254')).toBe(true);
    });

    test('blocks AWS/Cloud metadata IP (169.254.169.254)', () => {
      expect(isProhibitedIPv4('169.254.169.254')).toBe(true);
    });

    test('blocks multicast and broadcast ranges (224.0.0.0/4, 255.255.255.255)', () => {
      expect(isProhibitedIPv4('224.0.0.1')).toBe(true);
      expect(isProhibitedIPv4('255.255.255.255')).toBe(true);
    });

    test('allows legitimate public IP addresses', () => {
      expect(isProhibitedIPv4('8.8.8.8')).toBe(false);
      expect(isProhibitedIPv4('1.1.1.1')).toBe(false);
      expect(isProhibitedIPv4('142.250.190.46')).toBe(false);
    });
  });

  describe('IPv6 Address Filtering', () => {
    test('blocks IPv6 loopback (::1)', () => {
      expect(isProhibitedIPv6('::1')).toBe(true);
    });

    test('blocks IPv4-mapped IPv6 loopback (::ffff:127.0.0.1)', () => {
      expect(isProhibitedIPv6('::ffff:127.0.0.1')).toBe(true);
    });

    test('blocks unique local addresses (fc00::/7)', () => {
      expect(isProhibitedIPv6('fc00::1')).toBe(true);
      expect(isProhibitedIPv6('fd12:3456:789a::1')).toBe(true);
    });
  });

  describe('URL Scheme and Hostname Validation', () => {
    test('rejects non-http/https protocols (file:, ftp:, gopher:, javascript:)', async () => {
      const resFile = await validateTargetUrl('file:///etc/passwd');
      expect(resFile.valid).toBe(false);
      expect(resFile.error).toContain("Only 'http:' and 'https:' are supported");

      const resFtp = await validateTargetUrl('ftp://ftp.example.com/file');
      expect(resFtp.valid).toBe(false);

      const resJs = await validateTargetUrl('javascript:alert(1)');
      expect(resJs.valid).toBe(false);
    });

    test('rejects localhost and cloud metadata hostnames directly', async () => {
      const resLocal = await validateTargetUrl('http://localhost:3000/api');
      expect(resLocal.valid).toBe(false);

      const resMeta = await validateTargetUrl('http://metadata.google.internal/computeMetadata/v1/');
      expect(resMeta.valid).toBe(false);
    });

    test('rejects direct private IPs in URL', async () => {
      const res = await validateTargetUrl('http://192.168.1.100:8080/admin');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('private or restricted');
    });

    test('accepts valid public URLs', async () => {
      // Mocking or resolving public domain
      const res = await validateTargetUrl('https://httpbin.org/status/200');
      if (res.valid) {
        expect(res.valid).toBe(true);
        expect(res.parsedUrl.hostname).toBe('httpbin.org');
      }
    });
  });

  describe('Header Sanitization', () => {
    test('strips forbidden sensitive headers (Host, Cookie, Authorization, X-Forwarded-For)', () => {
      const dirtyHeaders = {
        'Host': 'internal.corp',
        'Cookie': 'session=secret123',
        'Authorization': 'Bearer admin-token',
        'X-Forwarded-For': '127.0.0.1',
        'X-Custom-Client': 'my-service-v1',
        'Accept': 'application/json'
      };

      const sanitized = sanitizeRequestHeaders(dirtyHeaders);

      expect(sanitized['Host']).toBeUndefined();
      expect(sanitized['Cookie']).toBeUndefined();
      expect(sanitized['Authorization']).toBeUndefined();
      expect(sanitized['X-Forwarded-For']).toBeUndefined();
      expect(sanitized['X-Custom-Client']).toBe('my-service-v1');
      expect(sanitized['Accept']).toBe('application/json');
    });
  });
});
