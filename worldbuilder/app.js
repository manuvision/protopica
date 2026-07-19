const STORAGE_KEY = "worldbuilder.mvp.v1";
const LEGACY_STORAGE_KEY = "worldgraph.mvp.v1";
const THEME_KEY = "worldbuilder.theme.v2";
const COLORS = ["#3866d6", "#b54708", "#039855", "#7f56d9", "#d92d20", "#0086c9", "#c11574", "#344054"];
const GRAPH_MIN_SCALE = 0.05;
const GRAPH_FIT_MIN_SCALE = 0.005;
const GRAPH_MAX_SCALE = 2.4;
const GRAPH_FIT_PADDING = 150;
const GRAPH_FOCUS_SCALE = 1.05;
const DEFAULT_THEME = "dark";
const DEFAULT_AMBIENCE = "fireplace";
const AMBIENCE_PROFILES = {
  fireplace: {
    label: "fireplace",
    volume: 0.5,
    source: "https://cdn.freesound.org/previews/717/717579_11069322-lq.mp3",
    sourceTitle: "Fireplace Fire Crackling",
    sourceUrl: "https://freesound.org/people/RyanKingArt/sounds/717579/",
    credit: "RyanKingArt",
    license: "CC0 1.0",
  },
  rain: {
    label: "rain",
    volume: 0.42,
    source: "https://cdn.freesound.org/previews/546/546523_8031303-lq.mp3",
    sourceTitle: "RAIN - 4",
    sourceUrl: "https://freesound.org/people/SamuelGremaud/sounds/546523/",
    credit: "SamuelGremaud",
    license: "CC0 1.0",
  },
  forest: {
    label: "forest",
    volume: 0.46,
    source: "https://cdn.freesound.org/previews/466/466072_8031303-lq.mp3",
    sourceTitle: "BIRDS IN COUNTRYSIDE - 1",
    sourceUrl: "https://freesound.org/people/SamuelGremaud/sounds/466072/",
    credit: "SamuelGremaud",
    license: "CC0 1.0",
  },
  night: {
    label: "night",
    volume: 0.42,
    source: "https://cdn.freesound.org/previews/746/746366_11069322-lq.mp3",
    sourceTitle: "Southern Summer Evening Ambience with Crickets 5",
    sourceUrl: "https://freesound.org/people/RyanKingArt/sounds/746366/",
    credit: "RyanKingArt",
    license: "CC0 1.0",
  },
};

const emptyGraphView = {
  scale: 1,
  x: 0,
  y: 0,
};

let state = normalizeState(loadState());
let graphView = { ...emptyGraphView };
let activeView = state.activeView || "graph";
let currentTheme = loadTheme();
let activeTab = "character";
let selectedColor = COLORS[0];
let selectedCharacterImage = "";
let selectedConnectionId = state.selectedConnectionId || null;
let selectedEventId = state.selectedEventId || null;
let selectedLocationId = state.selectedLocationId || null;
let dragState = null;
let graphPointers = new Map();
let graphSize = { width: 900, height: 620 };
let ambienceAudio = null;
let ambiencePlaying = false;
let activeAmbience = DEFAULT_AMBIENCE;

