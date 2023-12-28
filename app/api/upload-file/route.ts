
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return new Response('No file uploaded.', { status: 400 });
  }

  const user = (await supabase.auth.getUser()).data.user?.id;
  if (!user) {
    return new Response('User not found.', { status: 404 });
  }

  const userId = user;
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
        instructions: "You are an expert real estate paralegal that just knows how to summarize leases by creating professional and clean lease abstracts. You should use your expert intuition to understand words, phrases, and paragraphs in order to create uniform lease abstracts. If you can't find needed information, please insert and use the logic 'Not Applicable'. References regarding where you find the information should be included under each piece of extracted text. This lease abstract shall be formatted professionally, cleanly, and concisely for ultimate readability and effectiveness when real estate companies need to go back and review the key pieces that could be a substantive fact of the lease and their operations.",
        name: "Real Estate expert",
        tools: [{ type: "retrieval" }],
        model: "gpt-4-1106-preview",

    });
    assistantId = assistantCreationResult.id;

    await supabase.from('assistants').insert([{ user_id: userId, assistant_id: assistantId }]);
  }

 

  const fileUploadResult = await openai.files.create({
    file: file,
    purpose: "assistants",
  });



  const fileId = fileUploadResult.id;

  const assistantFileResult = await openai.beta.assistants.files.create(assistantId, {
    file_id: fileId
  });

  if (!assistantFileResult) {
    console.error('Error linking file to assistant:', assistantFileResult);
    return new Response('Error linking file to assistant.', { status: 500 });
  }

  return new NextResponse(JSON.stringify({
    fileId: fileId,
    assistantFile: assistantFileResult.id,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}