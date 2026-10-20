import { test } from "node:test";
import assert from "node:assert/strict";
import { createEmailHandler } from "../api/photo-email.mjs";
const photo =
  "data:image/jpeg;base64," +
  Buffer.from([255, 216, 1, 2, 255, 217]).toString("base64");
const env = {
  MAIL_PROVIDER: "resend",
  RESEND_API_KEY: "test-key",
  PHOTO_EMAIL_FROM: "booth@example.com",
};
let ip = 0;
async function call(handler, body, options = {}) {
  const req = {
    method: "POST",
    headers: {
      origin: "http://localhost:5173",
      host: "localhost:5173",
      "content-type": "application/json",
    },
    body,
    socket: { remoteAddress: `test-${++ip}` },
    ...options,
  };
  const res = {
    setHeader() {},
    end(raw) {
      this.body = JSON.parse(raw);
    },
  };
  await handler(req, res);
  return res;
}
test("메일 설정이 없으면 성공으로 표시하지 않는다", async () => {
  const res = await call(createEmailHandler({ env: {} }), {
    email: "a@example.com",
    photo,
  });
  assert.equal(res.statusCode, 503);
});
test("주소·첨부파일·요청 출처를 검증하고 메일 서비스를 호출하지 않는다", async () => {
  const handler = createEmailHandler({
    env,
    fetchImpl: () => {
      throw new Error("호출하면 안 됨");
    },
  });
  assert.equal((await call(handler, { email: "bad", photo })).statusCode, 400);
  assert.equal(
    (
      await call(handler, {
        email: "a@example.com",
        photo: "data:image/jpeg;base64,YWJj",
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (await call(handler, {}, { headers: { origin: "bad" } })).statusCode,
    403,
  );
  assert.equal((await call(handler, {}, { method: "GET" })).statusCode, 405);
  assert.equal(
    (
      await call(
        handler,
        {},
        {
          headers: {
            origin: "http://localhost:5173",
            host: "localhost:5173",
            "content-type": "application/json",
            "content-length": 4000000,
          },
        },
      )
    ).statusCode,
    413,
  );
});
test("완성 사진을 첨부하고 같은 사진·주소의 재시도는 같은 중복 방지 키를 사용한다", async () => {
  const calls = [];
  const handler = createEmailHandler({
    env,
    fetchImpl: async (url, options) => {
      calls.push({ url, ...options });
      return { ok: true };
    },
  });
  for (let i = 0; i < 2; i++)
    assert.equal(
      (await call(handler, { email: "a@example.com", photo })).statusCode,
      200,
    );
  const payload = JSON.parse(calls[0].body);
  assert.deepEqual(payload.to, ["a@example.com"]);
  assert.equal(payload.attachments[0].content, photo.split(",")[1]);
  assert.equal(
    calls[0].headers["Idempotency-Key"],
    calls[1].headers["Idempotency-Key"],
  );
});
test("메일 서비스 오류와 네트워크 실패를 실패로 반환한다", async () => {
  for (const fetchImpl of [
    async () => ({ ok: false }),
    async () => {
      throw new Error("timeout");
    },
  ]) {
    assert.equal(
      (
        await call(createEmailHandler({ env, fetchImpl }), {
          email: "a@example.com",
          photo,
        })
      ).statusCode,
      502,
    );
  }
});
test("한 기기의 과도한 반복 요청을 제한한다", async () => {
  const handler = createEmailHandler({
    env,
    fetchImpl: async () => ({ ok: true }),
  });
  const options = { socket: { remoteAddress: "rate-test" } };
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await call(handler, { email: "a@example.com", photo }, options))
        .statusCode,
      200,
    );
  assert.equal(
    (await call(handler, { email: "a@example.com", photo }, options))
      .statusCode,
    429,
  );
});
