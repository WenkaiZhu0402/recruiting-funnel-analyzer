# Recruiting Funnel Analyzer / 招聘漏斗分析仪

一个轻量级 HR 招聘数据工作台，支持 Excel/CSV 候选人台账上传、Excel 表格粘贴导入、AI 简历解析、本地数据保存、招聘漏斗分析、渠道效果分析、岗位分析、风险提醒和 HR 周报摘要生成。

## Local Development

```bash
npm install
npm run dev
```

Vite will serve the frontend locally. The frontend calls `/api/parse-resume` for AI resume parsing.

For the existing local Node preview server with the API proxy:

```bash
npm run local
```

## Build

```bash
npm run build
```

The production build output directory is `dist`.

## Environment Variables

Create a local `.env` or `.env.local` file when you need AI resume parsing:

```bash
OPENAI_API_KEY=your_api_key_here
```

Do not commit `.env`, `.env.local`, or any real API key.

## Deploy To Vercel

1. Create a GitHub repository for this project.
2. Push the project files to GitHub.
3. Import the GitHub repository into Vercel.
4. In Vercel, open Project Settings -> Environment Variables.
5. Add `OPENAI_API_KEY` with your OpenAI API key.
6. Deploy the project.

The Vercel API route is `api/parse-resume.js`, which handles `POST /api/parse-resume` on the server side. The React frontend only calls `/api/parse-resume`; it does not call OpenAI directly and does not expose `OPENAI_API_KEY` in the browser bundle.
