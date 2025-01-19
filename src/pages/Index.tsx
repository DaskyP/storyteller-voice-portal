// src/pages/Index.tsx
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import { StoryCategory } from "../types/Story"
import StoryList from "@/components/StoryList"
import AudioPlayer from "@/components/AudioPlayer"
import { stories } from "@/components/StoryList"

import { useNarration } from "@/hooks/useNarration"
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition"

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast"

export default function Index() {
  // =========== Narración ============
  const {
    isPlaying,
    storyFinished,
    currentStory,
    handlePlayStory,
    handlePlayPause,
    handlePause,       
    cancelNarration,
    chunkIndex,
    setNarrationVolume,
    volume
  } = useNarration()

  // =========== Estados UI ===========
  const [selectedCategory, setSelectedCategory] = React.useState<StoryCategory | undefined>(undefined)

  // Toast de comandos
  const [commandToastOpen, setCommandToastOpen] = React.useState(false)
  const [commandMessage, setCommandMessage] = React.useState("")

  function showCommandToast(message: string) {
    setCommandMessage(message)
    setCommandToastOpen(true)
  }

  function speakFeedback(text: string) {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }

  // =========== Voice Recognition ===========
  const {
    startVoiceControl,
    stopRecognition,
    voiceControlActive
  } = useVoiceRecognition({
    // Comando genérico "reproducir" / "play"
    onPlayPause: () => {
      showCommandToast("Comando: reproducir / pausar")
      handlePlayPause()
    },
    // Comando: "reproducir X"
    onPlayStory: (storyTitle: string) => {
      showCommandToast(`Comando: reproducir «${storyTitle}»`)
      const filtered = selectedCategory
        ? stories.filter(s => s.category === selectedCategory)
        : stories
      const found = filtered.find(st =>
        st.title.toLowerCase().includes(storyTitle.toLowerCase())
      )
      if (found) {
        // Matar narración previa y reset
        cancelNarration()
        // Ahora reproducir la historia deseada
        handlePlayStory(found)
      } else {
        speakFeedback("No se encontró la historia solicitada.")
      }
    },
    // Comando: "listar"
    onListStories: () => {
      showCommandToast("Comando: listar")
      listCurrentStories()
    },
    // Comando: "dormir", "diversión", etc.
    onSetCategory: (cat: StoryCategory) => {
      showCommandToast(`Comando: sección => ${cat}`)
      setSelectedCategory(cat)
      speakFeedback(`Cambiando a la sección ${mapCategory(cat)}`)
    },
    // Comando: "siguiente"
    onNext: () => {
      showCommandToast("Comando: siguiente")
      handleNext()
    },
    // Comando: "anterior"
    onPrevious: () => {
      showCommandToast("Comando: anterior")
      handlePrevious()
    },
    // Comando: "pausa" (nuevo)
    onPause: () => {
      showCommandToast("Comando: pausa")
      handlePause()  // Llamamos la pausa pura
    }
  })

  // Efecto para Ctrl / Z
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        startVoiceControl()
        showCommandToast("Tecla Ctrl → Activar voz")
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault()
        stopRecognition()
        speakCommands()
        showCommandToast("Tecla Z → Mostrar comandos")
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [startVoiceControl, stopRecognition])

  // Helpers
  function handleNext() {
    if (!currentStory) return
    speakFeedback("Siguiente cuento")
    const articles = document.querySelectorAll('[role="article"]')
    const idx = Array.from(articles).findIndex(el =>
      el.getAttribute('aria-label')?.includes(currentStory.title)
    )
    if (idx < articles.length - 1) {
      (articles[idx + 1].querySelector('button') as HTMLButtonElement)?.click()
    }
  }

  function handlePrevious() {
    if (!currentStory) return
    speakFeedback("Cuento anterior")
    const articles = document.querySelectorAll('[role="article"]')
    const idx = Array.from(articles).findIndex(el =>
      el.getAttribute('aria-label')?.includes(currentStory.title)
    )
    if (idx > 0) {
      (articles[idx - 1].querySelector('button') as HTMLButtonElement)?.click()
    }
  }

  function listCurrentStories() {
    const filtered = selectedCategory
      ? stories.filter(s => s.category === selectedCategory)
      : stories
    if (!filtered.length) {
      speakFeedback("No hay cuentos en esta sección")
      return
    }
    let msg = selectedCategory 
      ? `Sección ${mapCategory(selectedCategory)}. Cuentos disponibles: `
      : "Cuentos disponibles: "
    filtered.forEach((s, i) => {
      msg += s.title + (i < filtered.length - 1 ? ', ' : '.')
    })
    speakFeedback(msg)
  }

  function mapCategory(cat: StoryCategory) {
    return {
      sleep: 'dormir',
      fun: 'diversión',
      educational: 'educativo',
      adventure: 'aventuras'
    }[cat]
  }

  function speakCommands() {
    speechSynthesis.cancel()
    speakFeedback(`
      Comandos de voz:
      - "reproducir" o "play": pausar, reanudar, o reiniciar si terminó
      - "reproducir nombre-del-cuento"
      - "pausa": para pausar sin reanudar
      - "siguiente": pasar al siguiente cuento
      - "anterior": cuento anterior
      - "dormir", "diversión", "educativo", "aventuras": cambiar de sección
      - "listar": enumerar cuentos de la sección actual
      Presiona Ctrl para reactivar la voz.
    `)
  }

  const categories: { id: StoryCategory; name: string }[] = [
    { id: 'sleep', name: 'Para Dormir' },
    { id: 'fun', name: 'Diversión' },
    { id: 'educational', name: 'Educativos' },
    { id: 'adventure', name: 'Aventuras' },
  ]

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <main className="container py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" tabIndex={0}>
              Cuentacuentos Accesible
            </h1>
            <p
              className="text-xl text-gray-600 max-w-2xl mx-auto mb-8"
              tabIndex={0}
            >
              Presiona <strong>Control</strong> para activar o reactivar la voz.
              Presiona <strong>Z</strong> para detener la escucha y escuchar los comandos.
            </p>
            <Button
              onClick={startVoiceControl}
              className={`bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto ${
                voiceControlActive ? 'ring-2 ring-green-400' : ''
              }`}
            >
              <Mic className="w-5 h-5" />
              {voiceControlActive ? 'Control por Voz Activo' : 'Activar Control por Voz'}
            </Button>
          </header>

          <div className="mb-8 flex gap-4 justify-center">
            {categories.map(cat => (
              <Button
                key={cat.id}
                onClick={() => {
                  // Cancelar narración si estaba reproduciendo
                  cancelNarration()
                  setSelectedCategory(cat.id)
                }}
                className={`bg-green-600 hover:bg-green-700 text-white ${
                  selectedCategory === cat.id ? 'ring-2 ring-green-400' : ''
                }`}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          <section 
            aria-label="Lista de cuentos disponibles" 
            className="mb-24"
          >
            <StoryList
              selectedCategory={selectedCategory}
              onPlayStory={(story) => {
                // Si reproducimos manualmente, matamos la anterior
                cancelNarration()
                handlePlayStory(story)
              }}
            />
          </section>

          {currentStory && (
            <AudioPlayer
              title={currentStory.title}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onVolumeChange={(vol) => setNarrationVolume(vol[0] / 100)}
            />
          )}
        </main>

        {/* Toast que muestra el último comando */}
        <Toast
          open={commandToastOpen}
          onOpenChange={setCommandToastOpen}
          variant="default"
        >
          <div>
            <ToastTitle>Nuevo comando detectado</ToastTitle>
            <ToastDescription>{commandMessage}</ToastDescription>
          </div>
          <ToastClose />
        </Toast>

        <ToastViewport />
      </div>
    </ToastProvider>
  )
}
