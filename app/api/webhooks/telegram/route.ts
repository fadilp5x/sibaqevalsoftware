import { NextRequest, NextResponse } from 'next/server'

// Telegram Webhook Bridge for AI Observability & Traces
// Translates OpenRouter / Observability JSON payloads to Telegram Bot sendMessage format

const DEFAULT_BOT_TOKEN = '8530986913:AAH09DFKYCe1YB5bHvQf1FqldmpwOiiThZo'
const DEFAULT_CHAT_ID = '-1003980106624'

// Safe icon representations without literal unicode pictographs in source file
const ICON_RADAR = String.fromCodePoint(0x1f4e1)
const ICON_ROBOT = String.fromCodePoint(0x1f916)
const ICON_BOLT = String.fromCodePoint(0x26a1)
const ICON_TIMER = String.fromCodePoint(0x23f1)
const ICON_MONEY = String.fromCodePoint(0x1f4b0)
const ICON_MEMO = String.fromCodePoint(0x1f4dd)
const ICON_CHAT = String.fromCodePoint(0x1f4ac)
const ICON_CHECK = String.fromCodePoint(0x2705)

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID

  return NextResponse.json({
    status: 'online',
    endpoint: '/api/webhooks/telegram',
    service: 'SST AI Observability Telegram Bridge',
    configured: {
      botToken: !!botToken,
      chatId: !!chatId,
      webhookSecret: !!process.env.WEBHOOK_SECRET,
    },
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID
    const webhookSecret = process.env.WEBHOOK_SECRET || 'sst-secret-1234'

    // 1. Security Header Validation (Optional check if configured)
    const secretHeader =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('X-Webhook-Secret') ||
      req.nextUrl.searchParams.get('secret')

    if (webhookSecret && secretHeader && secretHeader !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 401 })
    }

    // 2. Parse payload safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    // Handle initial "Test Connection" / Ping events from Observability UI
    const isPing =
      !body ||
      Object.keys(body).length === 0 ||
      body.type === 'ping' ||
      body.event === 'test' ||
      body.action === 'ping' ||
      body.test === true

    if (isPing) {
      const pingText =
        `${ICON_CHECK} *SST AI Observability: Connection Verified*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${ICON_RADAR} Bridge route is online and responding.\n` +
        `${ICON_TIMER} Time: \`${new Date().toLocaleString()}\`\n` +
        `URL: \`/api/webhooks/telegram\``

      await sendTelegramMessage(botToken, chatId, pingText)
      return NextResponse.json({ ok: true, message: 'Test connection received & forwarded to Telegram' })
    }

    // 3. Extract chat log & telemetry fields from various trace payload structures
    const trace = Array.isArray(body) ? body[0] : body?.data || body?.trace || body

    const model =
      trace?.model ||
      trace?.attributes?.model ||
      trace?.response?.model ||
      body?.model ||
      'AI Model'

    const promptTokens =
      trace?.usage?.prompt_tokens ??
      trace?.prompt_tokens ??
      trace?.usage?.input_tokens ??
      0

    const completionTokens =
      trace?.usage?.completion_tokens ??
      trace?.completion_tokens ??
      trace?.usage?.output_tokens ??
      0

    const latency =
      trace?.latency_ms ??
      trace?.duration_ms ??
      trace?.duration ??
      trace?.latency ??
      'N/A'

    const cost =
      trace?.usage?.total_cost ??
      trace?.cost ??
      trace?.total_cost ??
      0

    // Extract prompt & input text safely
    let rawInput = ''
    if (typeof trace?.input === 'string') {
      rawInput = trace.input
    } else if (Array.isArray(trace?.messages)) {
      rawInput = trace.messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => `[${(m.role || 'user').toUpperCase()}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
        .join('\n\n')
    } else if (trace?.messages || trace?.input) {
      rawInput = JSON.stringify(trace?.messages || trace?.input, null, 2)
    } else {
      rawInput = 'Observation Trace Ping / Live Telemetry'
    }

    // Extract completion & output text safely
    let rawOutput = ''
    if (typeof trace?.output === 'string') {
      rawOutput = trace.output
    } else if (Array.isArray(trace?.choices) && trace.choices.length > 0) {
      const firstChoice = trace.choices[0]
      rawOutput = firstChoice?.message?.content || firstChoice?.text || JSON.stringify(firstChoice)
    } else if (trace?.output || trace?.response) {
      rawOutput = JSON.stringify(trace?.output || trace?.response, null, 2)
    } else {
      rawOutput = 'OK / Trace Processed'
    }

    // Truncate to strictly fit within Telegram's 4096 character limit
    const cleanInput = rawInput.slice(0, 950)
    const cleanOutput = rawOutput.slice(0, 1400)
    const costFormatted = typeof cost === 'number' && cost > 0 ? `$${cost.toFixed(5)}` : '$0.00000'

    // 4. Format clean structured message for Telegram Group / Channel
    const messageText =
      `${ICON_RADAR} *AI Observability Log*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${ICON_ROBOT} *Model:* \`${escapeMarkdown(model)}\`\n` +
      `${ICON_BOLT} *Tokens:* ${promptTokens} in / ${completionTokens} out\n` +
      `${ICON_TIMER} *Latency:* ${latency} ms | ${ICON_MONEY} *Cost:* ${costFormatted}\n\n` +
      `${ICON_MEMO} *Prompt / Input:*\n\`\`\`\n${cleanInput}\n\`\`\`\n\n` +
      `${ICON_CHAT} *AI Response:*\n\`\`\`\n${cleanOutput}\n\`\`\``

    // 5. Send to Telegram API
    await sendTelegramMessage(botToken, chatId, messageText)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Failed to process webhook' },
      { status: 200 }
    )
  }
}

function escapeMarkdown(text: string): string {
  return String(text).replace(/[_*[\]()~>#+=|{}.!-]/g, '\\$&')
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  })

  // If Markdown fails (e.g. unescaped character combinations in user prompts), fallback to plain text
  if (!res.ok) {
    const plainText = text.replace(/[*`\\]/g, '')
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: plainText,
        disable_web_page_preview: true,
      }),
    })
  }
}
