// Assistant Manager - Loads selected 3D GLTF assistant & syncs ElevenLabs Voice across app screens

export const DEFAULT_ASSISTANT = {
  id: 'default-ia-bot',
  name: 'Asistente Principal',
  gltf_url: './assets/img/ia.gltf',
  poster_url: './assets/img/logopwa.png',
  voice_id: ''
};

export function getSelectedAssistant() {
  try {
    const raw = localStorage.getItem('ia_agent_selected_assistant');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.gltf_url || parsed.id)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading ia_agent_selected_assistant:', e);
  }
  return null;
}

export function initializeActiveAssistant() {
  const currentPath = window.location.pathname.toLowerCase();
  const isSelectionPage = currentPath.endsWith('asistente.html') || currentPath.endsWith('modelos.html');

  const activeAssistant = getSelectedAssistant();

  // If no assistant selected and on a main interaction screen, redirect to presentation/selection screen
  if (!activeAssistant && !isSelectionPage) {
    window.location.href = './asistente.html';
    return null;
  }

  if (activeAssistant) {
    // 1. Update model-viewer on current page if present
    const modelViewer = document.getElementById('bot-model-viewer');
    if (modelViewer) {
      if (activeAssistant.gltf_url) {
        modelViewer.setAttribute('src', activeAssistant.gltf_url);
      }
      if (activeAssistant.poster_url) {
        modelViewer.setAttribute('poster', activeAssistant.poster_url);
      }
    }

    // 2. Sync voice_id to voice settings if assistant has an individual voice
    if (activeAssistant.voice_id) {
      try {
        let voiceSettings = {};
        const raw = localStorage.getItem('ia_agent_voice_settings');
        if (raw) voiceSettings = JSON.parse(raw);

        if (voiceSettings.voice_id !== activeAssistant.voice_id) {
          const updatedSettings = {
            ...voiceSettings,
            enabled: true,
            voice_id: activeAssistant.voice_id,
            voice_id_es: activeAssistant.voice_id,
            voice_name: `${activeAssistant.name} Voice`,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('ia_agent_voice_settings', JSON.stringify(updatedSettings));
        }
      } catch (e) {
        console.warn('Could not sync assistant voice settings:', e);
      }
    }
  }

  return activeAssistant || DEFAULT_ASSISTANT;
}
