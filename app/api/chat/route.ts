
import { experimental_AssistantResponse } from 'ai';
import { MessageContentText } from 'openai/resources/beta/threads/messages/messages';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

  const input = await req.json() as {
    threadId: string | null;
    message: string;
  };
  const user = (await supabase.auth.getUser()).data.user?.id;

  const userId = user;
  let threadId = input.threadId;
  let assistantId: string;

  const { data: existingAssistant } = await supabase
    .from('assistants')
    .select('assistant_id')
    .eq('user_id', userId)
    .single();

  if (existingAssistant) {
    assistantId = existingAssistant.assistant_id;
  } else {
    const assistantCreationResult = await openai.beta.assistants.create({
      instructions:
        "You are an expert real estate paralegal that just knows how to summarize leases by creating professional and clean lease abstracts. You should use your expert intuition to understand words, phrases, and paragraphs in order to create uniform lease abstracts. If you can't find needed information, please insert and use the logic 'Not Applicable'. References regarding where you find the information should be included under each piece of extracted text. This lease abstract shall be formatted professionally, cleanly, and concisely for ultimate readability and effectiveness when real estate companies need to go back and review the key pieces that could be a substantive fact of the lease and their operations.",
      name: "Real Estate expert",
      tools: [{ type: "retrieval" }],
      model: "gpt-4-1106-preview",
    });
    assistantId = assistantCreationResult.id;

    await supabase
      .from('assistants')
      .insert([
        { user_id: userId, assistant_id: assistantId },
      ]);
  }

  if (!threadId) {
    const threadCreationResult = await openai.beta.threads.create({});
    threadId = threadCreationResult.id;

    await supabase
      .from('user_threads')
      .insert([
        { user_id: userId, thread_id: threadId },
      ]);
  }

  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: input.message,
  });

  return experimental_AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ sendMessage }) => {
      const run = await openai.beta.threads.runs.create(threadId as string, {
        assistant_id: assistantId,
      });

      async function waitForRun(run: OpenAI.Beta.Threads.Runs.Run) {
        while (run.status === 'queued' || run.status === 'in_progress') {
          await new Promise(resolve => setTimeout(resolve, 500));
          run = await openai.beta.threads.runs.retrieve(threadId as string, run.id);
        }

        if (
          run.status === 'cancelled' ||
          run.status === 'cancelling' ||
          run.status === 'failed' ||
          run.status === 'expired'
        ) {
          throw new Error(run.status);
        }
      }

      await waitForRun(run);

      const responseMessages = (
        await openai.beta.threads.messages.list(threadId as string, {
          after: createdMessage.id,
          order: 'asc',
        })
      ).data;

      for (const message of responseMessages) {
        sendMessage({
          id: message.id,
          role: 'assistant',
          content: message.content.filter(
            content => content.type === 'text',
          ) as Array<MessageContentText>,
        });
      }
    },
  );
}