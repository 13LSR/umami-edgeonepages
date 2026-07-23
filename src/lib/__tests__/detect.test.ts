import { getClientInfo } from '../detect';
import { getIpAddress } from '../ip';

const IP = '203.0.113.10';
const BAD_IP = '198.51.100.25';

afterEach(() => {
  delete process.env.CLIENT_IP_HEADER;
});

test('getIpAddress: EdgeOne header', () => {
  expect(getIpAddress(new Headers({ 'EO-Connecting-IP': IP }))).toEqual(IP);
});

test('getIpAddress: Custom EdgeOne header has highest priority', () => {
  process.env.CLIENT_IP_HEADER = 'EO-Connecting-IP';

  expect(
    getIpAddress(
      new Headers({
        'eo-connecting-ip': IP,
        'cf-connecting-ip': BAD_IP,
      }),
    ),
  ).toEqual(IP);
});

test.each([
  ['cf-connecting-ip', 'Cloudflare'],
  ['fastly-client-ip', 'Fastly'],
  ['x-nf-client-connection-ip', 'Netlify'],
])('getIpAddress: %s header (%s)', (header: string) => {
  expect(getIpAddress(new Headers({ [header]: IP }))).toEqual(IP);
});

test('getIpAddress: Existing provider header has priority over EdgeOne', () => {
  expect(
    getIpAddress(
      new Headers({
        'cf-connecting-ip': IP,
        'eo-connecting-ip': BAD_IP,
      }),
    ),
  ).toEqual(IP);
});

test('getIpAddress: EdgeOne has priority over generic proxy headers', () => {
  expect(
    getIpAddress(
      new Headers({
        'eo-connecting-ip': IP,
        'x-forwarded-for': BAD_IP,
      }),
    ),
  ).toEqual(IP);
});

test('getIpAddress: x-forwarded-for uses the first client address', () => {
  expect(getIpAddress(new Headers({ 'x-forwarded-for': `${IP}, ${BAD_IP}` }))).toEqual(IP);
});

test.each([
  ['203.0.113.10:443', '203.0.113.10'],
  ['2001:db8::1', '2001:db8::1'],
  ['[2001:db8::1]:443', '2001:db8::1'],
])('getIpAddress: normalizes %s', (value, expected) => {
  expect(getIpAddress(new Headers({ 'eo-connecting-ip': value }))).toEqual(expected);
});

test('getIpAddress: parses Forwarded header', () => {
  expect(
    getIpAddress(
      new Headers({ forwarded: 'for="[2001:db8::1]:443";proto=https, for=198.51.100.25' }),
    ),
  ).toEqual('2001:db8::1');
});

test('getIpAddress: Empty provider header falls back to the next header', () => {
  expect(
    getIpAddress(
      new Headers({
        'eo-connecting-ip': ' ',
        'x-forwarded-for': IP,
      }),
    ),
  ).toEqual(IP);
});

test('getIpAddress: No header', () => {
  expect(getIpAddress(new Headers())).toEqual(null);
});

test('getClientInfo: Payload IP does not override trusted headers', async () => {
  const request = new Request('https://example.com/api/send', {
    headers: {
      'eo-connecting-ip': '127.0.0.1',
      'user-agent': 'Mozilla/5.0',
    },
  });

  const result = await getClientInfo(request, { ip: BAD_IP });

  expect(result.ip).toEqual('127.0.0.1');
});
