const cy = cytoscape({
  container: document.getElementById('cy'), // container to render in
  elements: fetch('data.json').then(res => res.json()),
  style: fetch('cy-style.json').then(res => res.json()),
  layout: { name: 'grid' },
  autoungrabify: true
})

function searchFeats(featName) {
  const feats = cy.nodes(`[name @*= '${featName}']`)
  const feat = feats.first()
  console.log(feat.predecessors().jsons(), feat.successors().jsons())
  const featNeighbors = feat.predecessors().union(feat.successors()).union(feat)
  cy.nodes().removeClass('visible')
  featNeighbors.nodes().addClass('visible')
  featNeighbors.layout({
    name: 'cola',
    rankDir: 'LR'
  }).run()
}

document.getElementById('search').addEventListener("change", event => {
  searchFeats(event.target.value)
})
