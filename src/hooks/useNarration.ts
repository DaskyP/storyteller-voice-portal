import { useState, useRef } from "react";
import { Story } from "../types/Story";

const WORDS_PER_CHUNK = 20;

export function useNarration() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [storyFinished, setStoryFinished] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [chunkIndex, setChunkIndex] = useState<number>(0);
  const [volume, setVolume] = useState(1);

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Divide texto en chunks (~20 palabras)
  function splitTextByWords(text: string, wordsPerChunk = WORDS_PER_CHUNK) {
    const words = text.split(/\s+/);
    const result: string[] = [];
    let temp: string[] = [];

    for (const word of words) {
      if (temp.length >= wordsPerChunk) {
        result.push(temp.join(" "));
        temp = [];
      }
      temp.push(word);
    }
    if (temp.length > 0) {
      result.push(temp.join(" "));
    }
    return result;
  }

  // Reproduce un chunk específico
  function playChunk(index: number) {
    if (!chunks[index]) {
      setStoryFinished(true);
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    currentUtteranceRef.current = utterance;

    utterance.volume = volume;
    utterance.lang = "es-ES";
    utterance.rate = 0.9;

    utterance.onend = () => {
      const nextIndex = index + 1;
      setChunkIndex(nextIndex);

      if (nextIndex < chunks.length) {
        playChunk(nextIndex);
      } else {
        setStoryFinished(true);
        setIsPlaying(false);
      }
    };

    utterance.onerror = (error) => {
      console.error("Error en utterance:", error);
      setIsPlaying(false);
    };

    speechSynthesis.speak(utterance);
  }

  function startReadingStory(fromIndex: number) {
    setStoryFinished(false);
    setChunkIndex(fromIndex);
    playChunk(fromIndex);
  }

  // =========== API HOOK ===========

  function handlePlayStory(story: Story) {
    if (!speechSynthesis) {
      console.warn("No hay soporte para speechSynthesis");
      return;
    }

    // Cancelar cualquier narración previa
    speechSynthesis.cancel();

    setCurrentStory(story);
    setStoryFinished(false);
    setChunkIndex(0);
    setChunks(splitTextByWords(story.content));
    setIsPlaying(true);

    // Iniciar la narración
    startReadingStory(0);
  }

  function handlePlayPause() {
    if (!speechSynthesis) return;

    if (isPlaying && !storyFinished) {
      speechSynthesis.pause();
      setIsPlaying(false);
    } else if (!isPlaying && !storyFinished) {
      speechSynthesis.resume();
      setIsPlaying(true);
    } else if (storyFinished && currentStory) {
      speechSynthesis.cancel();
      setChunkIndex(0);
      setIsPlaying(true);
      startReadingStory(0);
    }
  }

  function handlePause() {
    if (isPlaying && !storyFinished) {
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  }

  function cancelNarration() {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setStoryFinished(true);
    setCurrentStory(null);
    setChunks([]);
    setChunkIndex(0);
  }

  function setNarrationVolume(vol: number) {
    setVolume(vol);
  }

  return {
    isPlaying,
    storyFinished,
    currentStory,
    handlePlayStory,
    handlePlayPause,
    handlePause,
    cancelNarration,
    setNarrationVolume,
    chunkIndex,
    volume,
  };
}
