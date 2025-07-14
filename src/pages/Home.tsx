import React from 'react';
import Hero from '../components/Hero/Hero';
import Gallery from '../components/Gallery/Gallery';
import Services from '../components/Services/Services';
import About from '../components/About/About';
import Contact from '../components/Contact/Contact';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <Gallery />
      <Services />
      <About />
      <Contact />
    </>
  );
};

export default Home;