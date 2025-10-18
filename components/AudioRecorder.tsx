'use client';

import React, { useState, useRef } from 'react';
import { MicIcon } from './icons';

interface AudioRecorderProps {
  onRecordingComplete: (audioUrl: string) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return stream;
      } catch (err) {
        if (err instanceof Error) {
            setError(`Permission Denied: ${err.message}`);
        } else {
            setError("An unknown error occurred while accessing the microphone.");
        }
        return null;
      }
    } else {
      setError("The MediaRecorder API is not supported in your browser.");
      return null;
    }
  };

  const startRecording = async () => {
    setError(null);
    setAudioURL(null);
    const stream = await getMicrophonePermission();
    if (stream) {
      setIsRecording(true);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      mediaRecorder.ondataavailable = (event) => {
        if (typeof event.data === "undefined") return;
        if (event.data.size === 0) return;
        audioChunksRef.current.push(event.data);
      };
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = await blobToBase64(audioBlob);
        setAudioURL(audioUrl);
        onRecordingComplete(audioUrl);
        audioChunksRef.current = [];
      };
    }
  };

  return (
    <div className="p-4 border border-stone-200 rounded-md bg-stone-50 text-center">
      <h4 className="font-semibold text-charcoal mb-3">Record Voiceover</h4>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white transition-colors ${
          isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-charcoal hover:bg-stone-700'
        }`}
      >
        <MicIcon className="w-5 h-5 mr-2" />
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {isRecording && (
        <div className="mt-4 flex items-center justify-center text-red-600">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="ml-2 text-sm font-medium">Recording...</span>
        </div>
      )}

      {audioURL && (
        <div className="mt-4">
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}
    </div>
  );
};
