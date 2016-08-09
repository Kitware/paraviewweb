// -----------------------------------------------------------------------------------
// -- Private utility methods for dealing with joint (2d) probability distributions --
// -----------------------------------------------------------------------------------

export function constantMatrix(ii, jj, entry) {
  const arr = [];
  for (let i = 0; i < ii; ++i) {
    arr.push([]);
    for (let j = 0; j < jj; ++j) {
      arr[i].push(null);
    }
  }
  return arr;
}

export function zeros(ii, jj) {
  return constantMatrix(ii, jj, 0);
}

export function downsample(src, nn, swap) {
  var hsz = src ? src.length : 0;
  var arr;
  if (hsz === 0) {
    return [];
  }

  if (nn < 1) {
    return [];
  }

  // assert(hsz === src[0].length);
  let tn = 1;
  while (tn < nn && tn < hsz) { tn *= 2; }

  const stride = hsz / tn;

  if (stride === 1 && !swap) {
    arr = src;
  } else {
    arr = zeros(tn, tn);
    for (let i = 0; i < hsz; ++i) {
      for (let j = 0; j < hsz; ++j) {
        arr[Math.floor(i / stride)][Math.floor(j / stride)] += src[i][j];
      }
    }
  }

  if (swap) {
    for (let i = 0; i < tn; ++i) {
      for (let j = i + 1; j < tn; ++j) {
        const tmp = arr[i][j];
        arr[i][j] = arr[j][i];
        arr[j][i] = tmp;
      }
    }
  }

  return arr;
}

export function freqToProb(src) {
  var hsz = src ? src.length : 0;
  if (hsz === 0) {
    return [];
  }

  // assert(hsz === src[0].length);

  let total = 0;
  for (let i = 0; i < hsz; ++i) {
    for (let j = 0; j < hsz; ++j) {
      total += src[i][j];
    }
  }
  const pAB = zeros(hsz, hsz);
  const pA = zeros(hsz, 1);
  const pB = zeros(1, hsz);
  const pmi = constantMatrix(hsz, hsz, null);
  for (let i = 0; i < hsz; ++i) {
    for (let j = 0; j < hsz; ++j) {
      const p = src[i][j] / total;
      pAB[i][j] = p;
      pA[i][0] += p;
      pB[0][j] += p;
    }
  }

  for (let i = 0; i < hsz; ++i) {
    for (let j = 0; j < hsz; ++j) {
      const pj = pAB[i][j];
      if (pj > 0) {
        pmi[i][j] = -1 * Math.log(pj / pA[i][0] / pB[0][j]) / Math.log(pj);
      }
    }
  }

  return { pAB, pA, pB, cardinality: total, pmi };
}

export function flattenMatrix(x) {
  return x.reduce((a, b) => a.concat(b));
}

export function quantile(xx, qq) {
  var xs = flattenMatrix(xx).sort((a, b) => a - b);
  return (xs[Math.floor(xs.length * qq)] + xs[Math.ceil(xs.length * qq)]) / 2;
}

export function matrixFind(xx, condition) {
  if (!xx || xx.length < 1) {
    return [];
  }

  const nn = xx[0].length;

  const xf = flattenMatrix(xx)
    .reduce((a, b, i) => (condition(b, i) ? a.concat([[Math.floor(i / nn), i % nn]]) : a),
    []);
  return xf;
}

export function matrixSubset(mat, isRow, idx) {
  if (isRow) {
    return [mat[idx]]; // return a "new" matrix that has only one row.
  }
  return mat.map(row => [row[idx]]);
}

export function matrixChoose(xx, idxs) {
  return idxs.reduce((a, b) => a.concat(xx[b[0]][b[1]]), []);
}

export function topProb(dd, qq) {
  var qval = quantile(dd.pAB, qq);
  var idxs = matrixFind(dd.pAB, d => d > qval);
  return {
    pAB: matrixChoose(dd.pAB, idxs),
    pmi: matrixChoose(dd.pmi, idxs),
    idx: idxs,
  };
}

export function topPmi(dd, qq) {
  var apmi = dd.pmi.map(row => row.map(v => Math.abs(v)));
  var qval = quantile(apmi, qq);
  var idxs = matrixFind(apmi, d => d > qval);
  return {
    pAB: matrixChoose(dd.pAB, idxs),
    pmi: matrixChoose(dd.pmi, idxs),
    idx: idxs,
  };
}

// Return the bins most probably linked to the given bin (above the \a qq quantile line of probability).
export function topBinProb(dd, isA, bin, qq) {
  var subset = matrixSubset(dd.pAB, !isA, bin);
  var qval = quantile(subset, qq);
  var idxs = matrixFind(subset, d => d > qval);

  console.log(
    'binprob, isA:', isA,
    ' bin:', bin,
    ' idxs:', idxs,
    ' midx: ', idxs.map(d => (!isA ? [bin, d[1]] : [bin, d[0]])),
    ' subset: ', subset
  );

  return {
    pAB: matrixChoose(subset, idxs),
    pmi: matrixChoose(matrixSubset(dd.pmi, !isA, bin), idxs),
    idx: idxs.map(d => (!isA ? [bin, d[1]] : [bin, d[0]])),
  };
}

export function topBinPmi(dd, isA, bin, qq) {
  var subset = matrixSubset(dd.pmi, !isA, bin);
  var apmi = subset.map(row => row.map(v => Math.abs(v)));
  var qval = quantile(apmi, qq);
  var idxs = matrixFind(apmi, d => d > qval);

  return {
    pAB: matrixChoose(matrixSubset(dd.pAB, !isA, bin), idxs),
    pmi: matrixChoose(subset, idxs),
    idx: idxs.map(d => (!isA ? [bin, d[1]] : [bin, d[0]])),
  };
}

export function calculateAngleAndRadius(coords, containerDims) {
  const width = containerDims[0];
  const height = containerDims[1];
  const x = coords[0] - (width / 2);
  const y = (height - coords[1]) - (height / 2);
  // Need straight up in screen space to have angle 0, adjust atan2 args accordingly
  let arctangent = -Math.atan2(-x, y);
  if (arctangent < 0) {
    arctangent = Math.PI + (Math.PI + arctangent);
  }
  return [arctangent, Math.sqrt((x * x) + (y * y))];
}

export default {
  calculateAngleAndRadius,
  constantMatrix,
  downsample,
  flattenMatrix,
  freqToProb,
  matrixChoose,
  matrixFind,
  matrixSubset,
  quantile,
  topBinPmi,
  topBinProb,
  topPmi,
  topProb,
  zeros,
};
