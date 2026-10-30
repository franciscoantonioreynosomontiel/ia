import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qqjhadwxboeichxtxree.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxamhhZHd4Ym9laWNoeHR4cmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDY4ODAsImV4cCI6MjA5NTQyMjg4MH0.dM1VaV-lDPxoPlOHGAIbgfCSE3RMdURcVubq8tTs6yQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_ASSISTANT = {
  id: 'default-ia-bot',
  name: 'Asistente Principal',
  gltf_url: './assets/img/ia.gltf',
  poster_url: './assets/img/logopwa.png',
  voice_id: ''
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
    console.warn('Error fetching assistants from Supabase, using local fallback:', err);
  }

  // Ensure default assistant is always available in list if list is empty
  if (assistants.length === 0) {
    assistants = [DEFAULT_ASSISTANT];
  } else {
    // Make sure default model is included if not already present
    const hasDefault = assistants.some(a => a.gltf_url === DEFAULT_ASSISTANT.gltf_url);
    if (!hasDefault) {
      assistants.push(DEFAULT_ASSISTANT);
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

    const activeBadge = isSelected ? `<div class="active-badge">Activo</div>` : '';

    const posterAttr = assistant.poster_url ? `poster="${assistant.poster_url}"` : '';
    const voiceText = assistant.voice_id
      ? `Voz de ElevenLabs asignada`
      : `Voz de ElevenLabs por defecto`;

    card.innerHTML = `
      ${activeBadge}
      <div class="model-viewer-wrapper">
        <model-viewer
          src="${assistant.gltf_url}"
          ${posterAttr}
          alt="${assistant.name}"
          camera-controls
          disable-zoom
          disable-pan
          disable-tap
          interaction-prompt="none"
          touch-action="pan-y"
          shadow-intensity="1"
          shadow-softness="0.8"
          exposure="1"
        >
        </model-viewer>
      </div>
      <div class="assistant-card-body">
        <div>
          <h3 class="assistant-name">${assistant.name}</h3>
          <div class="assistant-voice-info" style="margin-top: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>${voiceText}</span>
          </div>
        </div>
        <button class="btn-select-assistant" data-id="${assistant.id || assistant.gltf_url}">
          ${isSelected ? '✓ Asistente Seleccionado' : 'Elegir este Asistente'}
        </button>
      </div>
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
  localStorage.setItem('ia_agent_selected_assistant', JSON.stringify(assistant));

  // If assistant has custom voice_id, update voice settings
  if (assistant.voice_id) {
    try {
      let currentVoiceSettings = {};
      const raw = localStorage.getItem('ia_agent_voice_settings');
      if (raw) currentVoiceSettings = JSON.parse(raw);

      const newSettings = {
        ...currentVoiceSettings,
        enabled: true,
        voice_id: assistant.voice_id,
        voice_id_es: assistant.voice_id,
        voice_name: `${assistant.name} Voice`,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('ia_agent_voice_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Could not update voice settings for assistant:', e);
    }
  }

  // Smooth redirect to main index page
  window.location.href = './index.html';
}
