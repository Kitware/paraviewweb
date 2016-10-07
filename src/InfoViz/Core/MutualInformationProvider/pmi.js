/* global Array */
/* eslint-disable no-continue */
/* eslint-disable prefer-spread */

// Generate a matrix of numbers (an array of arrays) with the given size and initial value.
function filledMatrix(nrow, ncol, val) {
  const mm = Array.apply(null, Array(nrow)).map(
    o => Array.apply(null, Array(ncol)).map(
      Number.prototype.valueOf, val));
  return mm;
}

// Return a new matrix that is a copy of \a mtx with row \a irow removed.
// function rowRemoved(mtx, irow) {
//   const res = mtx.filter((o, i) => i !== irow);
//   return res;
// }

function removeRow(mtx, irow) {
  mtx.splice(irow, 1);
}

// Eliminate a column from a matrix.
// function colRemoved(mtx, icol) {
//   const res = mtx.map(o => o.filter((p, j) => j !== icol));
//   return res;
// }

function removeCol(mtx, icol) {
  mtx.forEach(o => o.splice(icol, 1));
}

// Eliminate a row and column from a matrix.
function removeRowAndCol(mtx, irow, icol) {
  removeRow(mtx, irow);
  removeCol(mtx, icol);
}

// Insert a new row and column into a matrix, filling new entries with \a val.
function insertRowAndCol(mtx, irow, icol, val) {
  const nv = mtx.length + 1;
  mtx.forEach(row => row.splice(icol, 0, val));
  mtx.splice(irow, 0,
    Array.apply(null, Array(nv)).map(
      Number.prototype.valueOf, val));
}

function initializeMutualInformationData() {
  return {
    matrix: [],
    vmap: {},
    vset: {},
    joint: {},
  };
}

function removeVariable(miData, variable) {
  if (!(variable in miData.vset)) {
    return false;
  }
  const ii = miData.vset[variable];
  const nv = miData.matrix.length;
  removeRowAndCol(miData.matrix, ii, ii);
  delete miData.vset[variable];
  for (let jj = ii + 1; jj < nv; ++jj) {
    const vname = miData.vmap[jj].name;
    miData.vmap[jj - 1] = miData.vmap[jj];
    miData.vset[vname] = jj - 1;
  }
  delete miData.vmap[nv - 1];
  return true;
}

function insertVariableAt(miData, variable, ii) {
  const nv = miData.matrix.length;
  if (nv > 0) {
    // Found where to insert. Update vmap and vset:
    for (let jj = nv; jj > ii; --jj) {
      miData.vmap[jj] = miData.vmap[jj - 1];
      const vname = miData.vmap[jj - 1].name;
      miData.vset[vname] += 1;
    }
  }
  miData.vmap[ii] = { name: variable };
  miData.vset[variable] = ii;
  // Now insert a row and column into the MI matrix:
  insertRowAndCol(miData.matrix, ii, ii, 0);
}

function insertVariable(miData, variable) {
  if (variable in miData.vset) {
    return -1;
  }
  let ii = 0;
  const nv = miData.matrix.length;
  // TODO: We could do a bisection search instead of this loop:
  for (; ii < nv; ++ii) {
    if (miData.vmap[ii].name > variable) {
      insertVariableAt(miData, variable, ii);
      return ii;
    }
  }
  insertVariableAt(miData, variable, nv);
  return nv;
}

