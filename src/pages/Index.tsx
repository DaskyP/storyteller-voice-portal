import React, { useState, useEffect, useRef } from 'react';
import StoryList from '@/components/StoryList';
import AudioPlayer from '@/components/AudioPlayer';
import { Button } from '@/components/ui/button';
import { StoryCategory, Story } from '../types/Story';
import { Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stories } from '@/components/StoryList';

type SpeechRecognitionType = any; // Evita problemas de types

export default function Index() {
  const { toast } = useToast();

  // ======= Estados generales =======
  const [isPlaying, setIsPlaying] = useState(false);        // Indica si está reproduciendo o en pausa
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory | undefined>();
  const [voiceControlActive, setVoiceControlActive] = useState(false);
  const [volume, setVolume] = useState(1);

  // ======= Manejo de la narración en chunks =======
  const [chunks, setChunks] = useState<string[]>([]);       // Trozos de texto
  const [chunkIndex, setChunkIndex] = useState<number>(0);  // Índice del chunk actual
  const [storyFinished, setStoryFinished] = useState(false);

  // Para almacenamiento del utterance actual
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Reconocimiento de voz
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // ================
  // Efectos
  // ================
  useEffect(() => {
    // Si la voz está activa y cambia la sección, listar
    if (voiceControlActive && selectedCategory) {
      listCurrentStories();
    }
  }, [voiceControlActive, selectedCategory]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        startVoiceControl();
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        stopRecognition();
        speakCommands();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ====================================
  // 1) Dividir texto en ~40 palabras
  // ====================================
  function splitTextByWords(text: string, wordsPerChunk = 40) {
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
    if (temp.length > 0) {
      result.push(temp.join(' '));
    }
    return result;
  }

  // ====================================
  // 2) Reproducir un chunk (event-based)
  // ====================================
  function playChunk(index: number) {
    if (!chunks[index]) {
      // No hay chunk -> terminamos
      setStoryFinished(true);
      setIsPlaying(false);
      return;
    }
    // Crear un utterance para el chunk actual
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    currentUtteranceRef.current = utterance;

    utterance.volume = volume;
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;

    // Al terminar este chunk, pasamos al siguiente
    utterance.onend = () => {
      // Asegurar que no sea que el usuario pausó manualmente
      // Si se pausó, onend no se dispara hasta que retoma y acaba el chunk
      let nextIndex = index + 1;
      setChunkIndex(nextIndex);
      if (nextIndex < chunks.length) {
        // Reproducir siguiente
        playChunk(nextIndex);
      } else {
        // Terminó el cuento
        setStoryFinished(true);
        setIsPlaying(false);
      }
    };

    utterance.onerror = (e) => {
      console.error("Error en utterance:", e);
      setIsPlaying(false);
    };

    // Reproducir
    speechSynthesis.speak(utterance);
  }

  // ====================================
  // 3) Empezar la narración
  // ====================================
  function startReadingStory(fromIndex: number) {
    setStoryFinished(false);
    setChunkIndex(fromIndex);
    playChunk(fromIndex); 
  }

  // ====================================
  // 4) Reproducir historia
  // ====================================
  function handlePlayStory(story: Story) {
    if (!speechSynthesis) {
      showSpeechError();
      return;
    }
    // Cancelar cualquier narración previa
    speechSynthesis.cancel();

    // Si es otra historia o ya terminó, reiniciamos chunkIndex
    let localIndex = 0;
    // (Opcional: leer localStorage para retomar, si deseas)

    setCurrentStory(story);
    setChunks(splitTextByWords(story.content, 40));
    setStoryFinished(false);
    setIsPlaying(true);
    // Comenzar en localIndex
    startReadingStory(localIndex);
  }

  // ====================================
  // 5) Pausar / Reanudar / Reiniciar
  // ====================================
  function handlePlayPause() {
    if (!speechSynthesis) return;

    // Si está reproduciendo => Pausar
    if (isPlaying && !storyFinished) {
      speechSynthesis.pause();
      speakFeedback("Narración en pausa");
      setIsPlaying(false);
    }
    // Si está pausado => Reanudar
    else if (!isPlaying && !storyFinished) {
      speechSynthesis.resume();
      speakFeedback("Reanudando narración");
      setIsPlaying(true);
    }
    // Terminó => Reiniciar
    else if (storyFinished && currentStory) {
      speakFeedback("Iniciando de nuevo");
      speechSynthesis.cancel();
      setIsPlaying(true);
      setChunkIndex(0);
      startReadingStory(0);
    }
  }

  // ====================================
  // 6) Siguiente / Anterior
  // ====================================
  function handleNext() {
    if (!currentStory) return;
    const articles = document.querySelectorAll('[role="article"]');
    const idx = Array.from(articles).findIndex(el =>
      el.getAttribute('aria-label')?.includes(currentStory.title)
    );
    if (idx < articles.length - 1) {
      speakFeedback("Siguiente cuento");
      (articles[idx + 1].querySelector('button') as HTMLButtonElement)?.click();
    }
  }
  function handlePrevious() {
    if (!currentStory) return;
    const articles = document.querySelectorAll('[role="article"]');
    const idx = Array.from(articles).findIndex(el =>
      el.getAttribute('aria-label')?.includes(currentStory.title)
    );
    if (idx > 0) {
      speakFeedback("Cuento anterior");
      (articles[idx - 1].querySelector('button') as HTMLButtonElement)?.click();
    }
  }

  // ====================================
  // 7) Volumen
  // ====================================
  function handleVolumeChange(newVol: number[]) {
    setVolume(newVol[0] / 100);
  }

  // ====================================
  // 8) Listar historias
  // ====================================
  function listCurrentStories() {
    const filtered = selectedCategory
      ? stories.filter(s => s.category === selectedCategory)
      : stories;
    if (!filtered.length) {
      speakFeedback("No hay cuentos en esta sección");
      return;
    }
    let msg = selectedCategory
      ? `Sección ${mapCategory(selectedCategory)}. Cuentos disponibles: `
      : "Cuentos disponibles: ";
    filtered.forEach((s, i) => {
      msg += s.title + (i < filtered.length - 1 ? ', ' : '.');
    });
    speakFeedback(msg);
  }

  function mapCategory(cat: StoryCategory) {
    return {
      sleep: 'dormir',
      fun: 'diversión',
      educational: 'educativos',
      adventure: 'aventuras'
    }[cat];
  }

  // =================
  // speakFeedback
  // =================
  function speakFeedback(text: string) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // =================
  // speakCommands
  // =================
  function speakCommands() {
    speechSynthesis.cancel();
    const c = `
      Comandos de voz:
      - "reproducir" o "play": pausar, reanudar, o reiniciar si terminó
      - "siguiente": pasar al siguiente cuento
      - "anterior": cuento anterior
      - "dormir", "diversión", "educativo", "aventuras": cambiar de sección
      - "listar": enumerar cuentos de la sección actual
      - "reproducir" + título: reproducir un cuento específico
      Presiona Ctrl para reactivar la voz.
    `;
    speakFeedback(c);
  }

  // =================
  // showSpeechError
  // =================
  function showSpeechError() {
    toast({
      title: "Error",
      description: "Tu navegador no soporta la síntesis de voz.",
      variant: "destructive"
    });
  }

  // =================
  // Reconocimiento de voz
  // =================
  function stopRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceControlActive(false);
  }

  async function startVoiceControl() {
    stopRecognition();
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: "Error",
          description: "No hay soporte de reconocimiento de voz.",
          variant: "destructive"
        });
        return;
      }
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'es-ES';
      recognition.continuous = true;

      recognition.onresult = (evt: SpeechRecognitionEvent) => {
        const command = evt.results[evt.results.length - 1][0].transcript.toLowerCase();

        if (command.includes('reproducir') || command.includes('play')) {
          const single = (command.trim() === 'reproducir' || command.trim() === 'play');
          if (single) {
            handlePlayPause();
          } else {
            // reproducir X
            const stTitle = command.replace('reproducir','').replace('play','').trim();
            const filtered = selectedCategory
              ? stories.filter(s => s.category === selectedCategory)
              : stories;
            const found = filtered.find(s => s.title.toLowerCase().includes(stTitle));
            if (found) {
              speakFeedback(`Reproduciendo ${found.title}`);
              handlePlayStory(found);
            } else {
              speakFeedback("No se encontró el cuento.");
            }
          }
        } else if (command.includes('siguiente') || command.includes('next')) {
          handleNext();
        } else if (command.includes('anterior') || command.includes('previous')) {
          handlePrevious();
        } else if (command.includes('dormir')) {
          setSelectedCategory('sleep');
          speakFeedback("Sección dormir");
        } else if (command.includes('diversión')) {
          setSelectedCategory('fun');
          speakFeedback("Sección diversión");
        } else if (command.includes('educativo')) {
          setSelectedCategory('educational');
          speakFeedback("Sección educativo");
        } else if (command.includes('aventuras')) {
          setSelectedCategory('adventure');
          speakFeedback("Sección aventuras");
        } else if (command.includes('listar')) {
          listCurrentStories();
        }
      };

      recognition.start();
      setVoiceControlActive(true);

      toast({
        title: "Control por voz activado",
        description: "Use comandos de voz. Presione Z para detener la escucha."
      });
      speakFeedback("Control por voz activado. Presiona Z para detener la escucha y oír los comandos.");
    } catch (err) {
      console.error("Error al iniciar voz:", err);
      toast({
        title: "Error",
        description: "No se pudo iniciar el reconocimiento de voz.",
        variant: "destructive"
      });
    }
  }

  // ================
  // Render
  // ================
  const categories: { id: StoryCategory; name: string }[] = [
    { id: 'sleep', name: 'Para Dormir' },
    { id: 'fun', name: 'Diversión' },
    { id: 'educational', name: 'Educativos' },
    { id: 'adventure', name: 'Aventuras' }
  ];

  return (
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
            Presiona <strong>Z</strong> para escuchar los comandos y detener la voz temporalmente.
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
          {categories.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`bg-green-600 hover:bg-green-700 text-white ${
                selectedCategory === cat.id ? 'ring-2 ring-green-400' : ''
              }`}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <section aria-label="Lista de cuentos disponibles" className="mb-24">
          <StoryList
            selectedCategory={selectedCategory}
            onPlayStory={handlePlayStory}
          />
        </section>

        {currentStory && (
          <AudioPlayer
            title={currentStory.title}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onVolumeChange={handleVolumeChange}
          />
        )}
      </main>
    </div>
  );
}
