export const providers = [
  { name: 'Claude Code', color: '#fbbf24', installed: true },
  { name: 'OpenCode', color: '#10b981', installed: true },
  { name: 'OpenAI', color: '#3b82f6', installed: false },
  { name: 'Gemini', color: '#8b5cf6', installed: false },
  { name: 'DeepSeek', color: '#ec4899', installed: false },
  { name: 'Llama 4', color: '#f59e0b', installed: false },
  { name: 'MiniMax', color: '#06b6d4', installed: false },
  { name: 'Ollama', color: '#6366f1', installed: false },
];

export const models = [
  { name: 'Opus 4.6', provider: 'Claude', description: 'Most capable model' },
  { name: 'Sonnet 4.5', provider: 'Claude', description: 'Balanced performance' },
  { name: 'GPT-5.3 Codex', provider: 'OpenAI', description: 'Code generation expert' },
  { name: 'Gemini 3 Pro', provider: 'Google', description: 'Multimodal reasoning' },
  { name: 'DeepSeek R1', provider: 'DeepSeek', description: 'Open source flagship' },
  { name: 'Llama 4 400B', provider: 'Meta', description: 'Latest open model' },
  { name: 'MiniMax-Text', provider: 'MiniMax', description: 'Chinese LLM' },
];
