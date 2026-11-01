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

let selectedModelFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupDragAndDrop();
  await loadSavedCompanions();

  const form = document.getElementById('form-upload-companion');
  if (form) form.addEventListener('submit', handleSaveCompanion);
});

/* Drag & Drop Setup */
function setupDragAndDrop() {
  const dropZoneModel = document.getElementById('drop-zone-model');
  const inputModel = document.getElementById('input-model-files');
  const modelFilesList = document.getElementById('model-files-list');

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
}

function updateModelFilesListDisplay(container) {
  if (!container) return;
  if (selectedModelFiles.length === 0) {
    container.textContent = '';
    return;
  }
  const names = selectedModelFiles.map(f => f.name).join(', ');
  container.textContent = `${names}`;
}

/* Save Companion Handler */
async function handleSaveCompanion(e) {
  e.preventDefault();

  const nameInput = document.getElementById('companion-name');
  const submitBtn = document.getElementById('btn-save-companion');

  const name = (nameInput ? nameInput.value.trim() : '');
  if (!name) {
    alert('Por favor ingresa un nombre.');
    return;
  }

  if (selectedModelFiles.length === 0) {
    alert('Por favor selecciona un modelo (.gltf o .glb).');
    return;
  }

  const mainModelFile = selectedModelFiles.find(f => f.name.endsWith('.gltf') || f.name.endsWith('.glb'));
  if (!mainModelFile) {
    alert('Debes incluir un archivo .gltf o .glb.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cargando modelo...';
  }

  try {
    const folderId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let mainGltfPublicUrl = '';

    for (const file of selectedModelFiles) {
      const filePath = `models/${folderId}/${file.name}`;
      const { error } = await supabase.storage
        .from('assistants')
        .upload(filePath, file, { upsert: true });

      if (error) {
        throw new Error(`Error al subir ${file.name}: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('assistants')
        .getPublicUrl(filePath);

      if (file.name === mainModelFile.name) {
        mainGltfPublicUrl = publicUrlData.publicUrl;
      }
    }

    const { error: insertErr } = await supabase
      .from('assistants')
      .insert([{
        name: name,
        gltf_url: mainGltfPublicUrl,
        poster_url: '',
        voice_id: ''
      }]);

    if (insertErr) {
      throw new Error(`Error al guardar en base de datos: ${insertErr.message}`);
    }

    // Reset Form
    form.reset();
    selectedModelFiles = [];
    document.getElementById('model-files-list').textContent = '';

    // Reload list
    await loadSavedCompanions();

  } catch (err) {
    console.error('Error saving companion:', err);
    alert(`Ocurrió un problema: ${err.message}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cargar Modelo';
    }
  }
}

/* Load Saved Companions List */
async function loadSavedCompanions() {
  const container = document.getElementById('saved-companions-grid');
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
    console.warn('Error loading assistants:', err);
  }

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

  assistants.forEach(item => {
    const isSelected = activeAssistantId === (item.id || item.gltf_url) ||
      (!activeAssistantId && item.gltf_url === DEFAULT_ASSISTANT.gltf_url);

    const isDefault = item.id === DEFAULT_ASSISTANT.id || item.gltf_url === DEFAULT_ASSISTANT.gltf_url;

    const card = document.createElement('div');
    card.className = `model-card-item ${isSelected ? 'active' : ''}`;

    const posterAttr = item.poster_url ? `poster="${item.poster_url}"` : '';

    card.innerHTML = `
      <div class="model-viewer-box">
        <model-viewer
          src="${item.gltf_url}"
          ${posterAttr}
          alt="${item.name || 'Modelo GLTF'}"
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
        ></model-viewer>
      </div>
      <div class="model-card-actions">
        <button class="btn-card-select" data-id="${item.id || item.gltf_url}">
          ${isSelected ? 'Seleccionado' : 'Seleccionar'}
        </button>
        ${!isDefault ? `<button class="btn-card-delete" data-id="${item.id}">✕</button>` : ''}
      </div>
    `;

    const selectBtn = card.querySelector('.btn-card-select');
    selectBtn.addEventListener('click', () => {
      selectCompanion(item);
    });

    const deleteBtn = card.querySelector('.btn-card-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        deleteCompanion(item.id, item.name);
      });
    }

    container.appendChild(card);
  });
}

function selectCompanion(item) {
  localStorage.setItem('ia_agent_selected_assistant', JSON.stringify({
    id: item.id,
    name: item.name || 'Asistente',
    gltf_url: item.gltf_url,
    poster_url: item.poster_url || ''
  }));

  window.location.href = './index.html';
}

async function deleteCompanion(id, name) {
  if (!confirm(`¿Eliminar este modelo?`)) return;

  try {
    const { error } = await supabase
      .from('assistants')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
    } else {
      await loadSavedCompanions();
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
}
