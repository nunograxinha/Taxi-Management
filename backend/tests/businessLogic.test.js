const test = require('node:test');
const assert = require('node:assert/strict');

const { sanitizeCoords, sanitizeFavoritePlaces } = require('../services/clientService');
const { buildChatMessage } = require('../socket');
const { Trip } = require('../models/trip');
const { Driver } = require('../models/driver');
const { recalculateDriverRating, rateTrip } = require('../services/tripService');

function createFindByIdStub(doc) {
  const query = {
    populate() {
      return query;
    },
    then(resolve, reject) {
      return Promise.resolve(doc).then(resolve, reject);
    }
  };
  return query;
}

test('sanitizeCoords validates and normalizes coordinate strings', () => {
  assert.equal(sanitizeCoords('38.5714, -7.9135'), '38.5714,-7.9135');
  assert.equal(sanitizeCoords(' -90 , 180 '), '-90,180');
  assert.equal(sanitizeCoords('91,0'), null);
  assert.equal(sanitizeCoords('0,-181'), null);
  assert.equal(sanitizeCoords('not,coords'), null);
  assert.equal(sanitizeCoords(null), null);
});

test('sanitizeFavoritePlaces validates, truncates, and caps at 10 items', () => {
  assert.throws(
    () => sanitizeFavoritePlaces('not-an-array'),
    (err) => err.statusCode === 400
  );

  assert.throws(
    () => sanitizeFavoritePlaces([{ label: '', address: 'Rua X', coords: '38.5,-7.9' }]),
    (err) => err.statusCode === 400
  );

  assert.throws(
    () => sanitizeFavoritePlaces([{ label: 'Home', address: 'Rua X', coords: '999,0' }]),
    (err) => err.statusCode === 400
  );

  const manyPlaces = Array.from({ length: 12 }, (_, i) => ({
    label: `  ${'A'.repeat(50)}_${i} `,
    address: ` ${'B'.repeat(210)}_${i} `,
    coords: '38.5714 , -7.9135',
    icon: i === 0 ? 'home' : 'unknown-icon'
  }));

  const sanitized = sanitizeFavoritePlaces(manyPlaces);
  assert.equal(sanitized.length, 10);
  assert.equal(sanitized[0].icon, 'home');
  assert.equal(sanitized[1].icon, 'star');
  assert.equal(sanitized[0].label.length, 40);
  assert.equal(sanitized[0].address.length, 200);
  assert.equal(sanitized[0].coords, '38.5714,-7.9135');
});

test('buildChatMessage validates roles, defaults sender name, and truncates long values', () => {
  assert.equal(buildChatMessage(null), null);
  assert.equal(buildChatMessage({ pedidoId: 'p1', senderRole: 'manager', text: 'hi' }), null);
  assert.equal(buildChatMessage({ pedidoId: '', senderRole: 'client', text: 'hi' }), null);
  assert.equal(buildChatMessage({ pedidoId: 'p1', senderRole: 'client', text: '   ' }), null);

  const longText = 'x'.repeat(350);
  const longName = 'n'.repeat(100);
  const msg = buildChatMessage({
    pedidoId: 12345,
    senderRole: 'driver',
    senderName: longName,
    text: `  ${longText}  `
  });

  assert.equal(msg.pedidoId, '12345');
  assert.equal(msg.senderRole, 'driver');
  assert.equal(msg.senderName.length, 80);
  assert.equal(msg.text.length, 300);
  assert.ok(typeof msg.id === 'string' && msg.id.length > 0);
  assert.ok(!Number.isNaN(Date.parse(msg.timestamp)));

  const defaultNameMsg = buildChatMessage({
    pedidoId: 'ride-1',
    senderRole: 'client',
    senderName: '   ',
    text: 'On my way'
  });
  assert.equal(defaultNameMsg.senderName, 'Client');
  assert.equal(defaultNameMsg.text, 'On my way');
});

test('recalculateDriverRating computes rounded average and handles empty ratings', async () => {
  const originalTripFind = Trip.find;
  const originalDriverUpdate = Driver.findByIdAndUpdate;
  let updatedPayload = null;

  try {
    assert.deepEqual(await recalculateDriverRating(null), { ratingAverage: 0, ratingCount: 0 });

    Trip.find = () => ({
      select: async () => [{ rating: 5 }, { rating: 5 }, { rating: 4 }]
    });
    Driver.findByIdAndUpdate = async (_id, payload) => {
      updatedPayload = payload;
    };

    const stats = await recalculateDriverRating('driver-1');
    assert.deepEqual(stats, { ratingAverage: 4.7, ratingCount: 3 });
    assert.deepEqual(updatedPayload, { ratingAverage: 4.7, ratingCount: 3 });

    Trip.find = () => ({
      select: async () => []
    });
    const emptyStats = await recalculateDriverRating('driver-1');
    assert.deepEqual(emptyStats, { ratingAverage: 0, ratingCount: 0 });
  } finally {
    Trip.find = originalTripFind;
    Driver.findByIdAndUpdate = originalDriverUpdate;
  }
});

test('rateTrip enforces rating range, ownership, comment length, and updates stats', async () => {
  const originalTripFindById = Trip.findById;
  const originalTripFind = Trip.find;
  const originalDriverUpdate = Driver.findByIdAndUpdate;

  try {
    for (const badRating of [0, 6, 4.5, 'abc']) {
      await assert.rejects(
        () => rateTrip('trip-1', badRating, 'ok', { role: 'client', clientId: 'c1' }),
        (err) => err.statusCode === 400
      );
    }

    const tripDoc = {
      _id: 'trip-1',
      client: 'client-owner',
      driver: 'driver-1',
      rating: null,
      ratingComment: '',
      async save() {
        return this;
      }
    };

    Trip.findById = () => createFindByIdStub(tripDoc);
    Trip.find = () => ({
      select: async () => [{ rating: tripDoc.rating }]
    });
    Driver.findByIdAndUpdate = async () => {};

    await assert.rejects(
      () => rateTrip('trip-1', 5, 'Nice', { role: 'client', clientId: 'other-client' }),
      (err) => err.statusCode === 403
    );

    const commentOverLimit = 'Great driver! ' + 'z'.repeat(550);
    const result = await rateTrip('trip-1', 5, `  ${commentOverLimit}  `, {
      role: 'client',
      clientId: 'client-owner'
    });

    assert.equal(tripDoc.rating, 5);
    assert.equal(tripDoc.ratingComment.length, 500);
    assert.equal(result.ratingAverage, 5);
    assert.equal(result.ratingCount, 1);
    assert.equal(result.trip, tripDoc);
  } finally {
    Trip.findById = originalTripFindById;
    Trip.find = originalTripFind;
    Driver.findByIdAndUpdate = originalDriverUpdate;
  }
});
