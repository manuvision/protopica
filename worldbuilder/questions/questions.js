const STORAGE_KEY = "protopica.worldbuilder.questions.v1";
const COLORS = ["#4fe2de", "#977cff", "#71b4ff", "#d474ff", "#265d5e", "#fffdf8"];

const questions = [
  {
    id: "emotionalPromise",
    pillar: "Premise",
    title: "What is the emotional promise of this universe?",
    help: "Not the plot yet. What should the audience feel this world is really about?",
  },
  {
    id: "worldName",
    pillar: "Premise",
    title: "What do we call the world, civilization, or first story canvas?",
    help: "A working title is enough. Include alternate names if you are not sure.",
  },
  {
    id: "coreTension",
    pillar: "Politics & Power",
    title: "What tension keeps the world from becoming a utopia?",
    help: "Think alignment vs misalignment, access to awareness, control of truth, or another fracture that can generate stories.",
  },
  {
    id: "powerMechanism",
    pillar: "Politics & Power",
    title: "How does influence actually work here?",
    help: "Who gets listened to, feared, followed, consulted, ignored, or excluded?",
  },
  {
    id: "beliefs",
    pillar: "Religion & Rituals",
    title: "What do people believe reality is made of?",
    help: "Name the dominant cosmology and one competing belief that challenges it.",
  },
  {
    id: "rituals",
    pillar: "Religion & Rituals",
    title: "What daily rituals help people tune themselves to the world?",
    help: "Creative practices, elemental rituals, dream states, mantras, music, dance, food, astronomy, or local customs.",
  },
  {
    id: "society",
    pillar: "Organization of Society",
    title: "What does status look like in everyday life?",
    help: "How do people recognize contribution, consciousness, service, craft, age, ancestry, or access?",
  },
  {
    id: "inequality",
    pillar: "Organization of Society",
    title: "Who is left out, and why?",
    help: "Describe the people who cannot access the main system, reject it, are protected from it, or are contained by it.",
  },
  {
    id: "technology",
    pillar: "Technology & Tools",
    title: "What makes technology feel specific to this universe?",
    help: "Describe materials, interfaces, limits, rituals, costs, and whether tools are worn, grown, dreamed, built, inherited, or hacked.",
  },
  {
    id: "cost",
    pillar: "Technology & Tools",
    title: "What is the cost of using power?",
    help: "What drains, regresses, corrupts, exposes, or changes someone when they overuse technology or consciousness?",
  },
  {
    id: "ontology",
    pillar: "Ontology & Reality",
    title: "What is the deepest law of reality?",
    help: "Memory, time loops, the Vault, the Origin, the Archivist, fate, agency, illusion, or whatever rule everything secretly obeys.",
  },
  {
    id: "anomalies",
    pillar: "Ontology & Reality",
    title: "Where does reality misbehave?",
    help: "Name the places, events, or conditions where loops, memories, perception, or the Vault become unstable.",
  },
  {
    id: "geography",
    pillar: "Physical World & Geography",
    title: "What are the 3 to 5 anchor environments?",
    help: "Concrete places. For example: Day Archipelago, Night Archipelago, abyssal settlements, volcanic cradle cities, orbital layers.",
  },
  {
    id: "mobility",
    pillar: "Physical World & Geography",
    title: "How do people move between layers of the world?",
    help: "Is movement easy, rare, restricted, expensive, ritualized, inherited, hacked, or only possible under specific conditions?",
  },
  {
    id: "species",
    pillar: "Inhabitants & Species",
    title: "Who lives here besides baseline humans?",
    help: "Describe adaptive humans, hybrids, synthetic beings, guardians, transcended beings, or ecosystems with agency.",
  },
  {
    id: "culture",
    pillar: "Culture & Arts",
    title: "What does this world protect as sacred?",
    help: "Nature, art, memory, plurality, language, ancestry, ecology, creative expression, or another non-negotiable value.",
  },
  {
    id: "factions",
    pillar: "Allegiances & Warfare",
    title: "What are the major factions or belief blocs?",
    help: "Controllers, hackers, naturalists, transcended beings, local leaders, memory keepers, or any groups you invent.",
  },
  {
    id: "firstStory",
    pillar: "Story Engine",
    title: "Who is the first story about, and what do they discover?",
    help: "Give us a protagonist engine: a person, wound, forbidden truth, relationship, place, and choice.",
  },
];

