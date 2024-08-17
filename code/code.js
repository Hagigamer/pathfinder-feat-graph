String.prototype.toCamelCase = function toCamelCase() 
{
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

// Define the Cytoscape instance and autoComplete instance outside of the initial setup
let cy;
let searchAutocomplete = null; // Reference to the autoComplete instance

// Function to initialize Cytoscape
async function initializeCy(locale) 
{
  console.log("Initializing Cytoscape for locale:", locale);
  if (cy) 
  {
    cy.destroy(); // Clean up the old instance
    cy = null; // Ensure cy is set to null to prevent issues
  }
  const elements = await fetch(`data/${locale}/talents.json`).then(res => res.json());
  const style = await fetch('style/cy-style.json').then(res => res.json());
  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: elements,
    style: style,
    layout: { name: 'grid' },
    autoungrabify: true,
    minZoom: 0.2,
    maxZoom: 5,
    wheelSensitivity: 0.5,
  });

  cy.on('select', 'node', function (event) {
    displayFeat(event.target);
  });

  cy.on('unselect', 'node', function (event) {
    document.getElementById('feat-info').classList.add('d-none');
  });

  cy.ready(() => {
    console.log("Graph loaded for locale:", locale);
  });

  // Ensure search functionality is updated if necessary
  bindSearch(locale);
}

// Re-bind the search functionality when the graph is reloaded
async function bindSearch(locale) 
{
  // Clear previous autocomplete instance if it exists
  if (searchAutocomplete) 
    {
    searchAutocomplete.input.value = ''; // Clear current input value
    searchAutocomplete.list.remove(); // Remove the current suggestion list if present
    searchAutocomplete = null; // Dereference previous instance
  }
  const placeholderText = translations["searchPlaceholder"] || "Search..."; // Fallback placeholder text
  // Fetch new data for the selected locale
  const fetchData = async () => 
    {
    const response = await fetch(`data/${locale}/talents.json`);
    const graphData = await response.json();
    return graphData.nodes.map(node => node.data.name);
  };

  // Create a new autoComplete instance
  searchAutocomplete = new autoComplete({
    selector: "#search",
    placeHolder: placeholderText, // Use localized placeholder text
    data: 
    {
      src: await fetchData(), // Use fetched data
    },
    resultItem: 
    {
      highlight: true,
    },
    submit: false,
    events: {
      input: {
        selection: (event) => {
          const selection = event.detail.selection.value;
          searchAutocomplete.input.value = selection;
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

async function updateGraphForLocale(newLocale) {
  console.log("Updating graph for locale:", newLocale);
  await initializeCy(newLocale); // Re-initialize Cytoscape with the new language
}
