import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDecisionSession, recordDecisionEvent, pauseDecisionSession,
  resumeDecisionSession, completeDecisionSession, abandonDecisionSession, hasDecisionTimedOut,
} from '../lib/decision-session.ts';
import { buildDecisionBehaviorStats, buildFoodStats } from '../lib/analytics.ts';
import { parseGoogleMapsInput, dishesFor } from '../lib/functional-data.ts';
import { DEMO_RESTAURANTS } from '../lib/product.ts';
import { matchesRestaurantSearch } from '../lib/recommendation.ts';
import { googlePlaceToRestaurant, placeDetailsFieldMask, placesFieldMask, placesWithinRadius } from '../lib/google-places.ts';

test('active clock pauses in background and abandoned time does not affect successful average', () => {
  let first = createDecisionSession('roulette', 1000);
  first = recordDecisionEvent(first, 'candidate_view', { candidateId: 'r1' }, 2000);
  first = pauseDecisionSession(first, 3000);
  assert.equal(first.activeMs, 2000);
  first = resumeDecisionSession(first, 123000);
  first = completeDecisionSession(first, { restaurantId: 'r1' }, 126000);
  assert.equal(first.activeMs, 5000);
  assert.equal(first.completedAt - first.startedAt, 125000);
  let second = createDecisionSession('nearby', 1000);
  second = abandonDecisionSession(second, 601000);
  const stats = buildDecisionBehaviorStats([first, second]);
  assert.equal(stats.averageActiveSeconds, 5);
  assert.equal(stats.abandonmentRate, 50);
  assert.equal(stats.firstChoiceAcceptanceRate, 100);
});

test('first-choice checks actual first candidate, skip and reroll', () => {
  let session = createDecisionSession('compare', 1000);
  session = recordDecisionEvent(session, 'candidate_view', { candidateId: 'r1' }, 1100);
  session = recordDecisionEvent(session, 'candidate_view', { candidateId: 'r2' }, 1200);
  session = recordDecisionEvent(session, 'skip_once', { candidateId: 'r1' }, 1300);
  session = completeDecisionSession(session, { restaurantId: 'r2' }, 1500);
  assert.equal(buildDecisionBehaviorStats([session]).firstChoiceAcceptanceRate, 0);
  assert.deepEqual(session.candidateIds, ['r1', 'r2']);
});

test('timeout requires active foreground and duplicate completion is inert', () => {
  const first = createDecisionSession('category', 1000);
  assert.equal(hasDecisionTimedOut(first, 1000 + 15 * 60 * 1000), true);
  assert.equal(hasDecisionTimedOut(pauseDecisionSession(first, 1500), 1000 + 60 * 60 * 1000), false);
  const completed = completeDecisionSession(first, { restaurantId: 'r1' }, 2000);
  assert.deepEqual(completeDecisionSession(completed, { restaurantId: 'r2' }, 3000), completed);
});

test('dish statistics count explicit dish choices, not restaurant-only picks', () => {
  const common = { cuisine: '日式', restaurantName: 'A', restaurantId: 'a', source: 'roulette' };
  const stats = buildFoodStats([
    { ...common, id: '1', createdAt: '2026-10-05', dishName: '拉麵', decisionSeconds: 5 },
    { ...common, id: '2', createdAt: '2026-10-05', dishName: '拉麵', decisionSeconds: 10 },
    { ...common, id: '3', createdAt: '2026-10-05', decisionSeconds: 20 },
  ]);
  assert.deepEqual(stats.dishCounts, [{ label: '拉麵', value: 2 }]);
  assert.equal(stats.topRestaurant, 'A');
});

test('Maps parser rejects arbitrary links and does not infer Place ID from a short URL', () => {
  assert.deepEqual(parseGoogleMapsInput('https://maps.app.goo.gl/abc'), { kind: 'shortLink', value: 'https://maps.app.goo.gl/abc' });
  assert.equal(parseGoogleMapsInput('https://evil.example/?q=A').kind, 'unsupported');
  assert.deepEqual(parseGoogleMapsInput('https://www.google.com/maps/search/?api=1&query=Foo&query_place_id=ChIJ12345678'), { kind: 'placeId', value: 'ChIJ12345678' });
});

test('Demo dish price remains explicitly sourced as Demo', () => {
  const dishes = dishesFor(DEMO_RESTAURANTS[0]);
  assert.ok(dishes.length > 0);
  assert.equal(dishes[0].source, 'demo');
  assert.equal(dishes[0].restaurantId, DEMO_RESTAURANTS[0].id);
});

test('natural food search combines cuisine, context, budget and late-night intent', () => {
  const curry = DEMO_RESTAURANTS.find((restaurant) => restaurant.name === '慢慢咖哩');
  const skewers = DEMO_RESTAURANTS.find((restaurant) => restaurant.name === '夜町串燒');
  const noodles = DEMO_RESTAURANTS.find((restaurant) => restaurant.name === '老張牛肉麵');
  assert.ok(curry && skewers && noodles);
  assert.equal(matchesRestaurantSearch(curry, '咖哩 一個人 300 元內'), true);
  assert.equal(matchesRestaurantSearch(curry, '約會 150 元內'), false);
  assert.equal(matchesRestaurantSearch(skewers, '日式 宵夜 約會 1000元內'), true);
  assert.equal(matchesRestaurantSearch(noodles, '宵夜'), false);
});

test('Google Places mapping preserves real fields without inventing menu data', () => {
  const restaurant = googlePlaceToRestaurant({
    id: 'ChIJ-real-place',
    displayName: { text: '真實餐廳' },
    formattedAddress: '台北市中正區測試路 1 號',
    location: { latitude: 25.0478, longitude: 121.517 },
    rating: 4.6,
    userRatingCount: 321,
    priceLevel: 'PRICE_LEVEL_MODERATE',
    googleMapsUri: 'https://maps.google.com/?cid=1',
    primaryTypeDisplayName: { text: '日本料理' },
  }, { lat: 25.047, lng: 121.517 });
  assert.ok(restaurant);
  assert.equal(restaurant.source, 'google');
  assert.equal(restaurant.sourceLabel, 'Google Places');
  assert.equal(restaurant.priceLevelLabel, '$$');
  assert.ok(restaurant.distance > 0);
  assert.equal(restaurant.walk, 0);
  assert.deepEqual(restaurant.menuItems, []);
  assert.deepEqual(restaurant.signature, []);
});

test('Pro mask excludes Enterprise billing fields, and radius rejects text-search spillover', () => {
  const pro = placesFieldMask(false);
  for (const field of ['rating', 'userRatingCount', 'priceLevel', 'currentOpeningHours']) {
    assert.equal(pro.includes(field), false);
    assert.equal(placesFieldMask(true).includes(field), true);
  }
  assert.equal(placeDetailsFieldMask(false).includes('places.'), false);
  const places = [
    { id: 'near', location: { latitude: 25.0478, longitude: 121.517 } },
    { id: 'far', location: { latitude: 25.10, longitude: 121.517 } },
    { id: 'missing' },
  ];
  assert.deepEqual(placesWithinRadius(places, { lat: 25.047, lng: 121.517 }, 1000).map((place) => place.id), ['near']);
});

test('budget intent excludes live places when Google has no reliable numeric spend', () => {
  const restaurant = googlePlaceToRestaurant({ id: 'x', displayName: { text: '未知價位店' } });
  assert.ok(restaurant);
  assert.equal(matchesRestaurantSearch(restaurant, '每人 300 元內'), false);
});
