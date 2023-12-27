import fs from "fs";
import OpenAI from "openai";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function uploadFileToOpenAI(filePath: string) {
  // Initialize Supabase client
  const cookieStore = cookies(); // Ensure availability in the context
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

  // Ensure user authentication and retrieve user details
  const user = (await supabase.auth.getUser()).data.user?.id;
  if (!user) {
    throw new Error('User not found.');
  }

  const userId = user;
  let assistantId = '';

  // Retrieve or create an assistant ID
  const { data: existingAssistant } = await supabase
    .from('assistants')
    .select('assistant_id')
    .eq('user_id', userId)
    .single();

  if (existingAssistant) {
    assistantId = existingAssistant.assistant_id;
  } else {
    const assistantCreationResult = await openai.beta.assistants.create({
      model: "gpt-4",
      instructions: `You are an expert real estate paralegal that just knows how to summarize leases by creating professional and clean lease abstracts. You should use your expert intuition to understand words, phrases, and paragraphs in order to create uniform lease abstracts. If you can't find needed information, please insert and use the logic "Not Applicable". References regarding where you find the information should be included under each piece of extracted text. This lease abstract shall be formatted professionally, cleanly, and concisely for ultimate readability and effectiveness when real estate companies need to go back and review the key pieces that could be a substantive fact of the lease and their operations.`,
      name: 'Real Estate Helper'
    });
    assistantId = assistantCreationResult.id;
    await supabase.from('assistants').insert([{ user_id: userId, assistant_id: assistantId }]);
  }

  // Use createReadStream to read the file
  const fileStream = fs.createReadStream(filePath);

  // Upload the file to OpenAI
  const fileUploadResult = await openai.files.create({
    file: fileStream,
    purpose: "fine-tune",
  });

  const fileId = fileUploadResult.id;

  // Link the file to the assistant (if necessary)
  const assistantFileResult = await openai.beta.assistants.files.create(assistantId, {
    file_id: fileId
  });

 // Return the file and assistant file ids or handle them as needed
 return {
    fileId: fileId,
    assistantFileId: assistantFileResult.id,
  };
}

export default uploadFileToOpenAI;