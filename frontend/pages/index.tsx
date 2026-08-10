import { useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Bir hata oluştu.');
        return;
      }
      setAnswer(data?.composed?.answer || JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err?.message || 'İstek gönderilirken hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sohbet (Türkçe)</h1>
        <textarea
          className="w-full p-2 border"
          rows={4}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Soru yazın..."
        />
        <button
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={send}
        >
          Soru Gönder
        </button>
        {error ? <div className="mt-4 text-red-700">{error}</div> : null}
        <pre className="mt-4 bg-white p-4 border rounded whitespace-pre-wrap">{answer}</pre>
      </div>
    </div>
  );
}
