import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/ai/suggest-severity — Story #2
export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: `You are an ITSM triage assistant. Analyze the incident and suggest a severity level.
        
P1 — Critical: Service is down, revenue impact, security breach, all users affected.
P2 — High: Major feature broken, significant user impact, workaround may exist.
P3 — Medium: Minor feature issue, limited user impact, workaround available.
P4 — Low: Cosmetic issue, feature request, no urgency.

Respond with ONLY valid JSON in this exact format, no other text:
{"severity": "P1", "reason": "Brief explanation of why this severity was chosen"}`,
      messages: [
        {
          role: 'user',
          content: `Incident Title: ${title}\nDescription: ${description}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const suggestion = JSON.parse(responseText);

    return NextResponse.json(suggestion);

  } catch (error) {
    console.error('AI severity suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI suggestion' },
      { status: 500 }
    );
  }
}