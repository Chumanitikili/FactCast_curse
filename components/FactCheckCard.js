import styled from "styled-components";

const Card = styled.div`
  background: linear-gradient(135deg, #191414 60%, #1db954 100%);
  color: #fff;
  border-radius: 20px;
  padding: 1.5em;
  margin-top: 2rem;
  font-family: inherit;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
`;

const StatusDot = styled.span<{ color: string }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  background: ${({ color }) => color};
  border-radius: 50%;
  margin-right: 8px;
`;

export function FactCheckCard({ claim, verdict, sources, confidence }) {
  let color = "#1db954";
  if (verdict === "Uncertain") color = "#ffd600";
  if (verdict === "False") color = "#e22134";

  return (
    <Card>
      <h2>{claim}</h2>
      <div>
        <StatusDot color={color} />
        <strong>{verdict}</strong> <span>({confidence}%)</span>
      </div>
      <ol>
        {sources.map(src => (
          <li key={src.url}>
            <a href={src.url} target="_blank" rel="noopener noreferrer">{src.name || src.url}</a>
          </li>
        ))}
      </ol>
    </Card>
  );
}
