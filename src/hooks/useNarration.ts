import { useState, useRef } from 'react';
import { Story } from '../types/Story';

const WORDS_PER_CHUNK = 40;

export function useNarration() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [storyFinished, setStoryFinished] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [chunkIndex, setChunkIndex] = useState<number>(0);
  const [volume, setVolume] = useState(1); // de 0 a 1

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  function splitTextByWords(text: string, wordsPerChunk: number = WORDS_PER_CHUNK) {
    const words = text.split(/\s+/);
    const result: string[] = [];
    let temp: string[] = [];

    for (const w of words) {
      if (temp.length >= wordsPerChunk) {
        result.push(temp.join(' '));
        temp = [];
      }
      temp.push(w);
    }
    if (temp.length > 0) result.push(temp.join(' '));
    return result;
  }

  function playChunk(index: number) {
    if (!chunks[index]) {
      setStoryFinished(true);
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    currentUtteranceRef.current = utterance;
    utterance.volume = volume;
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;

    utterance.onend = () => {
      const next = index + 1;
      setChunkIndex(next);
      if (next < chunks.length) {
        playChunk(next);
      } else {
        // Fin de la historia
        setStoryFinished(true);
        setIsPlaying(false);
      }
    };

    utterance.onerror = (e) => {
      console.error("Error en utterance:", e);
      setIsPlaying(false);
    };

    speechSynthesis.speak(utterance);
  }

  function startReadingStory(fromIndex: number) {
    setStoryFinished(false);
    setChunkIndex(fromIndex);
    playChunk(fromIndex);
  }

  // ====== API del hook ======

  // Llamar cuando se hace "play" a un cuento nuevo
  function handlePlayStory(story: Story) {
    if (!speechSynthesis) {
      console.warn("No hay soporte de speechSynthesis en este navegador");
      return;
    }
    // Cancelar narración previa
    speechSynthesis.cancel();

    setCurrentStory(story);
    setStoryFinished(false);
    setChunkIndex(0);
    setIsPlaying(true);

    const parted = splitTextByWords(story.content);
    setChunks(parted);

    startReadingStory(0);
  }

  // Llamar cuando se presiona pausa/reanudar
  function handlePlayPause() {
    if (!speechSynthesis) return;

    if (isPlaying && !storyFinished) {
      speechSynthesis.pause();
      setIsPlaying(false);
    } else if (!isPlaying && !storyFinished) {
      speechSynthesis.resume();
      setIsPlaying(true);
    } else if (storyFinished && currentStory) {
      // Reiniciar desde 0
      speechSynthesis.cancel();
      setChunkIndex(0);
      setIsPlaying(true);
      startReadingStory(0);
    }
  }

  // Ajustar volumen (0..1)
  function setNarrationVolume(v: number) {
    setVolume(v);
  }

  // Cancelar todo (p.ej. si se cambia abruptamente de historia)
  function cancelNarration() {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setStoryFinished(true);
  }

  return {
    isPlaying,
    storyFinished,
    currentStory,
    handlePlayStory,
    handlePlayPause,
    chunkIndex,
    cancelNarration,
    setNarrationVolume,
    volume
  };
}
