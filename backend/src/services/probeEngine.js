const { performance } = require('perf_hooks');
const { validateTargetUrl, sanitizeRequestHeaders } = require('../utils/ssrfValidator');

const MAX_RESPONSE_BYTES = 1024 * 1024;

function categorizeError(err) {
  const code = err.code || err.cause?.code || '';
  const message = (err.message || '').toLowerCase();

  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return { category: 'DNS_ERROR', message: `DNS resolution failed: ${code}` };
  }
  if (code === 'ECONNREFUSED') {
    return { category: 'CONNECTION_ERROR', message: 'Connection refused by target host' };
  }
  if (code === 'ECONNRESET' || code === 'EPIPE') {
    return { category: 'CONNECTION_ERROR', message: `Connection reset: ${code}` };
  }
  if (code === 'EHOSTUNREACH' || code === 'ENETUNREACH') {
    return { category: 'CONNECTION_ERROR', message: `Host unreachable: ${code}` };
  }
  if (err.name === 'AbortError' || code === 'ABORT_ERR' || message.includes('timeout') || message.includes('aborted')) {
    return { category: 'TIMEOUT', message: 'Request exceeded timeout limit' };
  }
  if (code.startsWith('ERR_TLS_') || code.includes('CERT') || message.includes('certificate') || message.includes('tls')) {
    return { category: 'TLS_ERROR', message: `TLS handshake failure: ${code || err.message}` };
  }
  if (message.includes('response body size exceeded')) {
    return { category: 'PAYLOAD_ERROR', message: 'Response payload exceeded size limit (1MB)' };
  }

  return { category: 'UNKNOWN', message: err.message || 'Unknown network error' };
}

async function executeProbe(options) {
  const {
    url,
    method = 'GET',
    headers = {},
    body = null,
    expectedStatusCode = 200,
    timeoutMs = 10000
  } = options;

  const ssrfCheck = await validateTargetUrl(url);
  if (!ssrfCheck.valid) {
    return {
      success: false,
      statusCode: null,
      latencyMs: 0,
      errorCategory: 'SSRF_BLOCKED',
      errorMessage: ssrfCheck.error,
      responseSize: 0
    };
  }

  const sanitizedHeaders = sanitizeRequestHeaders(headers);
  sanitizedHeaders['User-Agent'] = 'PingCraft-Synthetic-Monitor/1.0';
  sanitizedHeaders['Accept'] = '*/*';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Request timeout reached'));
  }, Math.min(timeoutMs, 30000));

  const startMark = performance.now();
  let latencyMs = 0;
  let responseSize = 0;

  try {
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: sanitizedHeaders,
      signal: controller.signal,
      redirect: 'manual'
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = String(body);
      if (!sanitizedHeaders['Content-Type']) {
        sanitizedHeaders['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, fetchOptions);
    const endMark = performance.now();
    latencyMs = Math.round((endMark - startMark) * 100) / 100;

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        responseSize += value.length;
        if (responseSize > MAX_RESPONSE_BYTES) {
          controller.abort(new Error('Response body size exceeded 1MB limit'));
          break;
        }
      }
    }

    clearTimeout(timeoutId);

    const isExpected = response.status === expectedStatusCode;
    if (isExpected) {
      return {
        success: true,
        statusCode: response.status,
        latencyMs,
        errorCategory: 'NONE',
        errorMessage: null,
        responseSize
      };
    } else {
      return {
        success: false,
        statusCode: response.status,
        latencyMs,
        errorCategory: 'HTTP_ERROR',
        errorMessage: `Unexpected HTTP status ${response.status} (expected ${expectedStatusCode})`,
        responseSize
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const endMark = performance.now();
    latencyMs = Math.round((endMark - startMark) * 100) / 100;

    const { category, message } = categorizeError(err);
    return {
      success: false,
      statusCode: null,
      latencyMs,
      errorCategory: category,
      errorMessage: message,
      responseSize
    };
  }
}

module.exports = {
  executeProbe,
  categorizeError
};
