import { describe, expect, it } from 'vitest';
import { pickText, unwrapApiPayload } from './gameApi';

describe('unwrapApiPayload', () => {
  it('래퍼가 success이면 data를 반환한다', () => {
    const out = unwrapApiPayload<{ x: number }>({
      success: true,
      data: { x: 1 },
      error: null,
      requestId: 'r1',
    });
    expect(out).toEqual({ x: 1 });
  });

  it('래퍼가 없으면 본문을 그대로 반환한다', () => {
    expect(unwrapApiPayload({ foo: 'bar' })).toEqual({ foo: 'bar' });
  });

  it('success가 false면 에러를 던진다', () => {
    expect(() =>
      unwrapApiPayload({
        success: false,
        data: null,
        error: { message: 'bad' },
        requestId: 'r2',
      }),
    ).toThrow('bad');
  });
});

describe('pickText', () => {
  it('중첩 경로에서 문자열을 꺼낸다', () => {
    const v = pickText({ response: { text: 'hello' } }, ['response.text', 'text']);
    expect(v).toBe('hello');
  });

  it('없으면 null', () => {
    expect(pickText({ a: 1 }, ['b'])).toBeNull();
  });
});
