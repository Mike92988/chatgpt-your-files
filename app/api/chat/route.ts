
"use server";
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: Request, res: NextApiResponse) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

 
    try {
      const request = await req.json();
      const { userId, assistantId, message } = request;

      if (!userId || !assistantId || !message) {
        return res.status(400).json({ message: "User ID, Assistant ID, and message are required" });
      }

      const thread = await openai.beta.threads.create();
      const threadId = thread.id;

      const threadMessages = await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message
      });

      const userMessage = {
        chat_id: assistantId,
        direction: 'outbound',
        content: message, 

      };

      const { error: userMessageError } = await supabase
        .from('messages')
        .insert([userMessage]);
      if (userMessageError) throw userMessageError;

      const assistantMessageContent = threadMessages.content[0];
      const assistantMessage = {
        chat_id: assistantId,
        direction: 'inbound',
        content: assistantMessageContent
      };

      const { error: assistantMessageError } = await supabase
        .from('messages')
        .insert([assistantMessage]);
      if (assistantMessageError) throw assistantMessageError;

      return NextResponse.json({ response: assistantMessageContent }, {status: 200});
    } catch (error) {
      let errorStatus = error as any;
      console.error(error);
      return NextResponse.json({ error: errorStatus.message },{ status: 400});
    }
 
}