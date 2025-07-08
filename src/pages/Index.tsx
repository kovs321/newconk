
import React from 'react';
import { Canvas } from '../components/Canvas';
import { Header } from '../components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              Digital Canvas Studio
            </h1>
            <p className="text-lg text-slate-600">
              Create, draw, and design with powerful canvas tools
            </p>
          </div>
          <Canvas />
        </div>
      </main>
    </div>
  );
};

export default Index;
