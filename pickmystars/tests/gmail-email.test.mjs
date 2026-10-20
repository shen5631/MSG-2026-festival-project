import { test } from "node:test";
import assert from "node:assert/strict";
import { createEmailHandler } from "../api/photo-email.mjs";
import { createNetlifyEmailHandler } from "../netlify/functions/photo-email.mjs";
const env = {
  GMAIL_USER: "sender@gmail.com",
  GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop",
  RESEND_API_KEY: "old-key",
  PHOTO_EMAIL_FROM: "onboarding@resend.dev",
};
const photo =
  "data:image/jpeg;base64," +
  Buffer.from([255, 216, 1, 2, 255, 217]).toString("base64");
let serial = 0;
async function call(options, body = { email: "visitor@example.com", photo }) {
  const handler = createEmailHandler(options);
  const req = {
    method: "POST",
    headers: {
      origin: "http://localhost:5173",
      host: "localhost:5173",
      "content-type": "application/json",
    },
    body,
    socket: { remoteAddress: `gmail-${++serial}` },
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
test("Gmail 기본 모드는 과거 Resend 설정이 남아도 Gmail을 사용하고 JPEG를 첨부한다", async () => {
  let config,
    mail,
    closed = false;
  const res = await call({
    env,
    fetchImpl: () => assert.fail("Resend 호출 금지"),
    createTransportImpl: async (options) => {
      config = options;
      return {
        sendMail: async (payload) => {
          mail = payload;
          return { accepted: ["visitor@example.com"], rejected: [] };
        },
        close() {
          closed = true;
        },
      };
    },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(config.service, "gmail");
  assert.equal(config.auth.pass, "abcdefghijklmnop");
  assert.equal(mail.from.address, "sender@gmail.com");
  assert.equal(mail.to, "visitor@example.com");
  assert.ok(Buffer.isBuffer(mail.attachments[0].content));
  assert.equal(mail.disableFileAccess, true);
  assert.equal(closed, true);
});
test("Gmail 설정 누락과 유효하지 않은 주소는 실제 전송하지 않는다", async () => {
  assert.equal(
    (await call({ env: { RESEND_API_KEY: "old", PHOTO_EMAIL_FROM: "old" } }))
      .statusCode,
    503,
  );
  assert.equal(
    (
      await call(
        { env, createTransportImpl: () => assert.fail("전송 금지") },
        { email: "bad", photo },
      )
    ).statusCode,
    400,
  );
});
test("Gmail 인증 실패·수신 거절·네트워크 실패를 성공으로 표시하지 않는다", async () => {
  for (const [code, status] of [
    ["EAUTH", 503],
    ["EENVELOPE", 502],
    ["ETIMEDOUT", 502],
  ]) {
    const res = await call({
      env,
      createTransportImpl: async () => ({
        sendMail: async () => {
          throw Object.assign(new Error("secret raw provider text"), { code });
        },
        close() {},
      }),
    });
    assert.equal(res.statusCode, status);
    assert.ok(!res.body.message.includes("secret raw"));
  }
  const res = await call({
    env,
    createTransportImpl: async () => ({
      sendMail: async () => ({
        accepted: [],
        rejected: ["visitor@example.com"],
      }),
      close() {},
    }),
  });
  assert.equal(res.statusCode, 502);
});
test("Netlify에서도 동일한 Gmail 발송 함수를 사용한다", async () => {
  let called = false;
  const handler = createNetlifyEmailHandler({
    env,
    createTransportImpl: async () => ({
      sendMail: async () => {
        called = true;
        return { accepted: ["visitor@example.com"] };
      },
      close() {},
    }),
  });
  const response = await handler(
    new Request("https://example.netlify.app/api/photo-email", {
      method: "POST",
      headers: {
        origin: "https://example.netlify.app",
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "visitor@example.com", photo }),
    }),
    { ip: "gmail-netlify" },
  );
  assert.equal(response.status, 200);
  assert.equal(called, true);
});
