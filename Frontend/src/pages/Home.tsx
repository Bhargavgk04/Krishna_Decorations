import React from 'react';
import Hero from '../components/Hero/Hero';
import Gallery from '../components/Gallery/Gallery';
import Contact from '../components/Contact/Contact';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <Gallery />
      <Contact />
    </>
  );
};

export default Home;