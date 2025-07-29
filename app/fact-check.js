import React, { useState } from "react";
import { FactCheckCard } from "./components/FactCheckCard";
import { useFactCheck } from "./hooks/useFactCheck";
import styled, { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Circular', 'San Francisco', Arial, sans-serif;
    background: #191414;
    color: #fff;
    margin: 0;
    min-height: 100vh;
  }
`;

const Container = styled.div`
  max-width: 660px;
  margin: 0 auto;
  padding: 2rem;
`;

const Input = styled.textarea`
  width: 100%;
  font-size: 1.2rem;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  margin-bottom: 1.2rem;
  background: #232323;
  color: #fff;
`;

const Button = styled.button`
  background: #1db954;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #169c43; }
`;

export default function App() {
  const [input, setInput] = useState("");
  const { loading, result, checkFact } = useFactCheck();

  return (
    <>
      <GlobalStyle />
      <Container>
        <h1>FactCast 🕵️‍♂️</h1>
        <p>Paste or type a claim to fact-check it in real-time, or use your microphone.</p>
        <Input
          rows={3}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter a claim or statement to fact-check..."
        />
        <Button onClick={() => checkFact(input)} disabled={loading || !input}>
          {loading ? "Checking..." : "Check Fact"}
        </Button>
        {result && (
          <FactCheckCard
            claim={result.claim}
            verdict={result.verdict}
            sources={result.sources}
            confidence={result.confidence}
          />
        )}
      </Container>
    </>
  );
}
