// src/hooks/useVoiceRecognition.ts
import { useState, useRef } from 'react'
import { StoryCategory } from '../types/Story'

interface UseVoiceRecognitionParams {
  onPlayPause: () => void
  onPlayStory: (storyTitle: string) => void
  onListStories: () => void
  onSetCategory: (cat: StoryCategory) => void

  onNext?: () => void
  onPrevious?: () => void
}

export function useVoiceRecognition({
  onPlayPause,
  onPlayStory,
  onListStories,
  onSetCategory,
  onNext,
  onPrevious,
}: UseVoiceRecognitionParams) {
  const [voiceControlActive, setVoiceControlActive] = useState(false)
  const recognitionRef = useRef<any>(null)

  function stopRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setVoiceControlActive(false)
  }

  function startVoiceControl() {
    stopRecognition()
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn("No hay soporte de SpeechRecognition")
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'es-ES'
    recognition.continuous = true

    recognition.onresult = (evt: SpeechRecognitionEvent) => {
      const command = evt.results[evt.results.length - 1][0].transcript.toLowerCase()

      if (command.includes('reproducir') || command.includes('play')) {
        const singleWord = (command.trim() === 'reproducir' || command.trim() === 'play')
        if (singleWord) {
          onPlayPause()
        } else {
          // reproducir X
          const storyPart = command.replace('reproducir','').replace('play','').trim()
          onPlayStory(storyPart)
        }
      } 
      else if (command.includes('listar')) {
        onListStories()
      }
      else if (command.includes('dormir')) {
        onSetCategory('sleep')
      }
      else if (command.includes('diversión')) {
        onSetCategory('fun')
      }
      else if (command.includes('educativo')) {
        onSetCategory('educational')
      }
      else if (command.includes('aventuras')) {
        onSetCategory('adventure')
      }
      // (2) Manejar "siguiente" y "anterior"
      else if (command.includes('siguiente') || command.includes('next')) {
        if (onNext) onNext()
      }
      else if (command.includes('anterior') || command.includes('previous')) {
        if (onPrevious) onPrevious()
      }
    }

    recognition.start()
    setVoiceControlActive(true)
  }

  return {
    startVoiceControl,
    stopRecognition,
    voiceControlActive
  }
}