const elements = {
  progressLabel: document.querySelector("#progressLabel"),
  completeLabel: document.querySelector("#completeLabel"),
  progressFill: document.querySelector("#progressFill"),
  stepMap: document.querySelector("#stepMap"),
  questionKicker: document.querySelector("#questionKicker"),
  questionTitle: document.querySelector("#questionTitle"),
  questionHelp: document.querySelector("#questionHelp"),
  answerInput: document.querySelector("#answerInput"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  resetButton: document.querySelector("#resetButton"),
  outputPanel: document.querySelector("#outputPanel"),
  jsonPreview: document.querySelector("#jsonPreview"),
  downloadWorldbuilderButton: document.querySelector("#downloadWorldbuilderButton"),
  downloadNotesButton: document.querySelector("#downloadNotesButton"),
};

let currentIndex = 0;
let answers = loadAnswers();

function loadAnswers() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

function saveAnswers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

function slug(value) {
  return String(value || "protopica-workshop")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "protopica-workshop";
}

function id(prefix, value) {
  return `${prefix}_${slug(value).slice(0, 34)}`;
}

function answer(questionId) {
  return String(answers[questionId] || "").trim();
}

function renderQuestion() {
  const question = questions[currentIndex];
  const completeCount = questions.filter((item) => answer(item.id)).length;
  elements.progressLabel.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
  elements.completeLabel.textContent = `${completeCount} answered`;
  elements.progressFill.style.width = `${(completeCount / questions.length) * 100}%`;
  elements.questionKicker.textContent = question.pillar;
  elements.questionTitle.textContent = question.title;
  elements.questionHelp.textContent = question.help;
  elements.answerInput.value = answers[question.id] || "";
  elements.prevButton.disabled = currentIndex === 0;
  elements.nextButton.textContent = currentIndex === questions.length - 1 ? "Finish" : "Next";
  renderStepMap();
}

function renderStepMap() {
  elements.stepMap.textContent = "";
  questions.forEach((question, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "step-map__button";
    button.classList.toggle("is-current", index === currentIndex);
    button.classList.toggle("is-complete", Boolean(answer(question.id)));
    button.setAttribute("aria-label", `Go to question ${index + 1}: ${question.pillar}`);
    button.innerHTML = `<strong>${String(index + 1).padStart(2, "0")}</strong><span>${question.pillar}</span>`;
    button.addEventListener("click", () => {
      syncCurrentAnswer();
      currentIndex = index;
      elements.outputPanel.hidden = true;
      renderQuestion();
    });
    item.appendChild(button);
    elements.stepMap.appendChild(item);
  });
}

function syncCurrentAnswer() {
  answers[questions[currentIndex].id] = elements.answerInput.value;
  saveAnswers();
  if (!elements.outputPanel.hidden) {
    elements.jsonPreview.textContent = JSON.stringify(buildWorldbuilderJson(), null, 2);
  }
}

function compactLines(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function firstLine(value, fallback) {
  return compactLines(value)[0] || fallback;
}

function createCharacter(name, role, faction, status, notes, color, x, y) {
  return {
    id: id("char", name),
    name,
    role,
    faction,
    status,
    notes,
    color,
    avatarImage: "",
    x,
    y,
  };
}

function createLocation(name, type, region, notes, x, y) {
  return {
    id: id("place", name),
    name,
    type,
    region,
    characterId: "",
    notes,
    x,
    y,
  };
}

function createEvent(title, era, category, impact, notes) {
  return {
    id: id("event", title),
    title,
    era,
    date: "",
    category,
    characterId: "",
    impact,
    notes,
  };
}

function buildNotesJson() {
  return {
    version: 1,
    title: "Protopica IP Worldbuilding Workshop",
    createdAt: new Date().toISOString(),
    framework: "P.R.O.T.O.P.I.C.A",
    frameworkPdf: "https://protopica.com/worldbuilder/questions/protopica-worldbuilding-framework.pdf",
    answers: questions.map((question) => ({
      id: question.id,
      pillar: question.pillar,
      question: question.title,
      answer: answer(question.id),
    })),
  };
}

function buildWorldbuilderJson() {
  const worldName = firstLine(answer("worldName"), "Protopica Workshop World");
  const worldId = id("world", worldName);
  const now = new Date().toISOString();
  const factions = compactLines(answer("factions"));
  const places = compactLines(answer("geography"));

  const characters = [
    createCharacter(
      firstLine(answer("firstStory"), "First Protagonist"),
      "Protagonist",
      factions[0] || "Unaligned",
      "Active",
      [
        answer("firstStory"),
        answer("coreTension") ? `Core tension: ${answer("coreTension")}` : "",
      ].filter(Boolean).join("\n\n"),
      COLORS[0],
      280,
      250
    ),
    createCharacter("The Memory Archivist", "Guardian of the Vault", "The Vault", "Mythic", answer("ontology"), COLORS[1], 560, 190),
    createCharacter("Controllers", "Faction", "High-LoC governance", "Active", answer("powerMechanism"), COLORS[2], 740, 330),
    createCharacter("Hackers", "Faction", "Unauthorized access", "Hidden", answer("factions"), COLORS[3], 460, 430),
    createCharacter("Naturalists", "Faction", "Ecological memory", "Active", answer("culture"), COLORS[4], 690, 470),
  ];

  const locations = (places.length ? places : ["Day Archipelago", "Night Archipelago", "Abyssal Settlement", "Volcanic Cradle City", "Vault-thin Anomaly Zone"])
    .slice(0, 7)
    .map((place, index) =>
      createLocation(
        place.replace(/^[-*]\s*/, ""),
        index === 4 ? "Anomaly" : index === 2 ? "Settlement" : "Region",
        index < 2 ? "Primary story canvas" : "Extended world",
        [answer("geography"), answer("anomalies")].filter(Boolean).join("\n\n"),
        18 + (index * 13) % 70,
        22 + (index * 17) % 58
      )
    );

  const events = [
    createEvent("The First Leakage", "Current Cycle", "Discovery", answer("inequality"), "Forbidden knowledge reaches people who were never meant to access it."),
    createEvent("The Anomaly Opens", "Current Cycle", "Myth", answer("anomalies"), "Reality becomes thin enough for memory, time, and perception to cross."),
    createEvent("The Choice to Cross", "Current Cycle", "Personal", answer("firstStory"), "The first protagonist must decide what to preserve, betray, or become."),
  ];

  return {
    activeView: "graph",
    selectedWorldId: worldId,
    selectedCharacterId: characters[0].id,
    selectedConnectionId: null,
    selectedEventId: events[0].id,
    selectedLocationId: locations[0]?.id || null,
    worlds: [
      {
        id: worldId,
        name: worldName,
        createdAt: now,
        updatedAt: now,
        characters,
        connections: [
          {
            id: "conn_protagonist_archivist",
            source: characters[0].id,
            target: characters[1].id,
            type: "Unknown",
            label: "Seeks forbidden memory",
            strength: 4,
            notes: answer("ontology"),
          },
          {
            id: "conn_controllers_hackers",
            source: characters[2].id,
            target: characters[3].id,
            type: "Rival",
            label: "Control vs access",
            strength: 5,
            notes: answer("coreTension"),
          },
          {
            id: "conn_naturalists_protagonist",
            source: characters[4].id,
            target: characters[0].id,
            type: "Mentor",
            label: "Alternative path",
            strength: 3,
            notes: answer("culture"),
          },
        ],
        events,
        locations,
        mapImage: "",
        mapImageSize: null,
        workshopNotes: buildNotesJson(),
      },
    ],
  };
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderOutput() {
  const output = buildWorldbuilderJson();
  elements.outputPanel.hidden = false;
  elements.jsonPreview.textContent = JSON.stringify(output, null, 2);
  elements.outputPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

elements.answerInput.addEventListener("input", syncCurrentAnswer);

elements.prevButton.addEventListener("click", () => {
  syncCurrentAnswer();
  currentIndex = Math.max(0, currentIndex - 1);
  renderQuestion();
});

elements.nextButton.addEventListener("click", () => {
  syncCurrentAnswer();
  if (currentIndex === questions.length - 1) {
    renderOutput();
    return;
  }
  currentIndex += 1;
  renderQuestion();
});

elements.resetButton.addEventListener("click", () => {
  if (!window.confirm("Clear all workshop answers from this browser?")) return;
  answers = {};
  currentIndex = 0;
  saveAnswers();
  elements.outputPanel.hidden = true;
  renderQuestion();
});

elements.downloadWorldbuilderButton.addEventListener("click", () => {
  const worldName = firstLine(answer("worldName"), "protopica-workshop-world");
  downloadJson(buildWorldbuilderJson(), `${slug(worldName)}-worldbuilder.json`);
});

elements.downloadNotesButton.addEventListener("click", () => {
  downloadJson(buildNotesJson(), "protopica-workshop-notes.json");
});

renderQuestion();
