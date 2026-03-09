import { useState, useEffect, useRef } from 'react';

interface StreamEntry {
  userId: string;
  stream: MediaStream;
}

export function useActiveSpeaker(streams: StreamEntry[], threshold = 15, interval = 200) {
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, { analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>>(new Map());

  useEffect(() => {
    if (streams.length === 0) {
      setActiveSpeakerId(null);
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    // Track which userIds are in current streams
    const currentIds = new Set(streams.map(s => s.userId));

    // Remove analysers for streams that are gone
    for (const [uid, entry] of analysersRef.current) {
      if (!currentIds.has(uid)) {
        entry.source.disconnect();
        analysersRef.current.delete(uid);
      }
    }

    // Add analysers for new streams
    for (const { userId, stream } of streams) {
      if (!analysersRef.current.has(userId) && stream.getAudioTracks().length > 0) {
        try {
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analysersRef.current.set(userId, { analyser, source });
        } catch {
          // Stream might be ended or invalid
        }
      }
    }

    const dataArray = new Uint8Array(128);

    const timer = setInterval(() => {
      let maxLevel = threshold;
      let speaker: string | null = null;

      for (const [uid, { analyser }] of analysersRef.current) {
        analyser.getByteFrequencyData(dataArray);
        // Calculate RMS of frequency data
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        if (rms > maxLevel) {
          maxLevel = rms;
          speaker = uid;
        }
      }

      setActiveSpeakerId(speaker);
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [streams, threshold, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [, entry] of analysersRef.current) {
        entry.source.disconnect();
      }
      analysersRef.current.clear();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return activeSpeakerId;
}
