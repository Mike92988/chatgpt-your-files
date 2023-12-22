



'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUserId(session.user.id);
        createAssistant(session.user.id);
      }
    });
  }, [supabase.auth]);

  const createAssistant = async (userId: string) => {
    const response = await fetch('/api/create-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        name: 'Real Estate Paralegal Assistant',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.newAssistant && data.newAssistant.id) {
      setAssistantId(data.newAssistant.id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assistantId || !userId || !input.trim()) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          assistantId: assistantId,
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.response) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'user', content: input },
          { role: 'assistant', content: data.response },
        ]);
        setInput(''); 
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="max-w-6xl flex flex-col items-center w-full h-full">
      <div className="flex flex-col w-full gap-6 grow my-2 sm:my-10 p-4 sm:p-8 sm:border rounded-sm overflow-y-auto">
        <div className="border-slate-400 rounded-lg flex flex-col justify-start gap-4 pr-2 grow overflow-y-scroll">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'rounded-xl bg-gray-500 text-white px-4 py-2 max-w-lg',
                message.role === 'user' ? 'self-end bg-blue-600' : 'self-start'
              )}
            >
              {message.content}
            </div>
          ))}
        </div>
        <form className="flex items-center space-x-2 gap-2" onSubmit={handleSubmit}>
          <Input
            type="text"
            autoFocus
            placeholder="Send a message"
            value={input}
            onChange={handleInputChange}
          />
          <Button type="submit">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}