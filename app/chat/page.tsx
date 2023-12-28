'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { experimental_useAssistant as useAssistant, Message } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
const roleToColorMap: Record<Message['role'], { background: string; text: string }> = {
  system: { background: 'bg-red-500', text: 'text-white' },
  user: { background: 'bg-blue-500', text: 'text-white' },
  function: { background: 'bg-blue-100', text: 'text-blue-800' },
  assistant: { background: 'bg-green-500', text: 'text-white' },
  data: { background: 'bg-orange-400', text: 'text-white' },
  tool: { background: 'bg-gray-200', text: 'text-gray-800' }
};

export default function ChatPage() {
  const supabase = createClientComponentClient();
  const { status, messages, input, submitMessage, handleInputChange } = useAssistant({
    api: '/api/chat',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
      }
    });
  }, [supabase.auth]);

  const [image, setImage] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        toast.success('File uploaded to openai succesfully')
        console.log('File uploaded with ID:', data.fileId);
        // Perform any additional logic with the file upload response
      } catch (error) {
      toast.error('There was an error uploading your file, please try again')
        console.error('Error uploading file:', error);
      }
    }
  };
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100 p-6">
      <Toaster />
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="text-2xl font-semibold text-gray-900 mb-4">
            Real Estate GPT(Lease Analyzer)
          </div>
          <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-50">
        {messages.map((m: Message) => (
          <div
            key={m.id}
            className={`whitespace-pre-wrap p-3 rounded-md mb-2 ${roleToColorMap[m.role].background} ${roleToColorMap[m.role].text}`}
          >
            <strong>{`${m.role}: `}</strong>
            <ReactMarkdown>
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>
          {status === 'in_progress' && (
            <div className="h-8 w-full bg-gray-200 rounded-lg animate-pulse mb-4" />
          )}
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitMessage();
            }}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="mb-2"
            />
            <button
              type="button"
              onClick={handleFileUpload}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              
            >
              Upload Image
            </button>
            <div className="flex items-center gap-2">
              <input
                disabled={status !== 'awaiting_message'}
                className="flex-grow p-2 border border-gray-300 rounded"
                value={input}
                placeholder="Type your message here..."
                onChange={handleInputChange}
              />
              <button
                type="submit"
                disabled={status !== 'awaiting_message'}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



