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

    // Try IOS client - often bypasses YouTube restrictions
    const yt = await Innertube.create({ 
      cache: undefined,
      generate_session_locally: true,
      client_type: 'IOS',
    });
    
    const info = await yt.getBasicInfo(videoId, 'IOS');
    
    const streaming = info.streaming_data;
    
    const audioFormats = [
      ...(streaming?.adaptive_formats || []),
      ...(streaming?.formats || []),
    ].filter(f => f.mime_type?.startsWith('audio/') && f.url);
    

    
    if (audioFormats.length === 0) {
      return Response.json({ 
        error: 'YouTube is blocking server-side access. Please upload an audio file directly instead.' 
      }, { status: 403 });
    }
    
    const format = audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    const title = info.basic_info?.title || 'youtube-audio';

    const audioRes = await fetch(format.url);
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