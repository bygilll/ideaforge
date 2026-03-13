# Startup Validation Plan

Minimal Next.js app: enter a startup idea and get a 14-day validation plan (Problem, Target Customer, MVP, 14-Day Plan) via OpenAI.

## Commands to run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set your OpenAI API key**
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` and set `OPENAI_API_KEY` to your key from [OpenAI API keys](https://platform.openai.com/api-keys).

3. **Start the dev server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), enter an idea, and click **Generate Plan**.

## Build for production

```bash
npm run build
npm start
```

No login, database, auth, or payments—single page only.
