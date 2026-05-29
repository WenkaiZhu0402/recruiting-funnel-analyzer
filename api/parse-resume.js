const roleOptions = [
  "HR招聘实习生",
  "HRBP实习生",
  "人力资源助理",
  "产品实习生",
  "产品运营实习生",
  "用户运营实习生",
  "内容运营实习生",
  "商业运营实习生",
  "销售助理",
  "市场分析实习生",
  "数据分析实习生",
  "项目管理实习生",
  "研发助理",
  "技术支持实习生",
  "海外业务运营实习生",
  "跨境电商运营实习生",
  "待人工确认",
];

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return Promise.resolve(request.body);
  if (request.body && typeof request.body === "string") {
    try {
      return Promise.resolve(JSON.parse(request.body));
    } catch (error) {
      return Promise.reject(new Error("请求格式无效。"));
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 150000) {
        reject(new Error("请求内容过大，请缩短简历文本后重试。"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("请求格式无效。"));
      }
    });
    request.on("error", reject);
  });
}

function extractResponseText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "仅支持POST请求。" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 400, { error: "未检测到 OPENAI_API_KEY，请在 Vercel 环境变量或本地 .env 文件中配置 API 密钥。" });
    return;
  }

  try {
    const { resumeText = "", index = 0 } = await readJsonBody(request);
    if (!String(resumeText).trim()) {
      sendJson(response, 400, { error: "简历文本为空，请上传可解析的TXT简历。" });
      return;
    }

    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        instructions:
          "你是HR数据整理助手。只从简历文本中提取候选人台账信息，不评分、不排序、不给录用或淘汰建议。必须使用简体中文输出字段内容。",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `请将以下简历整理为候选人台账JSON。候选人姓名请匿名化为 Candidate ${String(index + 1).padStart(3, "0")}。建议岗位只能从以下范围选择：${roleOptions.join("、")}。\n\n简历文本：\n${String(resumeText).slice(0, 12000)}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "resume_candidate_record",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                candidate_id: { type: "string" },
                name: { type: "string" },
                education_level: { type: "string" },
                school: { type: "string" },
                major: { type: "string" },
                graduation_year: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
                experience_keywords: { type: "array", items: { type: "string" } },
                suggested_role: { type: "string", enum: roleOptions },
                fit_reason: { type: "string" },
                missing_information: { type: "array", items: { type: "string" } },
                source: { type: "string" },
                recruiter: { type: "string" },
                current_stage: { type: "string" },
                applied_date: { type: "string" },
                reject_reason: { type: "string" },
              },
              required: [
                "candidate_id",
                "name",
                "education_level",
                "school",
                "major",
                "graduation_year",
                "skills",
                "experience_keywords",
                "suggested_role",
                "fit_reason",
                "missing_information",
                "source",
                "recruiter",
                "current_stage",
                "applied_date",
                "reject_reason",
              ],
            },
          },
        },
      }),
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, { error: data.error?.message || "OpenAI API调用失败，请稍后重试。" });
      return;
    }

    const text = extractResponseText(data);
    const candidate = JSON.parse(text);
    sendJson(response, 200, { candidate });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "简历解析失败，请稍后重试。" });
  }
};