function mutualInformationPair(miData, indices, histdata) {
  let totCount = 0;
  const rx = histdata.x.extent;
  const dx = histdata.x.delta;
  const ry = histdata.y.extent;
  const dy = histdata.y.delta;
  const inbins = Math.round((rx[1] - rx[0]) / dx);
  const jnbins = Math.round((ry[1] - ry[0]) / dy);
  const xMarginFreq = [];
  const yMarginFreq = [];
  for (let ii = 0; ii < inbins; ++ii) {
    xMarginFreq[ii] = 0;
  }
  for (let jj = 0; jj < jnbins; ++jj) {
    yMarginFreq[jj] = 0;
  }
  for (let ib = 0; ib < histdata.bins.length; ++ib) {
    const bb = histdata.bins[ib];
    const ix = Math.round((bb.x - rx[0]) / dx);
    const iy = Math.round((bb.y - ry[0]) / dy);
    xMarginFreq[ix] += bb.count;
    yMarginFreq[iy] += bb.count;
    totCount += bb.count;
  }
  let minfo = 0;
  const jointFreq = filledMatrix(inbins, jnbins, 0);
  for (let ib = 0; ib < histdata.bins.length; ++ib) {
    const bb = histdata.bins[ib];
    const ix = Math.round((bb.x - rx[0]) / dx);
    const iy = Math.round((bb.y - ry[0]) / dy);
    const pxy = bb.count / totCount;
    const px = xMarginFreq[ix] / totCount;
    const py = yMarginFreq[iy] / totCount;
    const pmiXy = Math.log(pxy / px / py);
    jointFreq[ix][iy] = bb.count;
    minfo += pxy * pmiXy;
  }
  return {
    mutual_information: minfo,
    joint: jointFreq,
  };
}

function updateMutualInformation(miData, variablesAddedOrUpdated, variablesRemoved, histogramData) {
  // console.log('Upd MI ', variablesAddedOrUpdated, 'remove', variablesRemoved);
  variablesAddedOrUpdated.forEach(vname => insertVariable(miData, vname));
  variablesRemoved.forEach(vname => removeVariable(miData, vname));
  // Now that all the miData maps have been updated, we can recompute only the
  // entries for pairs whose variables have been updated.
  const alreadyDone = {}; // keep track of which entries have already been processed
  const nv = miData.matrix.length;
  variablesAddedOrUpdated.forEach((vname) => {
    const vidx = miData.vset[vname];
    if (vidx === undefined) {
      return;
    }
    // console.log('Refreshing ', vname, vidx);
    for (let v2dx = 0; v2dx < nv; ++v2dx) {
      // tup always has the smaller index first so we don't redo symmetric entries:
      const tup = v2dx < vidx ? [v2dx, vidx] : [vidx, v2dx];
      if (tup[0] in alreadyDone && tup[1] in alreadyDone[tup[0]]) {
        continue;
      }
      // FIXME: commented line below to make linter happy, but missing v2nam could be a bug. console.log use only, perhaps?
      // const v2nam = miData.vmap[v2dx].name;
      const t0nam = miData.vmap[tup[0]].name;
      const t1nam = miData.vmap[tup[1]].name;
      // console.log('    Recompute ', tup, ' where ', v2dx, ' = ', v2nam, ' tupnames ', t0nam, t1nam);

      if (!histogramData[t0nam]) {
        // Data not ready yet for given axis
        console.log('Can not compute PMI for', t0nam);
        continue;
      }

      if (!histogramData[t0nam][t1nam]) {
        // Data not ready yet for given axis
        console.log('Can not compute PMI for', t1nam);
        continue;
      }

      const minfo = mutualInformationPair(miData, tup, histogramData[t0nam][t1nam]);
      miData.matrix[tup[0]][tup[1]] = minfo.mutual_information;
      miData.matrix[tup[1]][tup[0]] = minfo.mutual_information;
      if (!(t0nam in miData.joint)) {
        miData.joint[t0nam] = {};
        miData.joint[t0nam][t1nam] = {};
      } else if (!(t1nam in miData.joint[t0nam])) {
        miData.joint[t0nam][t1nam] = {};
      }
      miData.joint[t0nam][t1nam] = minfo.joint;
      // miData.joint[t1nam][t0nam] = transposed(minfo.pmi);

      if (!(tup[0] in alreadyDone)) {
        alreadyDone[tup[0]] = {};
      }
      alreadyDone[tup[0]][tup[1]] = true;
    }
  });
}

export default {
  updateMutualInformation,
  initializeMutualInformationData,
};

// ----------------------------------------------------------------------------
// Usage
// ----------------------------------------------------------------------------
// histogramData = {};
// miData = initializeMutualInformationData();
// updateMutualInformation(miData, ['a', 'b', 'd', 'c'], ['b'], histogramData);
// updateMutualInformation(miData, ['b'], [], histogramData);
// updateMutualInformation(miData, ['c'], [], histogramData);
