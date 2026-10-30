import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qqjhadwxboeichxtxree.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxamhhZHd4Ym9laWNoeHR4cmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDY4ODAsImV4cCI6MjA5NTQyMjg4MH0.dM1VaV-lDPxoPlOHGAIbgfCSE3RMdURcVubq8tTs6yQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let selectedModelFiles = [];
let selectedPosterFile = null;
let currentTestAudio = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupDragAndDrop();
  await fetchVoicesList();
  await loadSavedCompanions();

  const form = document.getElementById('form-upload-companion');
  if (form) form.addEventListener('submit', handleSaveCompanion);

  const testBtn = document.getElementById('btn-test-companion-voice');
  if (testBtn) testBtn.addEventListener('click', testSelectedVoice);
});

/* Tab Switching */
function setupTabs() {
  const tabModeloBtn = document.getElementById('tab-btn-modelo');
  const tabConfigBtn = document.getElementById('tab-btn-config');
  const tabModeloContent = document.getElementById('tab-content-modelo');
  const tabConfigContent = document.getElementById('tab-content-config');

  if (tabModeloBtn && tabConfigBtn) {
    tabModeloBtn.addEventListener('click', () => {
      tabModeloBtn.classList.add('active');
      tabConfigBtn.classList.remove('active');
      tabModeloContent.style.display = 'block';
      tabConfigContent.style.display = 'none';
    });

    tabConfigBtn.addEventListener('click', () => {
      tabConfigBtn.classList.add('active');
      tabModeloBtn.classList.remove('active');
      tabConfigContent.style.display = 'block';
      tabModeloContent.style.display = 'none';
    });
  }
}

/* Drag & Drop Setup */
function setupDragAndDrop() {
  const dropZoneModel = document.getElementById('drop-zone-model');
  const inputModel = document.getElementById('input-model-files');
  const modelFilesList = document.getElementById('model-files-list');

  const dropZonePoster = document.getElementById('drop-zone-poster');
  const inputPoster = document.getElementById('input-poster-file');
  const posterFileList = document.getElementById('poster-file-list');

  // Model Files Drag & Drop
  if (dropZoneModel && inputModel) {
    dropZoneModel.addEventListener('click', () => inputModel.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZoneModel.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZoneModel.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZoneModel.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZoneModel.classList.remove('dragover');
      });
    });

    dropZoneModel.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        selectedModelFiles = Array.from(e.dataTransfer.files);
        updateModelFilesListDisplay(modelFilesList);
      }
    });

    inputModel.addEventListener('change', () => {
      if (inputModel.files && inputModel.files.length > 0) {
        selectedModelFiles = Array.from(inputModel.files);
        updateModelFilesListDisplay(modelFilesList);
      }
    });
  }

  // Poster Image Drag & Drop
  if (dropZonePoster && inputPoster) {
    dropZonePoster.addEventListener('click', () => inputPoster.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZonePoster.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZonePoster.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZonePoster.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZonePoster.classList.remove('dragover');
      });
    });

    dropZonePoster.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        selectedPosterFile = e.dataTransfer.files[0];
        updatePosterFileDisplay(posterFileList);
      }
    });

    inputPoster.addEventListener('change', () => {
      if (inputPoster.files && inputPoster.files.length > 0) {
        selectedPosterFile = inputPoster.files[0];
        updatePosterFileDisplay(posterFileList);
      }
    });
  }
}

function updateModelFilesListDisplay(container) {
  if (!container) return;
  if (selectedModelFiles.length === 0) {
    container.textContent = '';
    return;
  }
  const names = selectedModelFiles.map(f => f.name).join(', ');
  container.textContent = `Archivos seleccionados (${selectedModelFiles.length}): ${names}`;
}

function updatePosterFileDisplay(container) {
  if (!container) return;
  if (!selectedPosterFile) {
    container.textContent = '';
    return;
  }
  container.textContent = `Poster seleccionado: ${selectedPosterFile.name}`;
}

/* Fetch ElevenLabs Voices List */
async function fetchVoicesList() {
  const voiceSelect = document.getElementById('companion-voice-select');
  if (!voiceSelect) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/voz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: 'get_voices' })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.voices && data.voices.length > 0) {
        voiceSelect.innerHTML = '<option value="">-- Selecciona una voz de ElevenLabs --</option>';
        data.voices.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.voice_id;
          opt.textContent = `${v.name} (${v.category || 'ElevenLabs'})`;
          voiceSelect.appendChild(opt);
        });
        return;
      }
    }
  } catch (err) {
    console.warn('Could not fetch voices list:', err);
  }

  voiceSelect.innerHTML = '<option value="">(Ingresa un Voice ID abajo)</option>';
}

/* Test Voice Functionality */
async function testSelectedVoice() {
  const voiceSelect = document.getElementById('companion-voice-select');
  const voiceCustom = document.getElementById('companion-voice-custom');
  const testBtn = document.getElementById('btn-test-companion-voice');

  let voiceId = (voiceCustom && voiceCustom.value.trim()) || (voiceSelect && voiceSelect.value) || '';

  if (!voiceId) {
    alert('Por favor selecciona o ingresa un Voice ID de ElevenLabs para probar.');
    return;
  }

  if (currentTestAudio) {
    currentTestAudio.pause();
    currentTestAudio = null;
  }

  if (testBtn) testBtn.textContent = '⌛ Generando voz...';

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/voz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'text_to_speech',
        text: '¡Hola! Esta es mi voz de prueba para tu nuevo compañero 3D.',
        voice_id: voiceId
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.audio_base64) {
        currentTestAudio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        currentTestAudio.onended = () => {
          if (testBtn) testBtn.textContent = '🔊 Probar Voz';
        };
        await currentTestAudio.play();
      } else {
        alert('No se pudo generar la prueba de voz.');
      }
    } else {
      alert('Error de conexión con la función de voz.');
    }
  } catch (err) {
    console.error('Test voice error:', err);
    alert('Error al probar la voz de ElevenLabs.');
  } finally {
    if (testBtn) testBtn.textContent = '🔊 Probar Voz';
  }
}

