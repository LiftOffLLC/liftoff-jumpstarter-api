/**
 * Get a random integer between `min` and `max`.
 *
 * @param {number} min - minimum number
 * @param {number} max - maximum number
 * @return {float} a random floating point number
 */
export default function getRandom(min, max) {
  const range = (max - min) + 1;
  return Math.floor((Math.random() * (range)) + min);
}
