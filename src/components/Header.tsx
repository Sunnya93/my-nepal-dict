"use client";

import Link from 'next/link';
import { Navbar, Container } from 'react-bootstrap';

export default function Header() {
  return (
    <div className="py-3">
      <Navbar expand="sm" className="glass rounded-4 px-2" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Container fluid>
          <Navbar.Brand as={Link} href="/" className="fw-bold">
            네팔어 단어장 <span className="badge badge-soft ms-2">Web</span>
          </Navbar.Brand>
        </Container>
      </Navbar>
    </div>
  );
}


