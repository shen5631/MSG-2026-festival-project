import { test } from "node:test";
import assert from "node:assert/strict";
import {
  config,
  createNetlifyEmailHandler,
} from "../netlify/functions/photo-email.mjs";

const photo =
  "data:image/jpeg;base64," +
  Buffer.from([255, 216, 1, 2, 255, 217]).toString("base64");
const env = {
  MAIL_PROVIDER: "resend",
  RESEND_API_KEY: "test-key",
  PHOTO_EMAIL_FROM: "booth@example.com",
};
function request(body, origin = "https://booth.netlify.app") {
  return new Request("https://booth.netlify.app/api/photo-email", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("Netlify 요청 스트림을 읽고 사진을 첨부한 JSON 응답을 반환한다", async () => {
  let payload;
  const handler = createNetlifyEmailHandler({
    env,
    fetchImpl: async (_, options) => {
      payload = JSON.parse(options.body);
      return { ok: true };
    },
  });
  const response = await handler(request({ email: "a@example.com", photo }), {
    ip: "netlify-success",
  });
  assert.equal(config.path, "/api/photo-email");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match((await response.json()).message, /접수/);
  assert.deepEqual(payload.to, ["a@example.com"]);
  assert.equal(payload.attachments[0].content, photo.split(",")[1]);
});

test("Netlify에서도 다른 출처·잘못된 본문·과대 요청과 미설정 상태를 거부한다", async () => {
  const handler = createNetlifyEmailHandler({
    env,
    fetchImpl: () => {
      throw new Error("발송 금지");
    },
  });
  assert.equal(
    (await handler(request({}, "https://other.example"))).status,
    403,
  );
  assert.equal((await handler(request("invalid-json"))).status, 400);
  assert.equal(
    (await handler(request("x".repeat(3 * 1024 * 1024 + 1)))).status,
    413,
  );
  assert.equal(
    (await createNetlifyEmailHandler({ env: {} })(request({}))).status,
    503,
  );
});

test("Netlify가 제공한 기기 IP로 반복 전송을 제한한다", async () => {
  const handler = createNetlifyEmailHandler({
    env,
    fetchImpl: async () => ({ ok: true }),
  });
  for (let i = 0; i < 5; i++) {
    assert.equal(
      (
        await handler(request({ email: "a@example.com", photo }), {
          ip: "netlify-rate",
        })
      ).status,
      200,
    );
  }
  assert.equal(
    (
      await handler(request({ email: "a@example.com", photo }), {
        ip: "netlify-rate",
      })
    ).status,
    429,
  );
  assert.equal(
    (
      await handler(request({ email: "a@example.com", photo }), {
        ip: "netlify-other",
      })
    ).status,
    200,
  );
});
