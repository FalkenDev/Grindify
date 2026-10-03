/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { Strategy as GithubStrategy } from 'passport-github2';
import { CookieStateStore } from './cookieState.store';

/**
 * Exercises the real passport-oauth2 flow (as used by the GitHub and Google
 * strategies) with our session-less cookie state store.
 */
function makeStrategy() {
  const strategy: any = new GithubStrategy(
    {
      clientID: 'id',
      clientSecret: 'secret',
      callbackURL: 'http://localhost:1337/v1/auth/github/callback',
      scope: ['user:email'],
      state: true,
      store: new CookieStateStore('github'),
    } as any,
    (_a: string, _r: string, profile: any, done: any) => done(null, profile),
  );
  // Never talk to GitHub in tests
  strategy._oauth2.getOAuthAccessToken = (_code: string, _p: any, cb: any) =>
    cb(null, 'access-token', 'refresh-token', {});
  strategy.userProfile = (_token: string, done: any) =>
    done(null, { id: '42', emails: [] });
  return strategy;
}

function makeReqRes(
  query: Record<string, string>,
  cookies: Record<string, string> = {},
) {
  const res: any = {
    cookies: {} as Record<string, string>,
    cookie: jest.fn((name: string, value: string) => {
      res.cookies[name] = value;
    }),
    clearCookie: jest.fn(),
  };
  const req: any = { query, cookies, hostname: 'localhost', res, headers: {} };
  return { req, res };
}

function run(strategy: any, req: any): Promise<{ type: string; arg?: any }> {
  return new Promise((resolve) => {
    const s = Object.create(strategy);
    s.redirect = (url: string) => resolve({ type: 'redirect', arg: url });
    s.success = (user: any) => resolve({ type: 'success', arg: user });
    s.fail = (info: any) => resolve({ type: 'fail', arg: info });
    s.error = (err: any) => resolve({ type: 'error', arg: err });
    s.authenticate(req, {});
  });
}

describe('CookieStateStore with passport-oauth2', () => {
  it('sets a state cookie and puts the same state in the authorize URL', async () => {
    const { req, res } = makeReqRes({});
    const result = await run(makeStrategy(), req);
    expect(result.type).toBe('redirect');
    const state = new URL(result.arg).searchParams.get('state');
    expect(state).toBeTruthy();
    expect(res.cookies.oauth_state_github).toBe(state);
    expect(res.cookie.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
    });
  });

  it('accepts the callback when the state matches the cookie', async () => {
    const { req: initReq, res: initRes } = makeReqRes({});
    const init = await run(makeStrategy(), initReq);
    const state = new URL(init.arg).searchParams.get('state') as string;

    const { req } = makeReqRes(
      { code: 'abc', state },
      { oauth_state_github: initRes.cookies.oauth_state_github },
    );
    const result = await run(makeStrategy(), req);
    expect(result.type).toBe('success');
    expect(req.res.clearCookie).toHaveBeenCalled();
  });

  it('rejects the callback without the state cookie (login CSRF)', async () => {
    const { req } = makeReqRes({ code: 'abc', state: 'attacker-state' });
    const result = await run(makeStrategy(), req);
    expect(result.type).toBe('fail');
  });

  it('rejects the callback when the state does not match', async () => {
    const { req } = makeReqRes(
      { code: 'abc', state: 'other' },
      { oauth_state_github: 'expected-state-value' },
    );
    const result = await run(makeStrategy(), req);
    expect(result.type).toBe('fail');
  });
});
