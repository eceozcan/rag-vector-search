import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = typeof req.body?.secret === 'string' ? req.body.secret : undefined;
  const backendRes = await fetch(`${BACKEND_URL}/api/admin/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ secret }),
  });

  const data = await backendRes.json();
  if (!backendRes.ok) {
    return res.status(backendRes.status).json({ error: data?.error || 'Invalid secret' });
  }

  return res.status(200).json({ ok: true });
}
