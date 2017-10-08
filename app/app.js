'use strict'

// web framework

import 'imports-loader?define=>false,exports=>false,this=>window!mustache/mustache'

import Plotly from 'plotly.js/dist/plotly.min.js'

// custom modules

import './app.sass'
import './index.pug'

// load resource data

import res from './res.json'

///////////////////////////////////////////////////////

// global variables

const app = {
  result_tmpl: document.querySelector('#results script').innerHTML,
  show_tids: {}
}
Mustache.parse(app.result_tmpl)

const plotResult = () => {
  let tids = Object.keys(app.show_tids)

  // plot results

  document.querySelector('#results').innerHTML = Mustache.render(app.result_tmpl, { tid: tids })

  let max_x = 0, max_y = 0

  for (let tid of tids) {
    max_x = Math.max(res[tid].stats.max_x, max_x)
    max_y = Math.max(res[tid].stats.max_y, max_y)
  }

  let trace_sequence = {
    hoverinfo: 'none',
    legendgroup: 'sequence_info',
    orientation: 'h',
    type: 'bar',
    xaxis: 'x2',
    yaxis: 'y2'
  }

  for (let tid of tids) {
    let trace_NM = {
      fill: 'tozeroy',
      fillcolor: '#86d993',
      mode: 'none',
      name: 'NM',
      type: 'scatter',
      x: res[tid].plot.x,
      y: res[tid].plot.y
    }

    let trace_5_prime_UTR = Object.assign({
      marker: { color: 'red', width: 1 },
      name: "5'UTR",
      x: [res[tid].sequence_info.coding_region.start]
    }, trace_sequence)

    let trace_coding_region = Object.assign({
      marker: { color: 'blue', width: 1 },
      name: "CDS",
      x: [res[tid].sequence_info.coding_region.end - res[tid].sequence_info.coding_region.start]
    }, trace_sequence)

    let trace_3_prime_UTR = Object.assign({
      marker: { color: 'yellow', width: 1 },
      name: "3'UTR",
      x: [res[tid].stats.max_x - res[tid].sequence_info.coding_region.end]
    }, trace_sequence)

    let layout = {
      barmode: 'stack',
      height: 180,
      margin: {
        b: 30,
        t: 30
      },
      title: `[${res[tid].sequence_info.gene_name}] ${tid}`,
      xaxis: {
        range: [1, max_x]
      },
      xaxis2: {
        anchor: 'y2',
        range: [1, max_x],
        tickmode: 'array',
        ticks: 'outside',
        tickvals: [res[tid].sequence_info.coding_region.start, res[tid].sequence_info.coding_region.end, res[tid].stats.max_x]
      },
      yaxis: {
        domain: [0.3, 1],
        range: [0, max_y],
        fixedrange: true
      },
      yaxis2: {
        domain: [0, 0.1],
        fixedrange: true,
        visible: false
      }
    }

    Plotly.newPlot(`plot_${tid}`, [trace_NM, trace_5_prime_UTR, trace_coding_region, trace_3_prime_UTR], layout)

    document.getElementById(`plot_${tid}`).on('plotly_relayout', zoom_data =>
      Plotly.update(`plot_${tid}`, {}, {
        xaxis2: {
          anchor: 'y2',
          range: [zoom_data['xaxis.range[0]'], zoom_data['xaxis.range[1]']],
          tickmode: 'array',
          ticks: 'outside',
          tickvals: [res[tid].sequence_info.coding_region.start, res[tid].sequence_info.coding_region.end, res[tid].stats.max_x]
        }
      })
    )
  }
}

///////////////////////////////////////////////////////

// control panel

document.querySelector('#setting').innerHTML = Mustache.render(document.querySelector('#setting script').innerHTML, { tid: Object.keys(res) })

Array.from(document.querySelectorAll('#setting label'), dom => dom.onclick = () => {
  if (app.show_tids[dom.dataset.tid])
    delete app.show_tids[dom.dataset.tid]
  else
    app.show_tids[dom.dataset.tid] = true

  plotResult()
})
