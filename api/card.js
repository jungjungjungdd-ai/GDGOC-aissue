import {
  CardRequestError,
  createActionCard,
} from "../server/card.js";

function readBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      throw new CardRequestError("요청 본문이 올바른 JSON이 아닙니다.", 400, "INVALID_JSON");
    }
  }
  return body;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: { code: "METHOD_NOT_ALLOWED", message: "POST 요청만 지원합니다." },
    });
  }

  try {
    const body = readBody(req.body);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new CardRequestError("요청 본문 형식이 올바르지 않습니다.");
    }

    const card = await createActionCard({
      alertId: body.alertId,
      profile: body.profile || {},
      location: body.location || {},
    });

    return res.status(200).json(card);
  } catch (error) {
    if (error instanceof CardRequestError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.field ? { field: error.field } : {}),
        },
      });
    }

    console.error("[card] 처리 실패:", error?.message);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "행동 카드 생성 중 오류가 발생했습니다." },
    });
  }
}
