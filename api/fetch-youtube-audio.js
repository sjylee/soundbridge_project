import { Innertube } from 'youtubei.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function tryGetAudio(videoId, clientType) {
  const yt = await Innertube.create({
    cache: undefined,
    generate_session_locally: true,
    ...(clientType ? { client_type: clientType } : {}),
  });

  const info = clientType
    ? await yt.getBasicInfo(videoId, clientType)
    : await yt.getBasicInfo(videoId);

  const streaming = info.streaming_data;
  const allFormats = [
    ...(streaming?.adaptive_formats || []),
    ...(streaming?.formats || []),
  ];

  const audioFormats = allFormats.filter((f) => f.mime_type?.startsWith('audio/') && f.url);

  return { audioFormats, title: info.basic_info?.title || 'youtube-audio' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (!match) {
    return res.status(400).json({ error: 'Could not extract YouTube video ID from URL' });
  }
  const videoId = match[1];

  // Try multiple clients in order of preference
  const clientsToTry = ['IOS', 'MWEB', 'WEB', null];
  let audioFormats = [];
  let title = 'youtube-audio';
  let lastError = null;

  for (const client of clientsToTry) {
    try {
      const result = await tryGetAudio(videoId, client);
      if (result.audioFormats.length > 0) {
        audioFormats = result.audioFormats;
        title = result.title;
        break;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (audioFormats.length === 0) {
    return res.status(403).json({
      error: lastError?.message || 'No audio stream available. YouTube may be blocking server-side access.',
    });
  }

  const format = audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

  const audioRes = await fetch(format.url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(120000),
  });

  if (!audioRes.ok) {
    return res.status(502).json({ error: `Failed to fetch audio stream: ${audioRes.status}` });
  }

  const arrayBuffer = await audioRes.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

  return res.status(200).json({ audioBase64, title });
}

export const config = {
  maxDuration: 60,
};
