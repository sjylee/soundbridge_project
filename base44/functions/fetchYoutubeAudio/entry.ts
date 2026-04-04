import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Innertube } from 'npm:youtubei.js@^13';

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
  
  const audioFormats = allFormats.filter(f => 
    f.mime_type?.startsWith('audio/') && f.url
  );
  
  return { audioFormats, title: info.basic_info?.title || 'youtube-audio' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

    const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (!match) {
      return Response.json({ error: 'Could not extract YouTube video ID from URL' }, { status: 400 });
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
        console.log(`Client ${client}: found ${result.audioFormats.length} audio formats`);
        if (result.audioFormats.length > 0) {
          audioFormats = result.audioFormats;
          title = result.title;
          break;
        }
      } catch (e) {
        lastError = e;
        console.warn(`Client ${client} failed: ${e.message}`);
      }
    }

    if (audioFormats.length === 0) {
      return Response.json({ 
        error: lastError?.message || 'No audio stream available. YouTube may be blocking server-side access.'
      }, { status: 403 });
    }

    const format = audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    console.log('Fetching audio:', format.mime_type, format.bitrate, 'bps');

    const audioRes = await fetch(format.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(120000),
    });

    if (!audioRes.ok) {
      return Response.json({ error: `Failed to fetch audio stream: ${audioRes.status}` }, { status: 502 });
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    return Response.json({ audioBase64: base64, title });
  } catch (error) {
    console.error('fetchYoutubeAudio error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});