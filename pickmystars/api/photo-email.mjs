import { createHash } from "node:crypto";

const MAX_BYTES = 3 * 1024 * 1024;
const attempts = new Map();
export function createEmailHandler({
  env = process.env,
  fetchImpl = fetch,
  now = Date.now,
  createTransportImpl = async (options) => {
    const { default: nodemailer } = await import("nodemailer");
    return nodemailer.createTransport(options);
  },
} = {}) {
  return async function handler(req, res) {
    const reply = (status, message) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({ message }));
    };
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return reply(405, "지원하지 않는 요청입니다.");
    }
    // 브라우저의 다른 사이트에서 이 전송 API를 호출하지 못하도록 합니다.
    try {
      const origin = new URL(req.headers.origin);
      if (
        !["http:", "https:"].includes(origin.protocol) ||
        origin.host !== req.headers.host
      )
        throw new Error();
    } catch {
      return reply(403, "앱 화면에서 다시 전송해주세요.");
    }
    const gmail = env.MAIL_PROVIDER !== "resend";
    const gmailUser = env.GMAIL_USER?.trim();
    const gmailPassword = env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
    if (
      gmail
        ? !gmailUser || !gmailPassword
        : !env.RESEND_API_KEY || !env.PHOTO_EMAIL_FROM
    ) {
      return reply(
        503,
        "이메일 전송 설정이 준비되지 않았어요. 운영자에게 알려주세요.",
      );
    }
    if (!req.headers["content-type"]?.startsWith("application/json"))
      return reply(415, "잘못된 전송 형식입니다.");
    if (Number(req.headers["content-length"]) > MAX_BYTES)
      return reply(413, "사진 용량이 너무 커요. 다시 촬영해주세요.");
    let body;
    try {
      if (req.body !== undefined) {
        const raw =
          typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        if (Buffer.byteLength(raw) > MAX_BYTES)
          return reply(413, "사진 용량이 너무 커요.");
        body = JSON.parse(raw);
      } else {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk);
          if (size > MAX_BYTES) return reply(413, "사진 용량이 너무 커요.");
          chunks.push(Buffer.from(chunk));
        }
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      }
    } catch {
      return reply(400, "전송할 정보를 읽을 수 없어요.");
    }
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const photo = body?.photo;
    if (
      email.length > 254 ||
      !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)
    )
      return reply(400, "이메일 주소를 확인해주세요.");
    if (
      typeof photo !== "string" ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)
    )
      return reply(400, "완성된 사진을 첨부해주세요.");
    const content = photo.split(",")[1];
    const image = Buffer.from(content, "base64");
    if (
      image.length < 4 ||
      image[0] !== 0xff ||
      image[1] !== 0xd8 ||
      image.at(-2) !== 0xff ||
      image.at(-1) !== 0xd9
    )
      return reply(400, "올바른 사진 파일이 아니에요.");
    // 전시 PC에서 실수로 반복 전송하는 상황을 제한합니다. 분산 배포용 제한은 별도 필요합니다.
    const time = now();
    for (const [key, value] of attempts)
      if (time - value.start >= 60000) attempts.delete(key);
    const ip = req.socket?.remoteAddress ?? "local";
    const usage = attempts.get(ip) ?? { start: time, count: 0 };
    if (usage.count >= 5)
      return reply(429, "전송 요청이 많아요. 잠시 후 다시 시도해주세요.");
    usage.count++;
    attempts.set(ip, usage);
    try {
      if (gmail) {
        const transport = await createTransportImpl({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailPassword },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
          logger: false,
          debug: false,
        });
        try {
          const result = await transport.sendMail({
            from: { name: "P!ck My St☆r", address: gmailUser },
            to: email,
            subject: "P!ck My St☆r · 함께 남긴 네컷 사진",
            text: "P!ck My St☆r에서 촬영한 네컷 사진을 보내드려요. 첨부된 사진을 확인해주세요!",
            attachments: [
              {
                filename: "pick-my-star.jpg",
                content: image,
                contentType: "image/jpeg",
              },
            ],
            disableFileAccess: true,
            disableUrlAccess: true,
          });
          if (!result.accepted?.length || result.rejected?.length) {
            return reply(
              502,
              "받는 이메일 주소가 거절됐어요. 주소를 확인해주세요.",
            );
          }
          return reply(
            200,
            "메일 전송 요청이 접수됐어요. 받은편지함과 스팸함을 확인해주세요.",
          );
        } finally {
          transport.close?.();
        }
      }
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": createHash("sha256")
            .update(email.toLowerCase())
            .update(image)
            .digest("hex"),
        },
        body: JSON.stringify({
          from: env.PHOTO_EMAIL_FROM,
          to: [email],
          subject: "P!ck My St☆r · 함께 남긴 네컷 사진",
          text: "P!ck My St☆r에서 촬영한 네컷 사진을 보내드려요. 첨부된 사진을 확인해주세요!",
          attachments: [{ filename: "pick-my-star.jpg", content }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        return reply(
          502,
          "이메일 전송이 완료되지 않았어요. 주소를 확인하고 다시 시도해주세요.",
        );
      return reply(
        200,
        "메일 전송 요청이 접수됐어요. 받은편지함과 스팸함을 확인해주세요.",
      );
    } catch (error) {
      // SMTP 응답 원문에는 주소 등이 포함될 수 있어 사용자에게 그대로 전달하지 않습니다.
      if (gmail && error?.code === "EAUTH")
        return reply(
          503,
          "Gmail 발신 계정 인증에 실패했어요. 운영자가 앱 비밀번호를 확인해주세요.",
        );
      if (gmail && error?.code === "EENVELOPE")
        return reply(
          502,
          "이메일 주소가 거절됐어요. 주소 또는 Gmail 발송 한도를 확인해주세요.",
        );
      return reply(
        502,
        "전송 결과를 확인하지 못했어요. 메일함을 확인한 뒤 필요하면 다시 시도해주세요.",
      );
    }
  };
}
export default createEmailHandler();
