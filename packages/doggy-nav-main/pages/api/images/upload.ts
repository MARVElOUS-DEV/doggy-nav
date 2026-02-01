import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!IMAGE_SERVICE_URL) {
    return res.status(500).json({ error: 'Image service not configured' });
  }

  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
    const [, files] = await form.parse(req);
    const uploaded = files.files as File[] | undefined;

    if (!uploaded?.length) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const formData = new FormData();
    for (const file of uploaded) {
      const buffer = fs.readFileSync(file.filepath);
      formData.append('files', new Blob([buffer]), file.originalFilename || 'image');
    }

    const headers: Record<string, string> = { Authorization: token };
    const imageHostname = req.headers['x-image-hostname'];
    if (typeof imageHostname === 'string') {
      headers['X-Image-Hostname'] = imageHostname;
    }

    const response = await fetch(`${IMAGE_SERVICE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
}
