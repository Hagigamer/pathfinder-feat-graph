String.prototype.toCamelCase = function toCamelCase() {
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

// Define the Cytoscape instance outside of the initial setup
let cy;

async function initializeCy(locale) {
  // Fetch graph data and styles based on the selected locale
  const elements = await fetch(`data/${locale}/talents.json`).then(res => res.json());
  const style = await fetch('style/cy-style.json').then(res => res.json());

  // Initialize Cytoscape
  cy = cytoscape({
    container: document.getElementById('cy'), // container to render in
    elements: elements,
    style: style, // Style path remains the same
    layout: { name: 'grid' },
    autoungrabify: true,
    minZoom: 0.2,
    maxZoom: 5,
    wheelSensitivity: 0.5,
  });

  // Event listeners remain the same
  cy.on('select', 'node', function (event) {
    displayFeat(event.target);
  });

  cy.on('unselect', 'node', function (event) {
    document.getElementById('feat-info').classList.add('d-none');
  });

  cy.ready(event => {
    console.log("Graph loaded for locale:", locale);
  });

  // Re-bind the search input after reinitializing the graph
  bindSearch(locale);
}

// Re-bind the search functionality when the graph is reloaded
function bindSearch(locale) {
  const search = new autoComplete({
    selector: "#search",
    placeHolder: "Search...", // Placeholder text can also be localized if needed
    data: {
      src: fetch(`data/${locale}/talents.json`).then(res => res.json()).then(graphData => graphData.nodes.map(node => node.data.name))
    },
    resultItem: {
      highlight: true,
    },
    submit: false,
    events: {
      input: {
        selection: (event) => {
          const selection = event.detail.selection.value;
          search.input.value = selection;
          searchFeats(selection);
        }
      }
    }
  });
}

function removeSplashScreen() {
  const splashScreen = document.getElementById("splash");
  if (splashScreen) {
    splashScreen.remove();
  }
}

function searchFeats(featName) {
  removeSplashScreen();
  const feat = cy.getElementById(featName.toCamelCase());
  const featTree = feat.predecessors().union(feat.successors()).union(feat);
  cy.nodes().removeClass('visible');
  featTree.nodes().addClass('visible');
  const dagre = {
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 50,
    rankSep: 150,
    nodeDimensionsIncludeLabels: true,
  };
  featTree.layout(dagre).run();
}

function setFeatSection(displayText, section) {
  const htmlSection = document.getElementById(`feat-${section}-section`);
  const htmlText = document.getElementById(`feat-${section}`);
  if (displayText) {
    htmlText.textContent = displayText;
    htmlSection.hidden = false;
  } else {
    htmlSection.hidden = true;
  }
}

function displayFeat(featNode) {
  const featData = featNode.data();
  document.getElementById('feat-name').textContent = featData.name;
  setFeatSection(featData.categories?.join(", "), 'categories');
  setFeatSection(featData.description, 'description');
  setFeatSection(featData.prerequisites, 'prerequisites');
  setFeatSection(featData.benefit, 'benefit');
  setFeatSection(featData.normal, 'normal');
  setFeatSection(featData.special, 'special');
  setFeatSection(featData.goal, 'goal');
  setFeatSection(featData.completionBenefit, 'completion');
  setFeatSection(featData.note, 'note');
  document.getElementById('feat-info').classList.remove('d-none');
  featNode.neighborhood('edge').select();
}

document.getElementById('search').addEventListener("change", event => {
  searchFeats(event.target.value);
});

// Initialize Cytoscape with the default locale when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  const initialLocale = GetCurrentOrDefaultLocale(browserLocales(true));
  await initializeCy(initialLocale); // Load the graph data initially
});

async function updateGraphForLocale(newLocale) {
  console.log("code.js locale changed to:", newLocale);
  await initializeCy(newLocale); // Re-initialize Cytoscape with the new language
}
