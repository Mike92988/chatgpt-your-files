"use server";
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const createAssistant = async ({ name, instructions, fileId }: { name: string, instructions: string, fileId?: string }) => {
  const assistant = await openai.beta.assistants.create({
    name: name,
    instructions: instructions,
    tools: [{ type: "retrieval" }],
    model: "gpt-4-1106-preview",
    file_ids: fileId ? [fileId] : undefined,
  });

  return assistant;
};

export async function POST(req: Request, res: NextApiResponse) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  if (req.method === 'POST') {
    try {
      const request = await req.json();
      const { userId, name, fileId } = request;

      if (!userId || !name) {
        return NextResponse.json({ message: "User ID and name are required" }, { status: 400 });
      }

      // Check if an assistant already exists for the user
      const { data: existingChats, error: existingChatsError } = await supabase
        .from('chats')
        .select('assistant_id')
        .eq('user_id', userId)
       

      if (existingChatsError && existingChatsError.message !== 'No rows found') {
        throw existingChatsError;
      }

      if (existingChats) {
        return NextResponse.json({ assistantId: existingChats[0].assistant_id }, { status: 200 });
      } else {
        const instructions = "You are an expert real estate paralegal that just knows how to summarize leases by creating professional and clean lease abstracts. You should use your expert intuition to understand words, phrases, and paragraphs in order to create uniform lease abstracts. If you can't find needed information, please insert and use the logic 'Not Applicable'. References regarding where you find the information should be included under each piece of extracted text. This lease abstract shall be formatted professionally, cleanly, and concisely for ultimate readability and effectiveness when real estate companies need to go back and review the key pieces that could be a substantive fact of the lease and their operations.";
        const newAssistant = await createAssistant({ name, instructions, fileId });

        const { error: insertError } = await supabase
          .from('chats')
          .insert([
            {
              user_id: userId,
              assistant_id: newAssistant.id,
              file_id: fileId,
            }
          ]);

        if (insertError) throw insertError;

        return NextResponse.json({ assistantId: newAssistant.id }, { status: 200 });
      }
    } catch (error) {
      let errorStatus = error as any;
      console.error(error);
      return NextResponse.json({ error: errorStatus.message }, { status: 500 });
    }
  } else {
    return NextResponse.json(`Method ${req.method} Not Allowed`, { status: 405 });
  }
}