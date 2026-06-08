import { compareResponses } from '../../src/utils/responseComparator';

describe('responseComparator', () => {
  it('matches identical normalized text', () => {
    const primary = 'Hello World';
    const candidate = 'hello   world ';
    expect(compareResponses(primary, candidate)).toBe(true);
  });

  it('detects mismatched responses', () => {
    expect(compareResponses('hello', 'goodbye')).toBe(false);
  });
});
