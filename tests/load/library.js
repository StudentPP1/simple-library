// Навантажувальний тест Simple Library (k6): NFR-3 (200+ одночасних користувачів) і NFR-5 (відповідь < 1 с).
//
// Кожен віртуальний користувач (VU) імітує сесію читача: вхід -> каталог -> пошук -> фільтр -> деталі книги ->
// бронювання -> кабінет -> скасування броні, з паузами «на подумати» між діями.
//
// Запуск (див. tests/load/README.md):
//   docker run --rm -i -v "$PWD/tests/load:/scripts" -e BASE_URL=http://host.docker.internal:5000/api \
//     -e LIBRARIAN_CODE=... grafana/k6:2.3.0 run /scripts/library.js
import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';
const LIBRARIAN_CODE = __ENV.LIBRARIAN_CODE;
const VUS = parseInt(__ENV.VUS || '200', 10);
const HOLD = __ENV.HOLD || '3m';
const THINK = parseFloat(__ENV.THINK || '1'); // множник пауз; 0 = без пауз (стрес-тест)
const LOAD_BOOKS = 20;
const SEARCH_TERMS = ['гаррі', 'кобзар', 'роман', 'Шевченко', 'війна', 'код', 'світ', 'архітектура'];

const reservationConflicts = new Rate('reservation_conflicts');
const loginsTotal = new Counter('logins_total');

export const options = {
  setupTimeout: '5m',
  scenarios: {
    readers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: VUS }, // плавно виходимо на 200 користувачів
        { duration: HOLD, target: VUS },  // тримаємо навантаження
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // NFR-3: без деградації — менше 1 % невдалих запитів і всі перевірки відповіді проходять
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    // NFR-5: пошук і зміна статусу книги — не більше 1 с (95-й перцентиль)
    'http_req_duration{nfr5:search}': ['p(95)<1000'],
    'http_req_duration{nfr5:status}': ['p(95)<1000'],
    http_req_duration: ['p(95)<1000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const json = { headers: { 'Content-Type': 'application/json' } };
const auth = (token) => ({ headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
const think = (min, max) => THINK > 0 && sleep((min + Math.random() * (max - min)) * THINK);

function post(path, body, params) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), params);
}

// Підготовка даних: бібліотекар, книги з великою кількістю примірників і по одному читачу на VU
export function setup() {
  if (!LIBRARIAN_CODE) fail('Задайте LIBRARIAN_CODE (= LIBRARIAN_INVITE_CODE з .env)');
  const run = Date.now().toString(36);
  const password = `Load-${run}-Passw0rd`;

  const librarianEmail = `load.lib.${run}@test.local`;
  const reg = post('/auth/register', { fullName: 'Load Librarian', email: librarianEmail, password, librarianSecretCode: LIBRARIAN_CODE }, json);
  if (reg.status !== 200) fail(`Не вдалося зареєструвати бібліотекаря: ${reg.status} ${reg.body}`);
  const librarianToken = post('/auth/login', { email: librarianEmail, password }, json).json('data');

  const bookIds = [];
  for (let i = 1; i <= LOAD_BOOKS; i++) {
    const res = post('/books', {
      title: `Навантажувальний тест ${run} #${i}`, author: 'k6', genre: 'Навантаження', isbn: `978-${run}-${i}`,
      publicationYear: 2024, copiesCount: 100,
    }, auth(librarianToken));
    if (res.status !== 201) fail(`Не вдалося створити книгу: ${res.status} ${res.body}`);
    bookIds.push(res.json('data.id'));
  }

  // Реєстрація пачками паралельно (bcrypt повільний за задумом)
  const readers = [];
  for (let start = 0; start < VUS; start += 25) {
    const batch = [];
    for (let i = start; i < Math.min(start + 25, VUS); i++) {
      const email = `load.reader.${run}.${i}@test.local`;
      readers.push(email);
      batch.push(['POST', `${BASE_URL}/auth/register`, JSON.stringify({ fullName: `Load Reader ${i}`, email, password }), json]);
    }
    http.batch(batch).forEach((r) => { if (r.status !== 200) fail(`Реєстрація читача: ${r.status} ${r.body}`); });
  }

  return { readers, password, bookIds };
}

export default function (data) {
  const email = data.readers[(__VU - 1) % data.readers.length];

  // 1. Вхід (один на сесію, як у реальному житті)
  const login = post('/auth/login', { email, password: data.password }, Object.assign({ tags: { name: 'login' } }, json));
  loginsTotal.add(1);
  if (!check(login, { 'login 200': (r) => r.status === 200 })) return;
  const token = login.json('data');
  think(1, 2);

  group('Каталог', () => {
    const page = 1 + Math.floor(Math.random() * 4);
    const res = http.get(`${BASE_URL}/books?pageNumber=${page}&pageSize=10`, { tags: { name: 'catalog' } });
    check(res, { 'catalog 200': (r) => r.status === 200 });
    think(1, 3);

    // Так каталог завантажує фронтенд (усі книги однією сторінкою)
    const full = http.get(`${BASE_URL}/books?pageSize=100`, { tags: { name: 'catalog_100' } });
    check(full, { 'catalog_100 200': (r) => r.status === 200 });
    think(1, 2);
  });

  group('Пошук і фільтр', () => {
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    const search = http.get(`${BASE_URL}/books?search=${encodeURIComponent(term)}&pageSize=10`,
      { tags: { name: 'search', nfr5: 'search' } });
    check(search, { 'search 200': (r) => r.status === 200 });
    think(1, 2);

    const genre = http.get(`${BASE_URL}/books?genre=${encodeURIComponent('Навантаження')}&pageSize=10`,
      { tags: { name: 'genre', nfr5: 'search' } });
    check(genre, { 'genre 200': (r) => r.status === 200 });
    think(1, 2);
  });

  const bookId = data.bookIds[Math.floor(Math.random() * data.bookIds.length)];
  const details = http.get(`${BASE_URL}/books/${bookId}`, { tags: { name: 'book_details' } });
  check(details, { 'details 200': (r) => r.status === 200 });
  think(1, 3);

  group('Бронювання', () => {
    // 409 тут — очікувана бізнес-відповідь (усі примірники зайняті / ліміт), а не збій сервера
    const reserve = post('/loans/reserve', { bookId }, Object.assign(
      { tags: { name: 'reserve', nfr5: 'status' }, responseCallback: http.expectedStatuses(201, 409) }, auth(token)));
    check(reserve, { 'reserve 201/409': (r) => r.status === 201 || r.status === 409 });
    reservationConflicts.add(reserve.status === 409);
    think(1, 2);

    const my = http.get(`${BASE_URL}/loans/my`, Object.assign({ tags: { name: 'my_loans' } }, auth(token)));
    check(my, { 'my loans 200': (r) => r.status === 200 });
    think(1, 2);

    if (reserve.status === 201) {
      const cancel = post(`/loans/${reserve.json('data.id')}/cancel`, null, Object.assign(
        { tags: { name: 'cancel', nfr5: 'status' } }, auth(token)));
      check(cancel, { 'cancel 200': (r) => r.status === 200 });
    }
  });

  think(2, 4);
}
