import { createEmailHandler } from "../../api/photo-email.mjs";

// 기존 화면과 로컬 서버가 사용하는 주소를 Netlify에서도 유지합니다.
export const config = { path: "/api/photo-email" };

export function createNetlifyEmailHandler(options) {
  const sendEmail = createEmailHandler(options);
  return async function handler(request, context = {}) {
    const headers = Object.fromEntries(request.headers);
    headers.host = new URL(request.url).host;
    const req = {
      method: request.method,
      headers,
      socket: { remoteAddress: context.ip ?? "local" },
      async *[Symbol.asyncIterator]() {
        if (request.body) yield* request.body;
      },
    };
    let response;
    const responseHeaders = new Headers();
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders.set(name, value);
      },
      end(body) {
        response = new Response(body, {
          status: this.statusCode,
          headers: responseHeaders,
        });
      },
    };
    await sendEmail(req, res);
    return response;
  };
}

export default createNetlifyEmailHandler();
