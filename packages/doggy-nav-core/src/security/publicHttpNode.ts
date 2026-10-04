// Import this submodule directly so Workers/browser bundles never load Node transports.
import { lookup } from 'node:dns';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { LookupFunction } from 'node:net';
import {
  isPublicIp,
  requestPublicHttp,
  UnsafePublicUrlError,
  type PublicHttpOptions,
  type PublicHttpTransport,
} from './publicHttp';

/** Check all DNS answers in the socket's lookup callback, avoiding a second DNS lookup. */
export function createPublicLookup(resolver: typeof lookup = lookup): LookupFunction {
  return (hostname, options, callback) => {
    resolver(hostname, { all: true }, (error, addresses) => {
      if (error) return callback(error, '', 4);
      if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) {
        return callback(new UnsafePublicUrlError(), '', 4);
      }
      const requestedFamily = typeof options === 'number' ? options : options.family;
      const compatible = requestedFamily
        ? addresses.filter(({ family }) => family === requestedFamily)
        : addresses;
      if (!compatible.length) return callback(new UnsafePublicUrlError(), '', 4);
      if (typeof options === 'object' && options.all) return callback(null, compatible);
      callback(null, compatible[0].address, compatible[0].family);
    });
  };
}

const nodeTransport: PublicHttpTransport = (url, options) =>
  new Promise((resolve, reject) => {
    const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
    // No proxy or pooled socket can bypass the checked lookup; retain hostname for TLS/SNI.
    const req = request(
      url,
      {
        method: options.method,
        headers: { ...options.headers, 'Accept-Encoding': 'identity' },
        lookup: createPublicLookup(),
        agent: false,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (options.method === 'HEAD' || [301, 302, 303, 307, 308].includes(status)) {
          res.destroy();
          resolve({ status, body: '', location: res.headers.location });
          return;
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > options.maxBytes) {
            req.destroy(new Error('Public HTTP response exceeds size limit'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ status, body: Buffer.concat(chunks).toString('utf8') }));
        res.on('error', reject);
      }
    );
    const timer = setTimeout(
      () => req.destroy(new Error('Public HTTP request timed out')),
      options.timeoutMs
    );
    req.on('close', () => clearTimeout(timer));
    req.on('error', reject);
    req.end();
  });

export function requestPublicHttpNode(url: string, options: PublicHttpOptions = {}) {
  return requestPublicHttp(url, nodeTransport, options);
}
