// src/hooks/useNarration.ts
import { useState, useRef } from 'react'
import { Story } from '../types/Story'

const WORDS_PER_CHUNK = 40

export function useNarration() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [storyFinished, setStoryFinished] = useState(false)
  const [currentStory, setCurrentStory] = useState<Story | null>(null)
  const [chunks, setChunks] = useState<string[]>([])
  const [chunkIndex, setChunkIndex] = useState<number>(0)
  const [volume, setVolume] = useState(1) // de 0 a 1

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Divide el texto en trozos (~40 palabras)
  function splitTextByWords(text: string, wordsPerChunk: number = WORDS_PER_CHUNK) {
    const words = text.split(/\s+/)
    const result: string[] = []
    let temp: string[] = []

    for (const w of words) {
      if (temp.length >= wordsPerChunk) {
        result.push(temp.join(' '))
        temp = []
      }
      temp.push(w)
    }
    if (temp.length > 0) result.push(temp.join(' '))
    return result
  }

  // Reproducir un chunk por evento
  function playChunk(index: number) {
    if (!chunks[index]) {
      // No hay chunk => historia terminada
      setStoryFinished(true)
      setIsPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index])
    currentUtteranceRef.current = utterance
    utterance.volume = volume
    utterance.lang = 'es-ES'
    utterance.rate = 0.9

    utterance.onend = () => {
      const nextIndex = index + 1
      setChunkIndex(nextIndex)
      if (nextIndex < chunks.length) {
        playChunk(nextIndex)
      } else {
        // Fin
        setStoryFinished(true)
        setIsPlaying(false)
      }
    }

    utterance.onerror = (e) => {
      console.error("Error en utterance:", e)
      setIsPlaying(false)
    }

    speechSynthesis.speak(utterance)
  }

  function startReadingStory(fromIndex: number) {
    setStoryFinished(false)
    setChunkIndex(fromIndex)
    playChunk(fromIndex)
  }

  // =========== API HOOK ===========

  // Reproducir nueva historia
  function handlePlayStory(story: Story) {
    if (!speechSynthesis) {
      console.warn("No hay soporte de speechSynthesis en este navegador")
      return
    }
    // Cancelar narración previa
    speechSynthesis.cancel()

    setCurrentStory(story)
    setStoryFinished(false)
    setChunkIndex(0)
    setIsPlaying(true)

    const parted = splitTextByWords(story.content)
    setChunks(parted)

    startReadingStory(0)
  }

  // Toggle pausar / reanudar / reiniciar
  function handlePlayPause() {
    if (!speechSynthesis) return

    if (isPlaying && !storyFinished) {
      // Pausar
      speechSynthesis.pause()
      setIsPlaying(false)
    } else if (!isPlaying && !storyFinished) {
      // Reanudar
      speechSynthesis.resume()
      setIsPlaying(true)
    } else if (storyFinished && currentStory) {
      // Reiniciar desde 0
      speechSynthesis.cancel()
      setChunkIndex(0)
      setIsPlaying(true)
      startReadingStory(0)
    }
  }

  // Nueva función "pausa" pura (sin reanudar)
  function handlePause() {
    if (!speechSynthesis) return
    // Pausar sólo si está reproduciendo y no terminó
    if (isPlaying && !storyFinished) {
      speechSynthesis.pause()
      setIsPlaying(false)
    }
  }

  // Ajustar volumen (0..1)
  function setNarrationVolume(v: number) {
    setVolume(v)
  }

  // Cancelar todo
  function cancelNarration() {
    speechSynthesis.cancel()
    setIsPlaying(false)
    setStoryFinished(true)
    setCurrentStory(null)
    setChunks([])
    setChunkIndex(0)
  }

  return {
    isPlaying,
    storyFinished,
    currentStory,
    handlePlayStory,
    handlePlayPause,
    handlePause,   // <-- Exponemos la función pura "pausa"
    chunkIndex,
    cancelNarration,
    setNarrationVolume,
    volume
  }
}
