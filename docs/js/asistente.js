import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qqjhadwxboeichxtxree.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxamhhZHd4Ym9laWNoeHR4cmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDY4ODAsImV4cCI6MjA5NTQyMjg4MH0.dM1VaV-lDPxoPlOHGAIbgfCSE3RMdURcVubq8tTs6yQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_ASSISTANT = {
  id: 'default-ia-bot',
  name: 'Asistente Principal',
  gltf_url: './assets/img/ia.gltf',
  poster_url: './assets/img/logopwa.png'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadAssistantsList();
});

async function loadAssistantsList() {
  const container = document.getElementById('assistants-grid');
  if (!container) return;

  let assistants = [];
  try {
    const { data, error } = await supabase
      .from('assistants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      assistants = data;
    }
  } catch (err) {
    console.warn('Error al obtener asistentes desde Supabase:', err);
  }

  // Ensure default assistant is always available
  if (assistants.length === 0) {
    assistants = [DEFAULT_ASSISTANT];
  } else {
    const hasDefault = assistants.some(a => a.gltf_url === DEFAULT_ASSISTANT.gltf_url);
    if (!hasDefault) {
      assistants.unshift(DEFAULT_ASSISTANT);
    }
  }

  // Get currently selected assistant ID
  let activeAssistantId = '';
  try {
    const rawActive = localStorage.getItem('ia_agent_selected_assistant');
    if (rawActive) {
      const parsed = JSON.parse(rawActive);
      activeAssistantId = parsed.id || parsed.gltf_url;
    }
  } catch (e) {}

  container.innerHTML = '';

  assistants.forEach(assistant => {
    const isSelected = activeAssistantId === (assistant.id || assistant.gltf_url) ||
      (!activeAssistantId && assistant.gltf_url === DEFAULT_ASSISTANT.gltf_url);

    const card = document.createElement('div');
    card.className = `assistant-card ${isSelected ? 'active' : ''}`;

    const posterAttr = assistant.poster_url ? `poster="${assistant.poster_url}"` : '';

    // Only GLTF model viewer and the selection button
    card.innerHTML = `
      <div class="model-viewer-wrapper">
        <model-viewer
          src="${assistant.gltf_url}"
          ${posterAttr}
          alt="${assistant.name || 'Modelo GLTF'}"
          camera-controls
          auto-rotate
          rotation-per-second="4deg"
          disable-zoom
          disable-pan
          interaction-prompt="none"
          touch-action="pan-y"
          shadow-intensity="1"
          shadow-softness="0.8"
          exposure="1"
        >
        </model-viewer>
      </div>
      <button class="btn-select-assistant" data-id="${assistant.id || assistant.gltf_url}">
        ${isSelected ? 'Seleccionado' : 'Seleccionar'}
      </button>
    `;

    const selectBtn = card.querySelector('.btn-select-assistant');
    selectBtn.addEventListener('click', () => {
      selectAssistant(assistant);
    });

    container.appendChild(card);
  });
}

function selectAssistant(assistant) {
  // Save selected assistant
  localStorage.setItem('ia_agent_selected_assistant', JSON.stringify({
    id: assistant.id,
    name: assistant.name || 'Asistente',
    gltf_url: assistant.gltf_url,
    poster_url: assistant.poster_url || ''
  }));

  // Redirect to index.html
  window.location.href = './index.html';
}
