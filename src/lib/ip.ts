import ipaddr from 'ipaddr.js';

export const IP_ADDRESS_HEADERS = [
  'true-client-ip', // CDN
  'cf-connecting-ip', // Cloudflare
  'fastly-client-ip', // Fastly
  'x-nf-client-connection-ip', // Netlify
  'do-connecting-ip', // Digital Ocean
  'eo-connecting-ip',
  'x-real-ip', // Reverse proxy
  'x-appengine-user-ip', // Google App Engine
  'x-forwarded-for',
  'forwarded',
  'x-client-ip',
  'x-cluster-client-ip',
  'x-forwarded',
];

export function getIpAddress(headers: Headers) {
  const customHeader = process.env.CLIENT_IP_HEADER;

  if (customHeader) {
    const ip = parseHeaderValue(headers.get(customHeader), customHeader);

    if (ip) {
      return ip;
    }
  }

  for (const header of IP_ADDRESS_HEADERS) {
    const ip = parseHeaderValue(headers.get(header), header);

    if (ip) {
      return ip;
    }
  }

  return null;
}

function parseHeaderValue(value: string | null, header: string) {
  if (!value?.trim()) {
    return null;
  }

  let candidate = value.split(',')[0].trim();

  if (header.toLowerCase() === 'forwarded') {
    const match = candidate.match(/(?:^|;)\s*for=(?:"([^"]+)"|([^;]+))/i);

    if (!match) {
      return null;
    }

    candidate = (match[1] || match[2]).trim();
  }

  candidate = candidate.replace(/^"|"$/g, '').trim();

  const ip = stripPort(candidate);

  return ip && ipaddr.isValid(ip) ? ip : null;
}

export function stripPort(ip: string) {
  const value = ip?.trim();

  if (!value) {
    return value;
  }

  if (value.startsWith('[')) {
    const endBracket = value.indexOf(']');

    if (endBracket !== -1) {
      return value.slice(1, endBracket);
    }
  }

  const ipv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):(\d+)$/);

  if (ipv4WithPort) {
    return ipv4WithPort[1];
  }

  return value;
}
