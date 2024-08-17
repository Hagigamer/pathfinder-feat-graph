// Utility function to convert strings to camelCase
String.prototype.toCamelCase = function toCamelCase() {
  return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

// Global variables
let cy; // Cytoscape instance
let searchAutocomplete = null; // autoComplete instance

/**
 * Initializes Cytoscape with the given locale and data.
 * @param {string} locale - The locale code (e.g., 'en', 'de').
 */
async function initializeCy(locale) {
  console.log("Initializing Cytoscape for locale:", locale);

  // Destroy existing Cytoscape instance if it exists
  if (cy) {
    cy.destroy();
    cy = null;
  }

  // Fetch and set up the Cytoscape instance with locale-specific data
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

  // Event handler for selecting a node
  cy.on('select', 'node', function (event) {
    displayFeat(event.target);
  });

  // Event handler for unselecting a node
  cy.on('unselect', 'node', function (event) {
    document.getElementById('feat-info').classList.add('d-none');
  });

  cy.ready(() => {
    console.log("Graph loaded for locale:", locale);
  });

  // Re-bind the search functionality with new data
  await bindSearch(locale);
}

/**
 * Re-binds the search functionality and updates the autocomplete instance.
 * @param {string} locale - The locale code (e.g., 'en', 'de').
 */
async function bindSearch(locale) {
  // Clear previous autocomplete instance if it exists
  if (searchAutocomplete) {
    searchAutocomplete.input.value = ''; // Clear input value
    searchAutocomplete.list.remove(); // Remove existing suggestions
    searchAutocomplete = null; // Dereference the old instance
  }

  // Get the placeholder text for the search input
  const placeholderText = translations["searchPlaceholder"] || "Search..."; // Fallback if no translation is found

  // Function to fetch search data for the selected locale
  const fetchData = async () => {
    const response = await fetch(`data/${locale}/talents.json`);
    const graphData = await response.json();
    return graphData.nodes.map(node => node.data.name);
  };

  // Create a new autoComplete instance with the fetched data
  searchAutocomplete = new autoComplete({
    selector: "#search",
    placeHolder: placeholderText, // Use localized placeholder text
    data: {
      src: await fetchData(), // Use fetched data for the search suggestions
    },
    resultItem: {
      highlight: true, // Highlight search results
    },
    submit: false, // Disable form submission on selection
    events: {
      input: {
        selection: (event) => {
          const selection = event.detail.selection.value;
          searchAutocomplete.input.value = selection; // Set the input value to the selected item
          searchFeats(selection); // Perform search for the selected item
        }
      }
    }
  });
}

/**
 * Removes the splash screen if it exists.
 */
function removeSplashScreen() {
  const splashScreen = document.getElementById("splash");
  if (splashScreen) {
    splashScreen.remove();
  }
}

/**
 * Searches for feats and updates the Cytoscape visualization.
 * @param {string} featName - The name of the feat to search for.
 */
function searchFeats(featName) {
  removeSplashScreen();
  const feat = cy.getElementById(featName.toCamelCase()); // Convert feat name to camelCase
  const featTree = feat.predecessors().union(feat.successors()).union(feat); // Get all related nodes
  cy.nodes().removeClass('visible'); // Hide all nodes
  featTree.nodes().addClass('visible'); // Show only related nodes
  const dagre = {
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 50,
    rankSep: 150,
    nodeDimensionsIncludeLabels: true,
  };
  featTree.layout(dagre).run(); // Re-layout the graph
}

/**
 * Sets the content and visibility of a feat section.
 * @param {string} displayText - The text to display.
 * @param {string} section - The section identifier (e.g., 'categories', 'description').
 */
function setFeatSection(displayText, section) {
  const htmlSection = document.getElementById(`feat-${section}-section`);
  const htmlText = document.getElementById(`feat-${section}`);
  if (displayText) {
    htmlText.textContent = displayText;
    if (section === 'prdLink') {
      htmlText.href = displayText;
      htmlText.style.display = 'block';
    }
    htmlSection.hidden = false;
  } else {
    htmlSection.hidden = true;
  }
}

/**
 * Displays information about a selected feat node.
 * @param {object} featNode - The Cytoscape node representing the feat.
 */
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
  setFeatSection(featData.prdLink, 'prdLink');
  document.getElementById('feat-info').classList.remove('d-none');
  featNode.neighborhood('edge').select(); // Highlight related edges
}

// Event listener for the search input field
document.getElementById('search').addEventListener("change", event => {
  searchFeats(event.target.value); // Perform search on input change
});

/**
 * Updates the graph and search functionality for a new locale.
 * @param {string} newLocale - The new locale code (e.g., 'en', 'de').
 */
async function updateGraphForLocale(newLocale) {
  console.log("Updating graph for locale:", newLocale);
  await initializeCy(newLocale); // Re-initialize Cytoscape with the new locale
}