const elements = {
  worldMeta: document.querySelector("#worldMeta"),
  ambienceSelect: document.querySelector("#ambienceSelect"),
  ambienceToggleButton: document.querySelector("#ambienceToggleButton"),
  ambienceAudioElement: document.querySelector("#ambienceAudio"),
  worldForm: document.querySelector("#worldForm"),
  worldName: document.querySelector("#worldName"),
  focusWorldName: document.querySelector("#focusWorldName"),
  deleteWorldButton: document.querySelector("#deleteWorldButton"),
  worldList: document.querySelector("#worldList"),
  contextPanelTitle: document.querySelector("#contextPanelTitle"),
  characterList: document.querySelector("#characterList"),
  newCharacterButton: document.querySelector("#newCharacterButton"),
  newConnectionButton: document.querySelector("#newConnectionButton"),
  newRailEventButton: document.querySelector("#newRailEventButton"),
  newRailLocationButton: document.querySelector("#newRailLocationButton"),
  emptyAddCharacter: document.querySelector("#emptyAddCharacter"),
  worldTitleInput: document.querySelector("#worldTitleInput"),
  worldStats: document.querySelector("#worldStats"),
  graphView: document.querySelector("#graphView"),
  timelineView: document.querySelector("#timelineView"),
  mapView: document.querySelector("#mapView"),
  graphControls: document.querySelector("#graphControls"),
  timelineControls: document.querySelector("#timelineControls"),
  mapControls: document.querySelector("#mapControls"),
  graphWrap: document.querySelector("#graphWrap"),
  graphSvg: document.querySelector("#graphSvg"),
  viewport: document.querySelector("#viewport"),
  edgesLayer: document.querySelector("#edgesLayer"),
  nodesLayer: document.querySelector("#nodesLayer"),
  graphEmpty: document.querySelector("#graphEmpty"),
  autoLayoutButton: document.querySelector("#autoLayoutButton"),
  fitButton: document.querySelector("#fitButton"),
  zoomInButton: document.querySelector("#zoomInButton"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  timelineList: document.querySelector("#timelineList"),
  eventList: document.querySelector("#eventList"),
  timelineEmpty: document.querySelector("#timelineEmpty"),
  newEventButton: document.querySelector("#newEventButton"),
  emptyAddEvent: document.querySelector("#emptyAddEvent"),
  mapCanvas: document.querySelector("#mapCanvas"),
  mapImageLayer: document.querySelector("#mapImageLayer"),
  mapImagePrompt: document.querySelector("#mapImagePrompt"),
  mapPins: document.querySelector("#mapPins"),
  mapEmpty: document.querySelector("#mapEmpty"),
  locationStrip: document.querySelector("#locationStrip"),
  newLocationButton: document.querySelector("#newLocationButton"),
  emptyAddLocation: document.querySelector("#emptyAddLocation"),
  emptyUploadMapImage: document.querySelector("#emptyUploadMapImage"),
  uploadMapImageButton: document.querySelector("#uploadMapImageButton"),
  clearMapImageButton: document.querySelector("#clearMapImageButton"),
  mapImageFile: document.querySelector("#mapImageFile"),
  colorSwatches: document.querySelector("#colorSwatches"),
  characterImagePreview: document.querySelector("#characterImagePreview"),
  uploadCharacterImageButton: document.querySelector("#uploadCharacterImageButton"),
  clearCharacterImageButton: document.querySelector("#clearCharacterImageButton"),
  characterImageFile: document.querySelector("#characterImageFile"),
  characterForm: document.querySelector("#characterForm"),
  characterId: document.querySelector("#characterId"),
  characterName: document.querySelector("#characterName"),
  characterRole: document.querySelector("#characterRole"),
  characterFaction: document.querySelector("#characterFaction"),
  characterStatus: document.querySelector("#characterStatus"),
  characterNotes: document.querySelector("#characterNotes"),
  clearCharacterButton: document.querySelector("#clearCharacterButton"),
  deleteCharacterButton: document.querySelector("#deleteCharacterButton"),
  connectionForm: document.querySelector("#connectionForm"),
  connectionSource: document.querySelector("#connectionSource"),
  connectionTarget: document.querySelector("#connectionTarget"),
  connectionType: document.querySelector("#connectionType"),
  connectionStrength: document.querySelector("#connectionStrength"),
  connectionLabel: document.querySelector("#connectionLabel"),
  connectionNotes: document.querySelector("#connectionNotes"),
  clearConnectionButton: document.querySelector("#clearConnectionButton"),
  deleteConnectionButton: document.querySelector("#deleteConnectionButton"),
  connectionList: document.querySelector("#connectionList"),
  eventForm: document.querySelector("#eventForm"),
  eventId: document.querySelector("#eventId"),
  eventTitle: document.querySelector("#eventTitle"),
  eventEra: document.querySelector("#eventEra"),
  eventDate: document.querySelector("#eventDate"),
  eventCategory: document.querySelector("#eventCategory"),
  eventCharacter: document.querySelector("#eventCharacter"),
  eventImpact: document.querySelector("#eventImpact"),
  eventNotes: document.querySelector("#eventNotes"),
  clearEventButton: document.querySelector("#clearEventButton"),
  deleteEventButton: document.querySelector("#deleteEventButton"),
  locationForm: document.querySelector("#locationForm"),
  locationId: document.querySelector("#locationId"),
  locationName: document.querySelector("#locationName"),
  locationType: document.querySelector("#locationType"),
  locationRegion: document.querySelector("#locationRegion"),
  locationCharacter: document.querySelector("#locationCharacter"),
  locationNotes: document.querySelector("#locationNotes"),
  clearLocationButton: document.querySelector("#clearLocationButton"),
  deleteLocationButton: document.querySelector("#deleteLocationButton"),
  characterTab: document.querySelector("#characterTab"),
  connectionTab: document.querySelector("#connectionTab"),
  eventTab: document.querySelector("#eventTab"),
  locationTab: document.querySelector("#locationTab"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  exportFormatSelect: document.querySelector("#exportFormatSelect"),
  exportButton: document.querySelector("#exportButton"),
};

function createSeedState() {
  const worldId = createId("world");
  const chars = [
    {
      id: createId("char"),
      name: "Ilya Venn",
      role: "Cartographer",
      faction: "Blue Archive",
      status: "Active",
      notes: "Keeps maps that remember roads after they disappear.",
      color: COLORS[0],
      x: 250,
      y: 220,
    },
    {
      id: createId("char"),
      name: "Mara Sol",
      role: "Exile queen",
      faction: "Ash Court",
      status: "Hidden",
      notes: "Trading favors for passage through the salt gates.",
      color: COLORS[3],
      x: 540,
      y: 180,
    },
    {
      id: createId("char"),
      name: "Tovan Reed",
      role: "Debt keeper",
      faction: "Brass Ledger",
      status: "Active",
      notes: "Can name every unpaid promise in the city.",
      color: COLORS[1],
      x: 430,
      y: 410,
    },
    {
      id: createId("char"),
      name: "Nyx Calder",
      role: "Oracle",
      faction: "Glass Chapel",
      status: "Mythic",
      notes: "Only appears in reflections and bad weather.",
      color: COLORS[6],
      x: 720,
      y: 360,
    },
  ];
  const events = createSeedEvents(chars);
  const locations = createSeedLocations(chars);

  return {
    activeView: "graph",
    selectedWorldId: worldId,
    selectedCharacterId: chars[0].id,
    selectedConnectionId: null,
    selectedEventId: events[0].id,
    selectedLocationId: locations[0].id,
    worlds: [
      {
        id: worldId,
        name: "Aurelian Reach",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        characters: chars,
        connections: [
          {
            id: createId("conn"),
            source: chars[0].id,
            target: chars[1].id,
            type: "Owes",
            label: "Stole a map",
            strength: 3,
            notes: "",
          },
          {
            id: createId("conn"),
            source: chars[1].id,
            target: chars[2].id,
            type: "Rival",
            label: "Old debt",
            strength: 4,
            notes: "",
          },
          {
            id: createId("conn"),
            source: chars[2].id,
            target: chars[3].id,
            type: "Secret",
            label: "Shared vision",
            strength: 2,
            notes: "",
          },
        ],
        events,
        locations,
        mapImage: "",
        mapImageSize: null,
      },
    ],
  };
}

function createSeedEvents(chars) {
  return [
    {
      id: createId("event"),
      title: "The Salt Gates Open",
      era: "Age of Brine",
      date: "Year 184",
      category: "Discovery",
      characterId: chars[0]?.id || "",
      impact: "Trade routes reappear overnight, but every map disagrees about the coast.",
      notes: "Good anchor point for the first expedition into the flooded basin.",
    },
    {
      id: createId("event"),
      title: "The Ash Court Falls",
      era: "Age of Embers",
      date: "Year 211",
      category: "Conflict",
      characterId: chars[1]?.id || "",
      impact: "Mara loses the throne and the court's surviving houses scatter.",
      notes: "The official account omits who opened the western gate.",
    },
    {
      id: createId("event"),
      title: "Nyx Names the Debt",
      era: "Current Age",
      date: "Rainmoot",
      category: "Myth",
      characterId: chars[3]?.id || "",
      impact: "Every bargain made in the city becomes visible for one night.",
      notes: "Useful pressure event when secrets need to surface.",
    },
  ];
}

function createSeedLocations(chars) {
  return [
    {
      id: createId("place"),
      name: "Redwake Harbor",
      type: "City",
      region: "Western coast",
      characterId: chars[2]?.id || "",
      notes: "A harbor that taxes promises as often as cargo.",
      x: 24,
      y: 62,
    },
    {
      id: createId("place"),
      name: "Kethvari Outlook",
      type: "Ruin",
      region: "Velthorn Basin",
      characterId: chars[0]?.id || "",
      notes: "Signal tower from the old trade routes, half swallowed by floodwater.",
      x: 57,
      y: 31,
    },
    {
      id: createId("place"),
      name: "Glass Chapel",
      type: "Shrine",
      region: "Rainward hills",
      characterId: chars[3]?.id || "",
      notes: "Reflections here sometimes answer before anyone speaks.",
      x: 74,
      y: 52,
    },
  ];
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : DEFAULT_THEME;
  } catch (error) {
    console.warn("Could not load Worldbuilder theme.", error);
    return DEFAULT_THEME;
  }
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = currentTheme;

  const nextLabel = currentTheme === "dark" ? "Switch to light UI" : "Switch to dark UI";
  elements.themeToggleButton.setAttribute("aria-label", nextLabel);
  elements.themeToggleButton.setAttribute("title", nextLabel);

  try {
    localStorage.setItem(THEME_KEY, currentTheme);
  } catch (error) {
    console.warn("Could not save Worldbuilder theme.", error);
  }
}

function toggleTheme() {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

function getAmbienceProfile(profileId = activeAmbience) {
  return AMBIENCE_PROFILES[profileId] || AMBIENCE_PROFILES[DEFAULT_AMBIENCE];
}

function updateAmbienceControl() {
  const profile = getAmbienceProfile();
  elements.ambienceSelect.value = activeAmbience;
  elements.ambienceToggleButton.classList.toggle("active", ambiencePlaying);
  const label = ambiencePlaying ? `Pause ${profile.label} ambience` : `Play ${profile.label} ambience`;
  elements.ambienceToggleButton.setAttribute("aria-label", label);
  elements.ambienceToggleButton.setAttribute("title", label);
}

function createAmbienceAudio(profileId = activeAmbience) {
  const profile = getAmbienceProfile(profileId);
  const audio = elements.ambienceAudioElement;
  if (!audio) return null;

  if (audio.dataset.profile !== profileId) {
    audio.pause();
    audio.src = profile.source;
    audio.dataset.profile = profileId;
    audio.load();
  }

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = profile.volume;
  return audio;
}

function stopAmbienceAudio() {
  if (!ambienceAudio) return;
  ambienceAudio.pause();
  try {
    ambienceAudio.currentTime = 0;
  } catch (error) {
    // Some browsers cannot seek an audio element before metadata is ready.
  }
  ambienceAudio = null;
}

function setAmbienceProfile(profileId) {
  activeAmbience = AMBIENCE_PROFILES[profileId] ? profileId : DEFAULT_AMBIENCE;
  const shouldResume = ambiencePlaying;
  ambiencePlaying = false;
  stopAmbienceAudio();

  if (shouldResume) {
    ambienceAudio = createAmbienceAudio(activeAmbience);
    playAmbienceAudio("Could not switch ambience.");
  }

  updateAmbienceControl();
}

function playAmbienceAudio(errorMessage = "Could not control ambience.") {
  if (!ambienceAudio) {
    ambienceAudio = createAmbienceAudio(activeAmbience);
  }
  if (!ambienceAudio) {
    ambiencePlaying = false;
    updateAmbienceControl();
    return;
  }

  ambiencePlaying = true;
  updateAmbienceControl();

  const audio = ambienceAudio;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise
      .then(() => {
        if (audio !== ambienceAudio) return;
        ambiencePlaying = true;
        updateAmbienceControl();
      })
      .catch((error) => {
        if (audio !== ambienceAudio) return;
        console.warn(errorMessage, error);
        ambiencePlaying = false;
        updateAmbienceControl();
      });
  }
}

function toggleAmbience() {
  if (ambiencePlaying) {
    if (ambienceAudio) ambienceAudio.pause();
    ambiencePlaying = false;
    updateAmbienceControl();
    return;
  }

  playAmbienceAudio();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return createSeedState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed.worlds || !Array.isArray(parsed.worlds)) {
      return createSeedState();
    }

    return parsed;
  } catch (error) {
    console.warn("Could not load saved Worldbuilder state.", error);
    return createSeedState();
  }
}

function normalizeState(candidate) {
  const next = candidate && Array.isArray(candidate.worlds) ? candidate : createSeedState();
  next.activeView = ["graph", "timeline", "map"].includes(next.activeView) ? next.activeView : "graph";
  next.worlds = next.worlds.map(normalizeWorld);
  if (!next.worlds.length) {
    return createSeedState();
  }
  if (!next.selectedWorldId || !next.worlds.some((world) => world.id === next.selectedWorldId)) {
    next.selectedWorldId = next.worlds[0].id;
  }
  return next;
}

function normalizeWorld(world) {
  const normalized = {
    id: world.id || createId("world"),
    name: world.name || "Untitled World",
    createdAt: world.createdAt || new Date().toISOString(),
    updatedAt: world.updatedAt || world.createdAt || new Date().toISOString(),
    characters: Array.isArray(world.characters) ? world.characters : [],
    connections: Array.isArray(world.connections) ? world.connections : [],
    events: Array.isArray(world.events) ? world.events : null,
    locations: Array.isArray(world.locations) ? world.locations : null,
    mapImage: typeof world.mapImage === "string" ? world.mapImage : "",
    mapImageSize: normalizeMapImageSize(world.mapImageSize),
  };

  normalized.characters = normalized.characters.map((character, index) => ({
    id: character.id || createId("char"),
    name: character.name || "Unnamed Character",
    role: character.role || "",
    faction: character.faction || "",
    status: character.status || "Active",
    notes: character.notes || "",
    color: character.color || COLORS[index % COLORS.length],
    avatarImage: typeof character.avatarImage === "string" ? character.avatarImage : "",
    x: Number.isFinite(character.x) ? character.x : 260 + index * 80,
    y: Number.isFinite(character.y) ? character.y : 220 + index * 50,
  }));

  normalized.connections = normalized.connections.filter((connection) => connection.source && connection.target);

  if (!normalized.events) {
    normalized.events =
      normalized.name === "Aurelian Reach" && normalized.characters.length >= 4 ? createSeedEvents(normalized.characters) : [];
  }
  if (!normalized.locations) {
    normalized.locations =
      normalized.name === "Aurelian Reach" && normalized.characters.length >= 4 ? createSeedLocations(normalized.characters) : [];
  }

  normalized.events = normalized.events.map((event) => ({
    id: event.id || createId("event"),
    title: event.title || "Untitled Event",
    era: event.era || "",
    date: event.date || "",
    category: event.category || "Canon",
    characterId: event.characterId || "",
    impact: event.impact || "",
    notes: event.notes || "",
  }));

  normalized.locations = normalized.locations.map((location, index) => ({
    id: location.id || createId("place"),
    name: location.name || "Unnamed Place",
    type: location.type || "City",
    region: location.region || "",
    characterId: location.characterId || "",
    notes: location.notes || "",
    x: clamp(Number.isFinite(location.x) ? location.x : 30 + index * 13, 6, 94),
    y: clamp(Number.isFinite(location.y) ? location.y : 42 + index * 11, 10, 88),
  }));

  return normalized;
}

