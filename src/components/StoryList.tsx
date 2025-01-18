import React from 'react';
import StoryCard from './StoryCard';
import { Story, StoryCategory } from '../types/Story';

export const stories: Story[] = [
  {
    id: 1,
    title: "El Principito",
    description: "Un clásico de Antoine de Saint-Exupéry sobre un pequeño príncipe que viaja por diferentes planetas.",
    duration: "45 minutos",
    category: "educational",
    content: "En un pequeño planeta vivía un principito. Un día, decidió explorar el universo y comenzó a visitar diferentes planetas, cada uno habitado por un personaje peculiar. En el primer planeta encontró a un rey que creía gobernar sobre las estrellas. En el segundo, a un vanidoso que quería ser admirado por todos. En el tercero, a un bebedor que bebía para olvidar que sentía vergüenza de beber,En un pequeño planeta vivía un principito. Un día, decidió explorar el universo y comenzó a visitar diferentes planetas, cada uno habitado por un personaje peculiar. En el primer planeta encontró a un rey que creía gobernar sobre las estrellas. En el segundo, a un vanidoso que quería ser admirado por todos. En el tercero, a un bebedor que bebía para olvidar que sentía vergüenza de beber"
  },
  {
    id: 2,
    title: "La Sirenita",
    description: "Una hermosa historia sobre una sirena que sueña con vivir en el mundo terrestre.",
    duration: "30 minutos",
    category: "fun",
    content: "En lo profundo del océano vivía una joven sirena con una hermosa voz. Ella soñaba con conocer el mundo de los humanos y especialmente al apuesto príncipe que había visto una vez desde la superficie. Un día, decidió hacer un trato con la bruja del mar, quien le ofreció piernas a cambio de su voz..."
  },
  {
    id: 3,
    title: "El Patito Feo",
    description: "Un cuento sobre la aceptación y la transformación personal.",
    duration: "25 minutos",
    category: "sleep",
    content: "En una granja nació un patito diferente a sus hermanos. Era más grande y de un color distinto. Los otros animales se burlaban de él, pero no sabían que estaba destinado a convertirse en algo hermoso. A través de las estaciones, el patito enfrentó muchas dificultades, pero al final descubrió que era un hermoso cisne..."
  },
  {
    id: 4,
    title: "Caperucita Roja",
    description: "La clásica historia de una niña, su abuela y un lobo astuto.",
    duration: "20 minutos",
    category: "adventure",
    content: "Había una vez una niña que siempre llevaba una capa roja. Un día, su madre le pidió que llevara una cesta con comida a su abuela enferma. En el camino por el bosque, se encontró con un lobo astuto que la engañó para tomar un camino más largo..."
  },
  {
    id: 5,
    title: "Los Tres Cerditos",
    description: "Una historia sobre la importancia del trabajo bien hecho.",
    duration: "25 minutos",
    category: "educational",
    content: "Tres cerditos decidieron construir sus propias casas. El primero la hizo de paja, el segundo de madera y el tercero, más trabajador, la construyó de ladrillos. Cuando vino el lobo feroz, sopló y sopló, y las casas de paja y madera derribó..."
  },
  {
    id: 6,
    title: "Hansel y Gretel",
    description: "Una aventura de dos hermanos en un bosque mágico.",
    duration: "35 minutos",
    category: "adventure",
    content: "En un tiempo de hambruna, dos hermanos fueron abandonados en el bosque por sus padres. Dejando migas de pan para encontrar el camino de regreso, se adentraron en el bosque hasta encontrar una casa hecha de dulces..."
  },
  {
    id: 7,
    title: "La Bella Durmiente",
    description: "Un cuento mágico sobre una princesa y una maldición.",
    duration: "30 minutos",
    category: "sleep",
    content: "Una princesa nació en un reino lejano, pero una bruja malvada la maldijo: al cumplir 16 años, se pincharía con una rueca y caería en un profundo sueño. Solo el beso del verdadero amor podría despertarla..."
  },
  {
    id: 8,
    title: "El Gato con Botas",
    description: "Las astutas aventuras de un gato muy especial.",
    duration: "28 minutos",
    category: "fun",
    content: "Un molinero dejó como herencia a su hijo menor solo un gato. Pero este no era un gato común: era astuto y sabía hablar. Con un par de botas y mucho ingenio, ayudó a su amo a convertirse en el Marqués de Carabás..."
  }
];

interface StoryListProps {
  selectedCategory?: StoryCategory;
  onPlayStory: (story: Story) => void;
}

const StoryList = ({ selectedCategory, onPlayStory }: StoryListProps) => {
  const filteredStories = selectedCategory 
    ? stories.filter(story => story.category === selectedCategory)
    : stories;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredStories.map((story) => (
        <StoryCard
          key={story.id}
          title={story.title}
          description={story.description}
          duration={story.duration}
          onPlay={() => onPlayStory(story)}
        />
      ))}
    </div>
  );
};

export default StoryList;