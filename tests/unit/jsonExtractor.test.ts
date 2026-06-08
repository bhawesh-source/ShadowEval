import { extractPrompt, extractMetadata } from '../../src/utils/jsonExtractor';

describe('jsonExtractor', () => {
  it('extracts trimmed prompt text', () => {
    const request = { requestId: '1', prompt: '  hello world  ', metadata: { user: 'test' } };
    expect(extractPrompt(request)).toBe('hello world');
  });

  it('returns empty metadata when missing', () => {
    const request = { requestId: '1', prompt: 'hello world' };
    expect(extractMetadata(request)).toEqual({});
  });
});
