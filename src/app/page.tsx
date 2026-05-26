'use client';

import { useState } from 'react';

interface Photo {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
}

const samplePhotos: Photo[] = [
  {
    id: 1,
    title: 'Summer Moments',
    description: 'Golden hour with loved ones',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&h=400&fit=crop',
    category: 'outdoor',
  },
  {
    id: 2,
    title: 'Celebration Day',
    description: 'Special moments together',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=400&fit=crop',
    category: 'celebration',
  },
  {
    id: 3,
    title: 'Cozy Evenings',
    description: 'Warmth and togetherness',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&h=400&fit=crop',
    category: 'indoor',
  },
  {
    id: 4,
    title: 'Adventure Time',
    description: 'Exploring together',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&h=400&fit=crop',
    category: 'outdoor',
  },
  {
    id: 5,
    title: 'Precious Moments',
    description: 'Love and connection',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=400&fit=crop',
    category: 'celebration',
  },
  {
    id: 6,
    title: 'Timeless Memories',
    description: 'Forever in our hearts',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&h=400&fit=crop',
    category: 'indoor',
  },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['outdoor', 'celebration', 'indoor'];
  const filteredPhotos = selectedCategory
    ? samplePhotos.filter((photo) => photo.category === selectedCategory)
    : samplePhotos;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-accent-soft/20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-warm to-accent-terracotta flex items-center justify-center">
              <span className="text-white font-serif text-lg font-bold">F</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Family Gallery</h1>
          </div>
          <div className="flex items-center gap-6">
            <a href="#gallery" className="text-secondary hover:text-foreground transition-colors">
              Gallery
            </a>
            <a href="#about" className="text-secondary hover:text-foreground transition-colors">
              About
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative w-full min-h-96 flex items-center justify-center overflow-hidden bg-gradient-to-b from-accent-soft/30 to-background">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-warm/20 to-accent-terracotta/20" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h2 className="font-serif text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
            Cherish Every Moment
          </h2>
          <p className="text-xl text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
            A beautiful collection of family memories. Every photo tells a story of love, 
            laughter, and the precious moments that make us who we are.
          </p>
          <a
            href="#gallery"
            className="inline-flex px-8 py-3 rounded-lg bg-primary-warm text-white font-medium hover:bg-accent-terracotta transition-colors shadow-md hover:shadow-lg"
          >
            View Gallery
          </a>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Filter Section */}
        <div id="gallery" className="mb-12 scroll-mt-20">
          <h3 className="font-serif text-3xl font-bold text-foreground mb-6">Our Gallery</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-primary-warm text-white shadow-md'
                  : 'bg-accent-soft text-foreground hover:bg-primary-warm hover:text-white'
              }`}
            >
              All Moments
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium capitalize transition-all ${
                  selectedCategory === category
                    ? 'bg-primary-warm text-white shadow-md'
                    : 'bg-accent-soft text-foreground hover:bg-primary-warm hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800"
            >
              {/* Image Container */}
              <div className="relative w-full h-64 overflow-hidden bg-accent-soft/10">
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h4 className="font-serif text-lg font-semibold text-foreground mb-2">
                  {photo.title}
                </h4>
                <p className="text-secondary text-sm mb-4">{photo.description}</p>
                <span className="inline-block px-3 py-1 bg-accent-soft text-foreground text-xs font-medium rounded-full capitalize">
                  {photo.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="bg-accent-soft/20 py-16 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-serif text-4xl font-bold text-foreground mb-6">About Our Gallery</h3>
          <p className="text-lg text-secondary mb-8 leading-relaxed max-w-2xl mx-auto">
            This gallery celebrates the bonds that connect us. Each photograph is a window into 
            moments filled with joy, growth, and unconditional love. Through these images, we honor 
            the stories our family tells and the memories we treasure forever.
          </p>
          <button className="px-8 py-3 rounded-lg bg-accent-terracotta text-white font-medium hover:bg-primary-warm transition-colors shadow-md hover:shadow-lg">
            Share Your Photos
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-accent-soft/20 bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-secondary">
          <p>© 2024 Family Photo Gallery. All memories preserved with love.</p>
        </div>
      </footer>
    </div>
  );
}
