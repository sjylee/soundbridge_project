import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Innertube } from 'npm:youtubei.js@^13';

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

    const yt = await Innertube.create({ 
      cache: undefined,
      generate_session_locally: true,
    });
    
    const info = await yt.getBasicInfo(videoId);
    const title = info.basic_info?.title || 'youtube-audio';

    // Use yt.download() which handles signature deciphering internally
    const stream = await yt.download(videoId, {
      type: 'audio',
      quality: 'best',
      format: 'any',
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < merged.length; i += chunkSize) {
      binary += String.fromCharCode(...merged.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    return Response.json({ audioBase64: base64, title });
  } catch (error) {
    console.error('fetchYoutubeAudio error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});