/* Save Companion Handler */
async function handleSaveCompanion(e) {
  e.preventDefault();

  const nameInput = document.getElementById('companion-name');
  const voiceSelect = document.getElementById('companion-voice-select');
  const voiceCustom = document.getElementById('companion-voice-custom');
  const submitBtn = document.getElementById('btn-save-companion');

  const name = (nameInput ? nameInput.value.trim() : '');
  if (!name) {
    alert('Por favor ingresa un nombre para el compañero.');
    return;
  }

  if (selectedModelFiles.length === 0) {
    alert('Por favor selecciona o arrastra al menos un archivo de modelo (.gltf o .glb).');
    return;
  }

  // Find main .gltf or .glb file
  const mainModelFile = selectedModelFiles.find(f => f.name.endsWith('.gltf') || f.name.endsWith('.glb'));
  if (!mainModelFile) {
    alert('Debes incluir un archivo principal .gltf o .glb entre los archivos seleccionados.');
    return;
  }

  let voiceId = (voiceCustom && voiceCustom.value.trim()) || (voiceSelect && voiceSelect.value) || '';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subiendo archivos a Supabase...';
  }

  try {
    const folderId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let mainGltfPublicUrl = '';
    let posterPublicUrl = '';

    // Upload all model files to Supabase Storage bucket 'assistants'
    for (const file of selectedModelFiles) {
      const filePath = `models/${folderId}/${file.name}`;
      const { data, error } = await supabase.storage
        .from('assistants')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Error al subir ${file.name} a Supabase Storage: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('assistants')
        .getPublicUrl(filePath);

      if (file.name === mainModelFile.name) {
        mainGltfPublicUrl = publicUrlData.publicUrl;
      }
    }

    // Upload poster file if present
    if (selectedPosterFile) {
      const posterPath = `posters/${folderId}_${selectedPosterFile.name}`;
      const { data, error } = await supabase.storage
        .from('assistants')
        .upload(posterPath, selectedPosterFile, { upsert: true });

      if (!error) {
        const { data: posterUrlData } = supabase.storage
          .from('assistants')
          .getPublicUrl(posterPath);
        posterPublicUrl = posterUrlData.publicUrl;
      }
    }

    // Insert assistant into database table 'assistants'
    const { data: insertedData, error: insertErr } = await supabase
      .from('assistants')
      .insert([{
        name: name,
        gltf_url: mainGltfPublicUrl,
        poster_url: posterPublicUrl,
        voice_id: voiceId
      }])
      .select();

    if (insertErr) {
      throw new Error(`Error al guardar en base de datos: ${insertErr.message}`);
    }

    alert(`¡Compañero "${name}" guardado exitosamente!`);

    // Reset Form
    form.reset();
    selectedModelFiles = [];
    selectedPosterFile = null;
    document.getElementById('model-files-list').textContent = '';
    document.getElementById('poster-file-list').textContent = '';

    // Reload saved list
    await loadSavedCompanions();

  } catch (err) {
    console.error('Error saving companion:', err);
    alert(`Ocurrió un problema: ${err.message}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        Guardar Compañero
      `;
    }
  }
}

/* Load Saved Companions List */
async function loadSavedCompanions() {
  const container = document.getElementById('saved-companions-grid');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('assistants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      container.innerHTML = `<div style="color: #f87171;">Error al cargar compañeros: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="color: #94a3b8; font-size: 0.9rem;">No hay compañeros creados aún. ¡Crea el primero arriba!</div>`;
      return;
    }

    container.innerHTML = '';

    data.forEach(companion => {
      const card = document.createElement('div');
      card.className = 'companion-card-saved';

      const posterAttr = companion.poster_url ? `poster="${companion.poster_url}"` : '';
      const voiceInfo = companion.voice_id ? `Voz ID: ${companion.voice_id}` : 'Voz por defecto';

      card.innerHTML = `
        <div class="companion-preview-box">
          <model-viewer
            src="${companion.gltf_url}"
            ${posterAttr}
            alt="${companion.name}"
            camera-controls
            disable-zoom
            disable-pan
            disable-tap
            interaction-prompt="none"
            touch-action="pan-y"
            shadow-intensity="1"
          ></model-viewer>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong style="font-size: 1rem; color: #f8fafc;">${companion.name}</strong>
          <span style="font-size: 0.75rem; color: #94a3b8;">${voiceInfo}</span>
        </div>
        <button class="btn-delete-companion" data-id="${companion.id}">
          🗑 Eliminar Compañero
        </button>
      `;

      const deleteBtn = card.querySelector('.btn-delete-companion');
      deleteBtn.addEventListener('click', () => deleteCompanion(companion.id, companion.name));

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading saved companions:', err);
    container.innerHTML = `<div style="color: #f87171;">Error de conexión.</div>`;
  }
}

async function deleteCompanion(id, name) {
  if (!confirm(`¿Estás seguro de que deseas eliminar el compañero "${name}"?`)) return;

  try {
    const { error } = await supabase
      .from('assistants')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
    } else {
      alert(`Compañero "${name}" eliminado.`);
      await loadSavedCompanions();
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('No se pudo eliminar el compañero.');
  }
}