function saveState() {
  state.activeView = activeView;
  state.selectedConnectionId = selectedConnectionId;
  state.selectedEventId = selectedEventId;
  state.selectedLocationId = selectedLocationId;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    window.alert("That image is too large to save locally. Try a smaller file.");
    console.warn("Could not save Worldbuilder state.", error);
    return false;
  }
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getWorld() {
  return state.worlds.find((world) => world.id === state.selectedWorldId) || state.worlds[0];
}

function getCharacter(id = state.selectedCharacterId) {
  const world = getWorld();
  return world?.characters.find((character) => character.id === id) || null;
}

function getConnection(id = selectedConnectionId) {
  const world = getWorld();
  return world?.connections.find((connection) => connection.id === id) || null;
}

function getEvent(id = selectedEventId) {
  const world = getWorld();
  return world?.events.find((event) => event.id === id) || null;
}

function getLocation(id = selectedLocationId) {
  const world = getWorld();
  return world?.locations.find((location) => location.id === id) || null;
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function truncate(value, max = 26) {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMapImageSize(size) {
  if (!size || !Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0) {
    return null;
  }
  return {
    width: size.width,
    height: size.height,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setActiveView(view) {
  if (!["graph", "timeline", "map"].includes(view)) return;
  activeView = view;
  if (!isEditorAvailableForView(activeTab, view)) {
    activeTab = getDefaultEditorForView(view);
  }
  saveState();
  render();
  if (view === "graph") {
    requestAnimationFrame(() => renderGraph(getWorld()));
  }
}

function setActiveTab(tab) {
  const nextTab = isEditorAvailableForView(tab) ? tab : getDefaultEditorForView(activeView);
  activeTab = nextTab;
  renderEditorTabs();
}

function getAvailableEditors(view = activeView) {
  if (view === "timeline") return ["event"];
  if (view === "map") return ["location"];
  return ["character", "connection"];
}

function getDefaultEditorForView(view = activeView) {
  return getAvailableEditors(view)[0];
}

function isEditorAvailableForView(tab, view = activeView) {
  return getAvailableEditors(view).includes(tab);
}

function renderEditorTabs() {
  const availableEditors = getAvailableEditors();

  document.querySelectorAll("[data-editor]").forEach((form) => {
    form.classList.toggle("hidden", form.dataset.editor !== activeTab);
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const isAvailable = availableEditors.includes(button.dataset.tab);
    const isActive = button.dataset.tab === activeTab;
    button.classList.toggle("hidden", !isAvailable);
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function render() {
  const world = getWorld();
  if (!world) return;

  state.selectedWorldId = world.id;
  syncSelections(world);
  if (activeView === "graph" && activeTab === "connection" && world.characters.length < 2) {
    activeTab = "character";
  }
  elements.worldMeta.textContent = `${state.worlds.length} world${state.worlds.length === 1 ? "" : "s"}`;
  elements.worldTitleInput.value = world.name;
  elements.worldStats.textContent = `${world.characters.length} characters / ${world.connections.length} links / ${world.events.length} events / ${world.locations.length} places`;
  elements.graphEmpty.hidden = world.characters.length > 0;
  elements.timelineEmpty.hidden = world.events.length > 0;
  elements.mapEmpty.hidden = world.locations.length > 0 || !world.mapImage;

  renderViews();
  setActiveTab(activeTab);
  renderWorlds(world);
  renderCharacters(world);
  renderConnections(world);
  renderEventList(world);
  renderTimeline(world);
  renderMap(world);
  renderCharacterForm(world);
  renderConnectionForm(world);
  renderEventForm(world);
  renderLocationForm(world);
  renderGraph(world);
  updateControlStates(world);
}

function syncSelections(world) {
  if (state.selectedCharacterId && !world.characters.some((character) => character.id === state.selectedCharacterId)) {
    state.selectedCharacterId = world.characters[0]?.id || null;
  }
  if (selectedConnectionId && !world.connections.some((connection) => connection.id === selectedConnectionId)) {
    selectedConnectionId = null;
  }
  if (selectedEventId && !world.events.some((event) => event.id === selectedEventId)) {
    selectedEventId = null;
  }
  if (selectedLocationId && !world.locations.some((location) => location.id === selectedLocationId)) {
    selectedLocationId = null;
  }
}

function renderViews() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    const isActive = button.dataset.view === activeView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  const panelTitles = {
    graph: "Graph",
    timeline: "Events",
    map: "Places",
  };
  const contextActions = {
    graph: ["character", "connection"],
    timeline: ["event"],
    map: ["location"],
  };

  elements.contextPanelTitle.textContent = panelTitles[activeView] || "Graph";
  document.querySelectorAll("[data-context-view]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.contextView !== activeView);
  });
  document.querySelectorAll("[data-context-action]").forEach((button) => {
    button.classList.toggle("hidden", !contextActions[activeView]?.includes(button.dataset.contextAction));
  });

  elements.graphView.classList.toggle("hidden", activeView !== "graph");
  elements.timelineView.classList.toggle("hidden", activeView !== "timeline");
  elements.mapView.classList.toggle("hidden", activeView !== "map");
  elements.graphControls.classList.toggle("hidden", activeView !== "graph");
  elements.timelineControls.classList.toggle("hidden", activeView !== "timeline");
  elements.mapControls.classList.toggle("hidden", activeView !== "map");
}

function renderWorlds(activeWorld) {
  elements.worldList.innerHTML = state.worlds
    .map((world) => {
      const stats = `${world.characters.length} cast / ${world.events.length} events / ${world.locations.length} places`;
      return `
        <button class="world-item ${world.id === activeWorld.id ? "active" : ""}" type="button" data-world-id="${world.id}">
          <span class="item-main">
            <span class="item-title">${escapeHtml(world.name)}</span>
            <span class="item-meta">${stats}</span>
          </span>
          <span class="item-meta">${new Date(world.updatedAt || world.createdAt).toLocaleDateString()}</span>
        </button>
      `;
    })
    .join("");
}

function renderCharacters(world) {
  if (!world.characters.length) {
    elements.characterList.innerHTML = `<div class="item-meta">No characters yet</div>`;
    return;
  }

  elements.characterList.innerHTML = world.characters
    .map((character) => {
      const meta = [character.role, character.faction].filter(Boolean).join(" / ") || character.status;
      return `
        <button class="character-item ${character.id === state.selectedCharacterId ? "active" : ""}" type="button" data-character-id="${character.id}">
          <span class="avatar-dot" style="background:${character.color || COLORS[0]}">${escapeHtml(initials(character.name) || "?")}</span>
          <span class="item-main">
            <span class="item-title">${escapeHtml(character.name)}</span>
            <span class="item-meta">${escapeHtml(meta)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderConnections(world) {
  if (!world.connections.length) {
    elements.connectionList.innerHTML = `<div class="item-meta">No connections yet</div>`;
    return;
  }

  elements.connectionList.innerHTML = world.connections
    .map((connection) => {
      const source = world.characters.find((character) => character.id === connection.source);
      const target = world.characters.find((character) => character.id === connection.target);
      const title = `${source?.name || "Unknown"} -> ${target?.name || "Unknown"}`;
      const meta = connection.label || connection.type;
      return `
        <button class="connection-item ${connection.id === selectedConnectionId ? "active" : ""}" type="button" data-connection-id="${connection.id}">
          <span class="item-main">
            <span class="item-title">${escapeHtml(title)}</span>
            <span class="item-meta">${escapeHtml(meta)}</span>
          </span>
          <span class="item-meta">${connection.strength}/5</span>
        </button>
      `;
    })
    .join("");
}

function renderEventList(world) {
  if (!world.events.length) {
    elements.eventList.innerHTML = `<div class="item-meta">No events yet</div>`;
    return;
  }

  const charactersById = new Map(world.characters.map((character) => [character.id, character]));
  elements.eventList.innerHTML = [...world.events]
    .sort(compareEvents)
    .map((event) => {
      const character = charactersById.get(event.characterId);
      const dateLabel = [event.era, event.date].filter(Boolean).join(" / ") || "Undated";
      const meta = [dateLabel, character?.name || event.category].filter(Boolean).join(" / ");
      return `
        <button class="event-item ${event.id === selectedEventId ? "active" : ""}" type="button" data-event-id="${event.id}">
          <span class="item-main">
            <span class="item-title">${escapeHtml(event.title)}</span>
            <span class="item-meta">${escapeHtml(meta)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderTimeline(world) {
  if (!world.events.length) {
    elements.timelineList.innerHTML = "";
    return;
  }

  const charactersById = new Map(world.characters.map((character) => [character.id, character]));
  const sortedEvents = [...world.events].sort(compareEvents);
  elements.timelineList.innerHTML = sortedEvents
    .map((event) => {
      const character = charactersById.get(event.characterId);
      const dateLabel = [event.era, event.date].filter(Boolean).join(" / ") || "Undated";
      const impact = event.impact || event.notes || "No impact recorded yet.";
      const meta = character ? `${event.category} / ${character.name}` : event.category;
      return `
        <button class="timeline-card ${event.id === selectedEventId ? "active" : ""}" type="button" data-event-id="${event.id}">
          <span class="timeline-topline">
            <span class="timeline-date">${escapeHtml(dateLabel)}</span>
            <span class="pill">${escapeHtml(meta)}</span>
          </span>
          <h3>${escapeHtml(event.title)}</h3>
          <p>${escapeHtml(impact)}</p>
        </button>
      `;
    })
    .join("");
}

function compareEvents(a, b) {
  const aKey = getTimelineSortKey(a);
  const bKey = getTimelineSortKey(b);

  if (aKey.hasNumber && bKey.hasNumber && aKey.number !== bKey.number) {
    return aKey.number - bKey.number;
  }

  if (aKey.hasNumber !== bKey.hasNumber) {
    return aKey.hasNumber ? -1 : 1;
  }

  return (
    aKey.label.localeCompare(bKey.label, undefined, { numeric: true, sensitivity: "base" }) ||
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
}

function getTimelineSortKey(event) {
  const label = `${event.era || ""} ${event.date || ""}`.trim();
  const number = parseTimelineNumber(event.date) ?? parseTimelineNumber(event.era);
  return {
    hasNumber: Number.isFinite(number),
    number,
    label,
  };
}

function parseTimelineNumber(value) {
  const match = String(value || "").match(/[+-]?\d[\d,]*(?:\.\d+)?/);
  return match ? Number(match[0].replace(/,/g, "")) : null;
}

function getMapImageRect(world = getWorld()) {
  const canvasRect = elements.mapCanvas.getBoundingClientRect();
  const size = normalizeMapImageSize(world?.mapImageSize);
  if (!world?.mapImage || !size || !canvasRect.width || !canvasRect.height) {
    return {
      left: 0,
      top: 0,
      width: canvasRect.width,
      height: canvasRect.height,
    };
  }

  const imageRatio = size.width / size.height;
  const canvasRatio = canvasRect.width / canvasRect.height;
  let width = canvasRect.width;
  let height = canvasRect.height;

  if (imageRatio > canvasRatio) {
    width = canvasRect.height * imageRatio;
  } else {
    height = canvasRect.width / imageRatio;
  }

  return {
    left: (canvasRect.width - width) / 2,
    top: (canvasRect.height - height) / 2,
    width,
    height,
  };
}

function getMapPinStyle(location, world = getWorld()) {
  const rect = getMapImageRect(world);
  if (!rect.width || !rect.height) {
    return `left:${location.x}%; top:${location.y}%`;
  }
  const left = rect.left + (Number(location.x) / 100) * rect.width;
  const top = rect.top + (Number(location.y) / 100) * rect.height;
  return `left:${left}px; top:${top}px`;
}

function updateMapPinPositions(world = getWorld()) {
  if (!world) return;
  elements.mapPins.querySelectorAll("[data-location-id]").forEach((pin) => {
    const location = world.locations.find((item) => item.id === pin.dataset.locationId);
    if (!location) return;
    pin.setAttribute("style", getMapPinStyle(location, world));
  });
}

function getMapImagePoint(event, world = getWorld()) {
  const canvasRect = elements.mapCanvas.getBoundingClientRect();
  const imageRect = getMapImageRect(world);
  const x = clamp(((event.clientX - canvasRect.left - imageRect.left) / imageRect.width) * 100, 0, 100);
  const y = clamp(((event.clientY - canvasRect.top - imageRect.top) / imageRect.height) * 100, 0, 100);
  return { x, y };
}

function renderMap(world) {
  elements.mapCanvas.classList.toggle("has-image", Boolean(world.mapImage));
  elements.mapImageLayer.style.backgroundImage = world.mapImage ? `url("${world.mapImage}")` : "";
  elements.mapImagePrompt.hidden = Boolean(world.mapImage);
  loadMapImageSize(world);

  if (!world.locations.length) {
    elements.mapPins.innerHTML = "";
    elements.locationStrip.innerHTML = `<div class="item-meta">No places yet</div>`;
    return;
  }

  const charactersById = new Map(world.characters.map((character) => [character.id, character]));
  elements.mapPins.innerHTML = world.locations
    .map((location) => {
      const character = charactersById.get(location.characterId);
      const marker = character ? initials(character.name) : initials(location.name);
      const color = character?.color || COLORS[world.locations.indexOf(location) % COLORS.length];
      const imageStyle = character?.avatarImage ? `background-image:url("${character.avatarImage}")` : `background:${color}`;
      const imageClass = character?.avatarImage ? " has-image" : "";
      return `
        <button class="map-pin ${location.id === selectedLocationId ? "active" : ""}" type="button" data-location-id="${location.id}" style="${getMapPinStyle(location, world)}">
          <span class="pin-head${imageClass}" style="${imageStyle}"><span>${escapeHtml(marker || "?")}</span></span>
          <span class="pin-label">${escapeHtml(location.name)}</span>
        </button>
      `;
    })
    .join("");

  elements.locationStrip.innerHTML = world.locations
    .map((location) => {
      const character = charactersById.get(location.characterId);
      const meta = [location.type, location.region, character?.name].filter(Boolean).join(" / ");
      return `
        <button class="location-chip ${location.id === selectedLocationId ? "active" : ""}" type="button" data-location-id="${location.id}">
          <span class="item-title">${escapeHtml(location.name)}</span>
          <span class="item-meta">${escapeHtml(meta || "Unplaced lore")}</span>
        </button>
      `;
    })
    .join("");
}

function renderCharacterForm(world) {
  const character = getCharacter();
  if (!character) {
    elements.characterId.value = "";
    elements.characterName.value = "";
    elements.characterRole.value = "";
    elements.characterFaction.value = "";
    elements.characterStatus.value = "Active";
    elements.characterNotes.value = "";
    selectedColor = COLORS[0];
    selectedCharacterImage = "";
  } else if (elements.characterId.value !== character.id || document.activeElement.closest("#characterForm") !== elements.characterForm) {
    elements.characterId.value = character.id;
    elements.characterName.value = character.name;
    elements.characterRole.value = character.role || "";
    elements.characterFaction.value = character.faction || "";
    elements.characterStatus.value = character.status || "Active";
    elements.characterNotes.value = character.notes || "";
    selectedColor = character.color || COLORS[0];
    selectedCharacterImage = character.avatarImage || "";
  }

  elements.deleteCharacterButton.disabled = !character;
  renderCharacterImagePreview();
  renderSwatches();
  syncCharacterSelects(world);
}

function renderCharacterImagePreview() {
  elements.characterImagePreview.classList.toggle("has-image", Boolean(selectedCharacterImage));
  elements.characterImagePreview.style.backgroundImage = selectedCharacterImage ? `url("${selectedCharacterImage}")` : "";
  elements.clearCharacterImageButton.disabled = !selectedCharacterImage;
}

function renderSwatches() {
  elements.colorSwatches.innerHTML = COLORS.map((color) => {
    const isActive = selectedColor === color;
    return `
      <button class="swatch-button ${isActive ? "active" : ""}" type="button" data-color="${color}" aria-label="Use color ${color}" title="${color}" style="background:${color}"></button>
    `;
  }).join("");
}

function renderConnectionForm(world) {
  const connection = getConnection();
  if (connection && document.activeElement.closest("#connectionForm") !== elements.connectionForm) {
    elements.connectionSource.value = connection.source;
    elements.connectionTarget.value = connection.target;
    elements.connectionType.value = connection.type || "Ally";
    elements.connectionStrength.value = connection.strength || 3;
    elements.connectionLabel.value = connection.label || "";
    elements.connectionNotes.value = connection.notes || "";
  } else if (!connection && document.activeElement.closest("#connectionForm") !== elements.connectionForm) {
    const selected = getCharacter();
    elements.connectionSource.value = selected?.id || world.characters[0]?.id || "";
    elements.connectionTarget.value = world.characters.find((character) => character.id !== elements.connectionSource.value)?.id || "";
    elements.connectionType.value = "Ally";
    elements.connectionStrength.value = 3;
    elements.connectionLabel.value = "";
    elements.connectionNotes.value = "";
  }

  elements.deleteConnectionButton.disabled = !connection;
}

function renderEventForm(world) {
  const event = getEvent();
  if (!event) {
    elements.eventId.value = "";
    elements.eventTitle.value = "";
    elements.eventEra.value = "";
    elements.eventDate.value = "";
    elements.eventCategory.value = "Canon";
    elements.eventCharacter.value = "";
    elements.eventImpact.value = "";
    elements.eventNotes.value = "";
  } else if (elements.eventId.value !== event.id || document.activeElement.closest("#eventForm") !== elements.eventForm) {
    elements.eventId.value = event.id;
    elements.eventTitle.value = event.title;
    elements.eventEra.value = event.era || "";
    elements.eventDate.value = event.date || "";
    elements.eventCategory.value = event.category || "Canon";
    elements.eventCharacter.value = event.characterId || "";
    elements.eventImpact.value = event.impact || "";
    elements.eventNotes.value = event.notes || "";
  }

  elements.deleteEventButton.disabled = !event;
}

function renderLocationForm(world) {
  const location = getLocation();
  if (!location) {
    elements.locationId.value = "";
    elements.locationName.value = "";
    elements.locationType.value = "City";
    elements.locationRegion.value = "";
    elements.locationCharacter.value = "";
    elements.locationNotes.value = "";
  } else if (elements.locationId.value !== location.id || document.activeElement.closest("#locationForm") !== elements.locationForm) {
    elements.locationId.value = location.id;
    elements.locationName.value = location.name;
    elements.locationType.value = location.type || "City";
    elements.locationRegion.value = location.region || "";
    elements.locationCharacter.value = location.characterId || "";
    elements.locationNotes.value = location.notes || "";
  }

  elements.deleteLocationButton.disabled = !location;
}

function syncCharacterSelects(world) {
  const characterOptions = world.characters
    .map((character) => `<option value="${character.id}">${escapeHtml(character.name)}</option>`)
    .join("");
  const nullableOptions = `<option value="">None</option>${characterOptions}`;

  elements.connectionSource.innerHTML = characterOptions;
  elements.connectionTarget.innerHTML = characterOptions;
  elements.eventCharacter.innerHTML = nullableOptions;
  elements.locationCharacter.innerHTML = nullableOptions;
  elements.connectionSource.disabled = world.characters.length < 2;
  elements.connectionTarget.disabled = world.characters.length < 2;
}

function updateControlStates(world) {
  const hasWorlds = state.worlds.length > 0;
  const hasCharacters = world.characters.length > 0;
  const hasTwoCharacters = world.characters.length >= 2;

  elements.exportButton.disabled = !hasWorlds;
  elements.exportFormatSelect.disabled = !hasWorlds;
  elements.deleteWorldButton.disabled = !hasWorlds;
  elements.clearMapImageButton.disabled = !world.mapImage;
  elements.autoLayoutButton.disabled = !hasCharacters;
  elements.fitButton.disabled = !hasCharacters;
  elements.zoomInButton.disabled = !hasCharacters;
  elements.zoomOutButton.disabled = !hasCharacters;
  elements.newConnectionButton.disabled = !hasTwoCharacters;
  elements.connectionTab.disabled = !hasTwoCharacters;
  elements.connectionForm.querySelector(".primary-button").disabled = !hasTwoCharacters;
  updateExportControl();
}

function renderGraph(world) {
  updateGraphSize();
  elements.viewport.setAttribute("transform", `translate(${graphView.x} ${graphView.y}) scale(${graphView.scale})`);

  const charactersById = new Map(world.characters.map((character) => [character.id, character]));
  elements.edgesLayer.innerHTML = world.connections
    .map((connection) => {
      const source = charactersById.get(connection.source);
      const target = charactersById.get(connection.target);
      if (!source || !target) return "";

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const offsetX = (-dy / distance) * 10;
      const offsetY = (dx / distance) * 10;
      const labelX = (source.x + target.x) / 2 + offsetX;
      const labelY = (source.y + target.y) / 2 + offsetY;
      const label = truncate(connection.label || connection.type, 22);
      const width = 1.4 + Number(connection.strength || 3) * 0.6;

      return `
        <g class="edge ${connection.id === selectedConnectionId ? "selected" : ""}" data-connection-id="${connection.id}">
          <line class="edge-hit" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"></line>
          <line class="edge-line" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke-width="${width}"></line>
          <text class="edge-label" x="${labelX}" y="${labelY - 8}">${escapeHtml(label)}</text>
        </g>
      `;
    })
    .join("");

  elements.nodesLayer.innerHTML = world.characters
    .map((character) => {
      const meta = truncate(character.role || character.faction || character.status || "", 18);
      const hasImage = Boolean(character.avatarImage);
      const clipId = `nodeClip_${character.id}`;
      return `
        <g class="node ${character.id === state.selectedCharacterId ? "selected" : ""}" data-character-id="${character.id}" transform="translate(${character.x} ${character.y})">
          ${
            hasImage
              ? `<defs><clipPath id="${clipId}"><circle cx="0" cy="0" r="25"></circle></clipPath></defs>`
              : ""
          }
          <circle class="node-ring" cx="0" cy="0" r="33"></circle>
          <circle class="node-core" cx="0" cy="0" r="27" fill="${character.color || COLORS[0]}"></circle>
          ${
            hasImage
              ? `<image class="node-image" href="${escapeHtml(character.avatarImage)}" x="-25" y="-25" width="50" height="50" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"></image><circle class="node-image-border" cx="0" cy="0" r="27"></circle>`
              : `<text class="node-initial" x="0" y="7">${escapeHtml(initials(character.name) || "?")}</text>`
          }
          <text class="node-label" x="0" y="49">${escapeHtml(truncate(character.name, 20))}</text>
          <text class="node-sub" x="0" y="66">${escapeHtml(meta)}</text>
        </g>
      `;
    })
    .join("");
}

function updateGraphSize() {
  const rect = elements.graphWrap.getBoundingClientRect();
  graphSize = {
    width: Math.max(rect.width, 320),
    height: Math.max(rect.height, 320),
  };
  elements.graphSvg.setAttribute("viewBox", `0 0 ${graphSize.width} ${graphSize.height}`);
}

function createWorld(name) {
  const world = {
    id: createId("world"),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characters: [],
    connections: [],
    events: [],
    locations: [],
    mapImage: "",
  };
  state.worlds.unshift(world);
  state.selectedWorldId = world.id;
  state.selectedCharacterId = null;
  selectedConnectionId = null;
  selectedEventId = null;
  selectedLocationId = null;
  resetGraphView();
  saveState();
  render();
}

function deleteSelectedWorld() {
  const world = getWorld();
  if (!world) return;

  const confirmed = window.confirm(`Delete ${world.name} and all of its characters, connections, events, places, and map image?`);
  if (!confirmed) return;

  state.worlds = state.worlds.filter((item) => item.id !== world.id);
  if (!state.worlds.length) {
    state.worlds.push({
      id: createId("world"),
      name: "Untitled World",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characters: [],
      connections: [],
      events: [],
      locations: [],
      mapImage: "",
    });
  }

  state.selectedWorldId = state.worlds[0].id;
  state.selectedCharacterId = state.worlds[0].characters[0]?.id || null;
  selectedConnectionId = null;
  selectedEventId = null;
  selectedLocationId = null;
  selectedCharacterImage = "";
  resetGraphView();
  saveState();
  render();
  fitGraph();
}

function addOrUpdateCharacter(formData) {
  const world = getWorld();
  const existingId = formData.get("characterId");
  const existing = existingId ? world.characters.find((character) => character.id === existingId) : null;
  const payload = {
    name: String(formData.get("characterName") || "").trim(),
    role: String(formData.get("characterRole") || "").trim(),
    faction: String(formData.get("characterFaction") || "").trim(),
    status: String(formData.get("characterStatus") || "Active"),
    notes: String(formData.get("characterNotes") || "").trim(),
    color: selectedColor,
    avatarImage: selectedCharacterImage,
  };

  if (!payload.name) return;

  if (existing) {
    Object.assign(existing, payload);
    state.selectedCharacterId = existing.id;
  } else {
    const position = nextCharacterPosition(world.characters.length);
    const character = {
      id: createId("char"),
      ...payload,
      ...position,
    };
    world.characters.push(character);
    state.selectedCharacterId = character.id;
  }

  touchWorld(world);
  saveState();
  render();
}

function nextCharacterPosition(index) {
  const radius = 170 + Math.floor(index / 8) * 62;
  const angle = index * 2.399963229728653;
  const center = graphCenter();
  return {
    x: Math.round(center.x + Math.cos(angle) * radius),
    y: Math.round(center.y + Math.sin(angle) * radius),
  };
}

function graphCenter() {
  return {
    x: Math.max(420, graphSize.width / 2),
    y: Math.max(300, graphSize.height / 2),
  };
}

function clearCharacterForm() {
  state.selectedCharacterId = null;
  elements.characterId.value = "";
  elements.characterName.value = "";
  elements.characterRole.value = "";
  elements.characterFaction.value = "";
  elements.characterStatus.value = "Active";
  elements.characterNotes.value = "";
  selectedColor = COLORS[state.worlds.length % COLORS.length];
  selectedCharacterImage = "";
  selectedConnectionId = null;
  setActiveTab("character");
  render();
  elements.characterName.focus();
}

function deleteSelectedCharacter() {
  const world = getWorld();
  const character = getCharacter();
  if (!character) return;

  const confirmed = window.confirm(`Delete ${character.name} and their connections?`);
  if (!confirmed) return;

  world.characters = world.characters.filter((item) => item.id !== character.id);
  world.connections = world.connections.filter((connection) => connection.source !== character.id && connection.target !== character.id);
  world.events.forEach((event) => {
    if (event.characterId === character.id) event.characterId = "";
  });
  world.locations.forEach((location) => {
    if (location.characterId === character.id) location.characterId = "";
  });
  state.selectedCharacterId = world.characters[0]?.id || null;
  selectedConnectionId = null;
  touchWorld(world);
  saveState();
  render();
}

function addOrUpdateConnection(formData) {
  const world = getWorld();
  const source = String(formData.get("connectionSource") || "");
  const target = String(formData.get("connectionTarget") || "");
  if (!source || !target || source === target) return;

  const payload = {
    source,
    target,
    type: String(formData.get("connectionType") || "Ally"),
    strength: Number(formData.get("connectionStrength") || 3),
    label: String(formData.get("connectionLabel") || "").trim(),
    notes: String(formData.get("connectionNotes") || "").trim(),
  };

  const existing = selectedConnectionId ? world.connections.find((connection) => connection.id === selectedConnectionId) : null;
  if (existing) {
    Object.assign(existing, payload);
  } else {
    selectedConnectionId = createId("conn");
    world.connections.push({
      id: selectedConnectionId,
      ...payload,
    });
  }

  touchWorld(world);
  saveState();
  render();
}

function clearConnectionForm() {
  selectedConnectionId = null;
  activeView = "graph";
  setActiveTab("connection");
  render();
  elements.connectionLabel.focus();
}

function deleteConnection(connectionId) {
  const world = getWorld();
  world.connections = world.connections.filter((connection) => connection.id !== connectionId);
  if (selectedConnectionId === connectionId) selectedConnectionId = null;
  touchWorld(world);
  saveState();
  render();
}

function deleteSelectedConnection() {
  const connection = getConnection();
  if (!connection) return;

  deleteConnection(connection.id);
}

function addOrUpdateEvent(formData) {
  const world = getWorld();
  const existingId = formData.get("eventId");
  const existing = existingId ? world.events.find((event) => event.id === existingId) : null;
  const payload = {
    title: String(formData.get("eventTitle") || "").trim(),
    era: String(formData.get("eventEra") || "").trim(),
    date: String(formData.get("eventDate") || "").trim(),
    category: String(formData.get("eventCategory") || "Canon"),
    characterId: String(formData.get("eventCharacter") || ""),
    impact: String(formData.get("eventImpact") || "").trim(),
    notes: String(formData.get("eventNotes") || "").trim(),
  };

  if (!payload.title) return;

  if (existing) {
    Object.assign(existing, payload);
    selectedEventId = existing.id;
  } else {
    selectedEventId = createId("event");
    world.events.push({
      id: selectedEventId,
      ...payload,
    });
  }

  activeView = "timeline";
  setActiveTab("event");
  touchWorld(world);
  saveState();
  render();
}

function clearEventForm() {
  selectedEventId = null;
  activeView = "timeline";
  setActiveTab("event");
  render();
  elements.eventTitle.focus();
}

function deleteSelectedEvent() {
  const world = getWorld();
  const event = getEvent();
  if (!event) return;

  world.events = world.events.filter((item) => item.id !== event.id);
  selectedEventId = null;
  touchWorld(world);
  saveState();
  render();
}

function addOrUpdateLocation(formData) {
  const world = getWorld();
  const existingId = formData.get("locationId");
  const existing = existingId ? world.locations.find((location) => location.id === existingId) : null;
  const payload = {
    name: String(formData.get("locationName") || "").trim(),
    type: String(formData.get("locationType") || "City"),
    region: String(formData.get("locationRegion") || "").trim(),
    characterId: String(formData.get("locationCharacter") || ""),
    notes: String(formData.get("locationNotes") || "").trim(),
  };

  if (!payload.name) return;

  if (existing) {
    Object.assign(existing, payload);
    selectedLocationId = existing.id;
  } else {
    const position = nextLocationPosition(world.locations.length);
    selectedLocationId = createId("place");
    world.locations.push({
      id: selectedLocationId,
      ...payload,
      ...position,
    });
  }

  activeView = "map";
  setActiveTab("location");
  touchWorld(world);
  saveState();
  render();
}

function nextLocationPosition(index) {
  return {
    x: clamp(38 + ((index * 17) % 42), 8, 92),
    y: clamp(36 + ((index * 13) % 38), 12, 88),
  };
}

function clearLocationForm() {
  selectedLocationId = null;
  activeView = "map";
  setActiveTab("location");
  render();
  elements.locationName.focus();
}

function deleteSelectedLocation() {
  const world = getWorld();
  const location = getLocation();
  if (!location) return;

  world.locations = world.locations.filter((item) => item.id !== location.id);
  selectedLocationId = null;
  touchWorld(world);
  saveState();
  render();
}

function setMapImage(dataUrl) {
  const world = getWorld();
  const previousImage = world.mapImage;
  const previousSize = world.mapImageSize;
  world.mapImage = dataUrl;
  world.mapImageSize = null;
  activeView = "map";
  touchWorld(world);
  if (!saveState()) {
    world.mapImage = previousImage;
    world.mapImageSize = previousSize;
  }
  loadMapImageSize(world);
  render();
}

function clearMapImage() {
  const world = getWorld();
  if (!world.mapImage) return;
  world.mapImage = "";
  world.mapImageSize = null;
  activeView = "map";
  touchWorld(world);
  saveState();
  render();
}

function loadMapImageSize(world = getWorld()) {
  if (!world?.mapImage || world.mapImageSize) return;

  const image = new Image();
  image.addEventListener("load", () => {
    const latestWorld = getWorld();
    if (latestWorld?.id !== world.id || latestWorld.mapImage !== world.mapImage) return;
    latestWorld.mapImageSize = {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
    saveState();
    renderMap(latestWorld);
  });
  image.src = world.mapImage;
}

function setCharacterImage(dataUrl) {
  selectedCharacterImage = dataUrl;
  renderCharacterImagePreview();
}

function clearCharacterImage() {
  selectedCharacterImage = "";
  renderCharacterImagePreview();
}

function readImageFile(file, onReady) {
  if (!file || !file.type.startsWith("image/")) {
    window.alert("Please choose an image file.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const dataUrl = String(reader.result || "");
    if (!dataUrl || file.type === "image/svg+xml") {
      onReady(dataUrl);
      return;
    }

    const image = new Image();
    image.addEventListener("load", () => {
      const maxWidth = 1600;
      const maxHeight = 1200;
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      if (scale === 1 && dataUrl.length < 1_400_000) {
        onReady(dataUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      onReady(canvas.toDataURL("image/jpeg", 0.86));
    });
    image.addEventListener("error", () => onReady(dataUrl));
    image.src = dataUrl;
  });
  reader.readAsDataURL(file);
}

function touchWorld(world) {
  world.updatedAt = new Date().toISOString();
}

function resetGraphView() {
  graphView = { ...emptyGraphView };
}

function getGraphViewportPoint(clientX, clientY) {
  const rect = elements.graphSvg.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function getGraphViewportCenter() {
  return {
    x: graphSize.width / 2,
    y: graphSize.height / 2,
  };
}

function viewportToGraphPoint(point) {
  return {
    x: (point.x - graphView.x) / graphView.scale,
    y: (point.y - graphView.y) / graphView.scale,
  };
}

function setGraphScale(nextScale, anchor = getGraphViewportCenter(), graphAnchor = viewportToGraphPoint(anchor)) {
  const clampedScale = clamp(nextScale, GRAPH_MIN_SCALE, GRAPH_MAX_SCALE);
  if (!Number.isFinite(clampedScale) || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return;

  graphView.x = anchor.x - graphAnchor.x * clampedScale;
  graphView.y = anchor.y - graphAnchor.y * clampedScale;
  graphView.scale = clampedScale;
  renderGraph(getWorld());
}

function zoomGraph(multiplier, anchor) {
  updateGraphSize();
  setGraphScale(graphView.scale * multiplier, anchor || getGraphViewportCenter());
}

function rememberGraphPointer(event) {
  graphPointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
  });
}

function releaseGraphPointer(event) {
  graphPointers.delete(event.pointerId);
  try {
    if (elements.graphSvg.hasPointerCapture?.(event.pointerId)) {
      elements.graphSvg.releasePointerCapture(event.pointerId);
    }
  } catch (error) {
    console.warn("Could not release graph pointer.", error);
  }
}

function getPinchGeometry(pointerIds) {
  const first = graphPointers.get(pointerIds[0]);
  const second = graphPointers.get(pointerIds[1]);
  if (!first || !second) return null;

  const midpoint = getGraphViewportPoint((first.x + second.x) / 2, (first.y + second.y) / 2);
  return {
    distance: Math.max(Math.hypot(second.x - first.x, second.y - first.y), 1),
    midpoint,
  };
}

function startGraphPinch() {
  const pointerIds = Array.from(graphPointers.keys()).slice(0, 2);
  const geometry = getPinchGeometry(pointerIds);
  if (!geometry) return false;

  if (dragState?.type === "node") saveState();
  const anchorGraphPoint = viewportToGraphPoint(geometry.midpoint);
  dragState = {
    type: "pinch",
    pointerIds,
    startDistance: geometry.distance,
    startScale: graphView.scale,
    anchorGraphX: anchorGraphPoint.x,
    anchorGraphY: anchorGraphPoint.y,
  };
  return true;
}

function continuePanAfterPinch() {
  const [pointerId, point] = graphPointers.entries().next().value || [];
  if (pointerId === undefined || !point) {
    dragState = null;
    return;
  }

  dragState = {
    type: "pan",
    pointerId,
    startX: point.x,
    startY: point.y,
    originX: graphView.x,
    originY: graphView.y,
  };
}

function zoomGraphAroundPointer(event) {
  const anchor = getGraphViewportPoint(event.clientX, event.clientY);
  const wheelAmount = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
  const multiplier = clamp(Math.exp(-wheelAmount * 0.0016), 0.82, 1.18);
  zoomGraph(multiplier, anchor);
}

function centerGraphOnCharacter(characterId) {
  const world = getWorld();
  const character = world?.characters.find((item) => item.id === characterId);
  if (!character || activeView !== "graph" || elements.graphView.classList.contains("hidden")) return;

  updateGraphSize();
  const scale = clamp(Math.max(graphView.scale, GRAPH_FOCUS_SCALE), GRAPH_MIN_SCALE, GRAPH_MAX_SCALE);
  graphView.scale = scale;
  graphView.x = graphSize.width / 2 - character.x * scale;
  graphView.y = graphSize.height / 2 - character.y * scale;
  renderGraph(world);
}

function centerGraphOnConnection(connectionId) {
  const world = getWorld();
  const connection = world?.connections.find((item) => item.id === connectionId);
  if (!connection || activeView !== "graph" || elements.graphView.classList.contains("hidden")) return;

  const source = world.characters.find((character) => character.id === connection.source);
  const target = world.characters.find((character) => character.id === connection.target);
  if (!source || !target) return;

  updateGraphSize();
  const midpointX = (source.x + target.x) / 2;
  const midpointY = (source.y + target.y) / 2;
  const width = Math.max(Math.abs(target.x - source.x) + GRAPH_FIT_PADDING * 2, 1);
  const height = Math.max(Math.abs(target.y - source.y) + GRAPH_FIT_PADDING * 2, 1);
  const scale = clamp(Math.min(graphSize.width / width, graphSize.height / height), GRAPH_FIT_MIN_SCALE, GRAPH_MAX_SCALE);

  graphView.scale = scale;
  graphView.x = graphSize.width / 2 - midpointX * scale;
  graphView.y = graphSize.height / 2 - midpointY * scale;
  renderGraph(world);
}

function focusCharacterInGraph(characterId) {
  const world = getWorld();
  if (!world?.characters.some((character) => character.id === characterId)) return;

  state.selectedCharacterId = characterId;
  selectedConnectionId = null;
  activeView = "graph";
  setActiveTab("character");
  saveState();
  render();
  requestAnimationFrame(() => centerGraphOnCharacter(characterId));
}

function fitGraph() {
  const world = getWorld();
  if (activeView !== "graph" || elements.graphView.classList.contains("hidden")) return;

  if (!world.characters.length) {
    resetGraphView();
    renderGraph(world);
    return;
  }

  updateGraphSize();
  const xs = world.characters.map((character) => character.x);
  const ys = world.characters.map((character) => character.y);
  const minX = Math.min(...xs) - GRAPH_FIT_PADDING;
  const maxX = Math.max(...xs) + GRAPH_FIT_PADDING;
  const minY = Math.min(...ys) - GRAPH_FIT_PADDING;
  const maxY = Math.max(...ys) + GRAPH_FIT_PADDING;
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const scale = clamp(Math.min(graphSize.width / width, graphSize.height / height), GRAPH_FIT_MIN_SCALE, GRAPH_MAX_SCALE);

  graphView.scale = scale;
  graphView.x = (graphSize.width - width * scale) / 2 - minX * scale;
  graphView.y = (graphSize.height - height * scale) / 2 - minY * scale;
  renderGraph(world);
}

function autoLayout() {
  const world = getWorld();
  const total = world.characters.length;
  if (!total) return;

  const center = graphCenter();
  const radius = Math.max(145, Math.min(280, 72 * total));
  world.characters.forEach((character, index) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    character.x = Math.round(center.x + Math.cos(angle) * radius);
    character.y = Math.round(center.y + Math.sin(angle) * radius);
  });

  touchWorld(world);
  saveState();
  render();
  fitGraph();
}

function screenToGraph(event) {
  return viewportToGraphPoint(getGraphViewportPoint(event.clientX, event.clientY));
}

function startGraphPointer(event) {
  event.preventDefault();
  rememberGraphPointer(event);
  elements.graphSvg.setPointerCapture(event.pointerId);

  if (graphPointers.size >= 2 && startGraphPinch()) {
    return;
  }

  const node = event.target.closest(".node");
  const edge = event.target.closest(".edge");

  if (node) {
    const characterId = node.dataset.characterId;
    const character = getCharacter(characterId);
    if (!character) return;

    state.selectedCharacterId = characterId;
    selectedConnectionId = null;
    setActiveTab("character");
    const point = screenToGraph(event);
    dragState = {
      type: "node",
      pointerId: event.pointerId,
      characterId,
      offsetX: point.x - character.x,
      offsetY: point.y - character.y,
    };
    render();
    return;
  }

  if (edge) {
    selectedConnectionId = edge.dataset.connectionId;
    const connection = getConnection();
    state.selectedCharacterId = connection?.source || state.selectedCharacterId;
    setActiveTab("connection");
    render();
    requestAnimationFrame(() => centerGraphOnConnection(selectedConnectionId));
    return;
  }

  const point = {
    x: event.clientX,
    y: event.clientY,
  };
  dragState = {
    type: "pan",
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    originX: graphView.x,
    originY: graphView.y,
  };
}

function moveGraphPointer(event) {
  if (graphPointers.has(event.pointerId)) rememberGraphPointer(event);

  if (dragState?.type === "pinch") {
    event.preventDefault();
    const geometry = getPinchGeometry(dragState.pointerIds);
    if (!geometry) return;

    setGraphScale(
      dragState.startScale * (geometry.distance / dragState.startDistance),
      geometry.midpoint,
      { x: dragState.anchorGraphX, y: dragState.anchorGraphY },
    );
    return;
  }

  if (!dragState || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();

  if (dragState.type === "node") {
    const world = getWorld();
    const character = world.characters.find((item) => item.id === dragState.characterId);
    if (!character) return;

    const point = screenToGraph(event);
    character.x = Math.round(point.x - dragState.offsetX);
    character.y = Math.round(point.y - dragState.offsetY);
    touchWorld(world);
    renderGraph(world);
    return;
  }

  graphView.x = dragState.originX + event.clientX - dragState.startX;
  graphView.y = dragState.originY + event.clientY - dragState.startY;
  renderGraph(getWorld());
}

function endGraphPointer(event) {
  const endedDrag = dragState;
  const endedPinchPointer = endedDrag?.type === "pinch" && endedDrag.pointerIds.includes(event.pointerId);
  const endedPrimaryPointer = endedDrag?.pointerId === event.pointerId;

  releaseGraphPointer(event);

  if (!endedDrag) return;

  if (endedDrag.type === "pinch" && endedPinchPointer) {
    if (graphPointers.size >= 2) {
      startGraphPinch();
      return;
    }
    continuePanAfterPinch();
    return;
  }

  if (!endedPrimaryPointer) return;

  if (endedDrag.type === "node") {
    saveState();
    render();
  }
  dragState = null;
}

function startMapPointer(event) {
  const pin = event.target.closest("[data-location-id]");
  if (!pin) return;
  event.preventDefault();

  const locationId = pin.dataset.locationId;
  const location = getLocation(locationId);
  if (!location) return;

  selectedLocationId = locationId;
  activeView = "map";
  setActiveTab("location");
  dragState = {
    type: "location",
    pointerId: event.pointerId,
    locationId,
  };
  elements.mapCanvas.setPointerCapture(event.pointerId);
  render();
}

function moveMapPointer(event) {
  if (!dragState || dragState.type !== "location" || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();

  const world = getWorld();
  const location = world.locations.find((item) => item.id === dragState.locationId);
  if (!location) return;

  const point = getMapImagePoint(event, world);
  location.x = point.x;
  location.y = point.y;
  touchWorld(world);
  renderMap(world);
}

function endMapPointer(event) {
  if (!dragState || dragState.type !== "location" || dragState.pointerId !== event.pointerId) return;
  event.preventDefault();
  dragState = null;
  saveState();
  render();
}

function downloadTextFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJson() {
  downloadTextFile(JSON.stringify(state, null, 2), "worldbuilder-export.json", "application/json");
}

function exportLoreBible() {
  const world = getWorld();
  if (!world) return;
  const filename = `${slugify(world.name || "worldbuilder")}-lore-bible.md`;
  downloadTextFile(buildLoreBible(world), filename, "text/markdown");
}

function exportSelectedFormat() {
  if (elements.exportFormatSelect.value === "lore") {
    exportLoreBible();
  } else {
    exportJson();
  }
}

function updateExportControl() {
  const isLoreBible = elements.exportFormatSelect.value === "lore";
  const label = isLoreBible ? "Export lore bible" : "Export JSON";
  elements.exportButton.setAttribute("aria-label", label);
  elements.exportButton.setAttribute("title", label);
}

function buildLoreBible(world) {
  const charactersById = new Map(world.characters.map((character) => [character.id, character]));
  const lines = [];

  lines.push(`# ${plainMarkdown(world.name || "Untitled World")}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Updated: ${formatDateTime(world.updatedAt || world.createdAt)}`);
  lines.push("");
  lines.push("## Overview");
  lines.push(`- Characters: ${world.characters.length}`);
  lines.push(`- Connections: ${world.connections.length}`);
  lines.push(`- Timeline events: ${world.events.length}`);
  lines.push(`- Places: ${world.locations.length}`);
  lines.push(`- Map background: ${world.mapImage ? "Attached in app data" : "Not attached"}`);
  lines.push("");

  lines.push("## Characters");
  if (!world.characters.length) {
    lines.push("No characters yet.");
  } else {
    world.characters.forEach((character) => {
      lines.push(`### ${plainMarkdown(character.name || "Unnamed character")}`);
      addLoreLine(lines, "Role", character.role);
      addLoreLine(lines, "Faction", character.faction);
      addLoreLine(lines, "Status", character.status);
      addLoreLine(lines, "Map / graph icon", character.avatarImage ? "Attached in app data" : "");
      addLoreBlock(lines, "Notes", character.notes);
      lines.push("");
    });
  }

  lines.push("## Connections");
  if (!world.connections.length) {
    lines.push("No connections yet.");
  } else {
    world.connections.forEach((connection) => {
      const source = charactersById.get(connection.source)?.name || "Unknown";
      const target = charactersById.get(connection.target)?.name || "Unknown";
      lines.push(`### ${plainMarkdown(source)} -> ${plainMarkdown(target)}`);
      addLoreLine(lines, "Type", connection.type);
      addLoreLine(lines, "Label", connection.label);
      addLoreLine(lines, "Strength", `${connection.strength || 3}/5`);
      addLoreBlock(lines, "Notes", connection.notes);
      lines.push("");
    });
  }

  lines.push("## Timeline");
  if (!world.events.length) {
    lines.push("No events yet.");
  } else {
    [...world.events].sort(compareEvents).forEach((event) => {
      const character = charactersById.get(event.characterId);
      const dateLabel = [event.era, event.date].filter(Boolean).join(" / ") || "Undated";
      lines.push(`### ${plainMarkdown(event.title || "Untitled event")}`);
      addLoreLine(lines, "Date", dateLabel);
      addLoreLine(lines, "Category", event.category);
      addLoreLine(lines, "Character", character?.name || "");
      addLoreBlock(lines, "Impact", event.impact);
      addLoreBlock(lines, "Notes", event.notes);
      lines.push("");
    });
  }

  lines.push("## Places");
  if (!world.locations.length) {
    lines.push("No places yet.");
  } else {
    world.locations.forEach((location) => {
      const keeper = charactersById.get(location.characterId);
      lines.push(`### ${plainMarkdown(location.name || "Unnamed place")}`);
      addLoreLine(lines, "Type", location.type);
      addLoreLine(lines, "Region", location.region);
      addLoreLine(lines, "Linked character", keeper?.name || "");
      addLoreLine(lines, "Map position", `${Math.round((location.x || 0) * 100)}%, ${Math.round((location.y || 0) * 100)}%`);
      addLoreBlock(lines, "Notes", location.notes);
      lines.push("");
    });
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function addLoreLine(lines, label, value) {
  const text = plainMarkdown(value);
  if (text) lines.push(`- ${label}: ${text}`);
}

function addLoreBlock(lines, label, value) {
  const text = plainMarkdown(value);
  if (!text) return;
  lines.push(`- ${label}:`);
  text.split("\n").forEach((line) => {
    lines.push(`  ${line}`);
  });
}

function plainMarkdown(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .trim();
}

function slugify(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "worldbuilder";
}

function formatDateTime(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function importJson(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = normalizeState(JSON.parse(String(reader.result || "")));
      state = imported;
      activeView = state.activeView || "graph";
      selectedConnectionId = state.selectedConnectionId || null;
      selectedEventId = state.selectedEventId || null;
      selectedLocationId = state.selectedLocationId || null;
      resetGraphView();
      saveState();
      render();
      fitGraph();
    } catch (error) {
      window.alert("That JSON file does not match the Worldbuilder format.");
      console.warn(error);
    }
  });
  reader.readAsText(file);
}

function bindEvents() {
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.ambienceToggleButton.addEventListener("click", toggleAmbience);
  elements.ambienceSelect.addEventListener("change", () => setAmbienceProfile(elements.ambienceSelect.value));

  elements.worldForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = elements.worldName.value.trim();
    if (!name) return;
    createWorld(name);
    elements.worldName.value = "";
  });

  elements.focusWorldName.addEventListener("click", () => elements.worldName.focus());
  elements.deleteWorldButton.addEventListener("click", deleteSelectedWorld);

  elements.worldList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-world-id]");
    if (!item) return;
    state.selectedWorldId = item.dataset.worldId;
    const world = getWorld();
    state.selectedCharacterId = world.characters[0]?.id || null;
    selectedConnectionId = null;
    selectedEventId = null;
    selectedLocationId = null;
    activeView = "graph";
    resetGraphView();
    saveState();
    render();
    requestAnimationFrame(fitGraph);
  });

  elements.worldTitleInput.addEventListener("change", () => {
    const world = getWorld();
    const name = elements.worldTitleInput.value.trim();
    if (!name) {
      elements.worldTitleInput.value = world.name;
      return;
    }
    world.name = name;
    touchWorld(world);
    saveState();
    render();
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  elements.characterList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-character-id]");
    if (!item) return;
    focusCharacterInGraph(item.dataset.characterId);
  });

  elements.newCharacterButton.addEventListener("click", clearCharacterForm);
  elements.newConnectionButton.addEventListener("click", clearConnectionForm);
  elements.emptyAddCharacter.addEventListener("click", clearCharacterForm);
  elements.clearCharacterButton.addEventListener("click", clearCharacterForm);
  elements.deleteCharacterButton.addEventListener("click", deleteSelectedCharacter);
  elements.uploadCharacterImageButton.addEventListener("click", () => elements.characterImageFile.click());
  elements.clearCharacterImageButton.addEventListener("click", clearCharacterImage);
  elements.characterImageFile.addEventListener("change", () => {
    const file = elements.characterImageFile.files?.[0];
    if (file) readImageFile(file, setCharacterImage);
    elements.characterImageFile.value = "";
  });

  elements.characterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addOrUpdateCharacter(new FormData(elements.characterForm));
  });

  elements.colorSwatches.addEventListener("click", (event) => {
    const button = event.target.closest("[data-color]");
    if (!button) return;
    selectedColor = button.dataset.color;
    renderSwatches();
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  elements.connectionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addOrUpdateConnection(new FormData(elements.connectionForm));
  });

  elements.clearConnectionButton.addEventListener("click", clearConnectionForm);
  elements.deleteConnectionButton.addEventListener("click", deleteSelectedConnection);

  elements.connectionList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-connection]");
    if (deleteButton) {
      deleteConnection(deleteButton.dataset.deleteConnection);
      return;
    }

    const item = event.target.closest("[data-connection-id]");
    if (!item) return;
    selectedConnectionId = item.dataset.connectionId;
    const connection = getConnection();
    state.selectedCharacterId = connection?.source || state.selectedCharacterId;
    activeView = "graph";
    setActiveTab("connection");
    saveState();
    render();
    requestAnimationFrame(() => centerGraphOnConnection(selectedConnectionId));
  });

  elements.newEventButton.addEventListener("click", clearEventForm);
  elements.newRailEventButton.addEventListener("click", clearEventForm);
  elements.emptyAddEvent.addEventListener("click", clearEventForm);
  elements.clearEventButton.addEventListener("click", clearEventForm);
  elements.deleteEventButton.addEventListener("click", deleteSelectedEvent);

  elements.eventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addOrUpdateEvent(new FormData(elements.eventForm));
  });

  elements.timelineList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-event-id]");
    if (!item) return;
    selectedEventId = item.dataset.eventId;
    activeView = "timeline";
    setActiveTab("event");
    saveState();
    render();
  });
  elements.eventList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-event-id]");
    if (!item) return;
    selectedEventId = item.dataset.eventId;
    activeView = "timeline";
    setActiveTab("event");
    saveState();
    render();
  });

  elements.newLocationButton.addEventListener("click", clearLocationForm);
  elements.newRailLocationButton.addEventListener("click", clearLocationForm);
  elements.emptyAddLocation.addEventListener("click", clearLocationForm);
  elements.clearLocationButton.addEventListener("click", clearLocationForm);
  elements.deleteLocationButton.addEventListener("click", deleteSelectedLocation);
  elements.emptyUploadMapImage.addEventListener("click", () => elements.mapImageFile.click());
  elements.uploadMapImageButton.addEventListener("click", () => elements.mapImageFile.click());
  elements.clearMapImageButton.addEventListener("click", clearMapImage);
  elements.mapImageFile.addEventListener("change", () => {
    const file = elements.mapImageFile.files?.[0];
    if (file) readImageFile(file, setMapImage);
    elements.mapImageFile.value = "";
  });

  elements.locationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addOrUpdateLocation(new FormData(elements.locationForm));
  });

  elements.locationStrip.addEventListener("click", (event) => {
    const item = event.target.closest("[data-location-id]");
    if (!item) return;
    selectedLocationId = item.dataset.locationId;
    activeView = "map";
    setActiveTab("location");
    saveState();
    render();
  });

  elements.graphSvg.addEventListener("pointerdown", startGraphPointer);
  elements.graphSvg.addEventListener("pointermove", moveGraphPointer);
  elements.graphSvg.addEventListener("pointerup", endGraphPointer);
  elements.graphSvg.addEventListener("pointercancel", endGraphPointer);

  elements.mapCanvas.addEventListener("pointerdown", startMapPointer);
  elements.mapCanvas.addEventListener("pointermove", moveMapPointer);
  elements.mapCanvas.addEventListener("pointerup", endMapPointer);
  elements.mapCanvas.addEventListener("pointercancel", endMapPointer);

  elements.graphSvg.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoomGraphAroundPointer(event);
    },
    { passive: false },
  );

  elements.fitButton.addEventListener("click", fitGraph);
  elements.autoLayoutButton.addEventListener("click", autoLayout);
  elements.zoomInButton.addEventListener("click", () => zoomGraph(1.14));
  elements.zoomOutButton.addEventListener("click", () => zoomGraph(0.86));
  elements.exportFormatSelect.addEventListener("change", updateExportControl);
  elements.exportButton.addEventListener("click", exportSelectedFormat);
  elements.importButton.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    const file = elements.importFile.files?.[0];
    if (file) importJson(file);
    elements.importFile.value = "";
  });

  window.addEventListener("resize", () => {
    updateGraphSize();
    renderGraph(getWorld());
    updateMapPinPositions(getWorld());
  });
}

bindEvents();
applyTheme(currentTheme);
updateAmbienceControl();
updateExportControl();
setActiveTab(activeView === "timeline" ? "event" : activeView === "map" ? "location" : "character");
render();
saveState();
requestAnimationFrame(fitGraph);
