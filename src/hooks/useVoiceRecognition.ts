import { useState, useRef } from 'react'
import { StoryCategory } from '../types/Story'

interface UseVoiceRecognitionParams {
  onPlayPause: () => void
  onPlayStory: (storyTitle: string) => void
  onListStories: () => void
  onSetCategory: (cat: StoryCategory) => void
  onNext?: () => void
  onPrevious?: () => void
  onPause?: () => void
}

export function useVoiceRecognition({
  onPlayPause,
  onPlayStory,
  onListStories,
  onSetCategory,
  onNext,
  onPrevious,
  onPause,
}: UseVoiceRecognitionParams) {
  const [voiceControlActive, setVoiceControlActive] = useState(false)
  const recognitionRef = useRef<any>(null)

  function stopRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setVoiceControlActive(false)
  }

  function startVoiceControl() {
    if (voiceControlActive) return // si ya está activo, no reiniciar

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
      const command = evt.results[evt.results.length - 1][0].transcript.toLowerCase().trim()

      // "reproducir" / "play" sin título => toggle
      if (command === 'reproducir' || command === 'play') {
        onPlayPause()
      }
      // "reproducir X"
      else if (command.startsWith('reproducir') || command.startsWith('play')) {
        const storyPart = command.replace('reproducir','').replace('play','').trim()
        onPlayStory(storyPart)
      }
      else if (command.includes('pausa') || command.includes('pausar')) {
        onPause?.()
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
      else if (command.includes('siguiente') || command.includes('next')) {
        onNext?.()
      }
      else if (command.includes('anterior') || command.includes('previous')) {
        onPrevious?.()
      }
    }

    recognition.start()
    setVoiceControlActive(true)
  }

  return {
    voiceControlActive,
    startVoiceControl,
    stopRecognition
  }
}
