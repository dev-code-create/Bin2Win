import React from 'react';
import { Container } from 'react-bootstrap';
import Header from './Header';
import Footer from './Footer';
import Navigation from './Navigation';

const Layout = ({ 
  children, 
  showNavigation = true, 
  containerFluid = false 
}) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      
      {showNavigation && <Navigation />}
      
      <main className="flex-grow-1 py-3">
        {containerFluid ? (
          <Container fluid>
            {children}
          </Container>
        ) : (
          <Container>
            {children}
          </Container>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
