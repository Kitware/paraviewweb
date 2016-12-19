export const vectorMag = vec => Math.sqrt(vec.reduce((a, b) => (a + (b * b)), 0));
export const vectorDiff = (aa, bb) => [0, 1].map(ii => bb[ii] - aa[ii]);
export const vectorMAdd = (aa, bb, xx) => [0, 1].map(ii => aa[ii] + (xx * bb[ii]));
export const vectorDot = (aa, bb) => [0, 1].map(ii => aa[ii] * bb[ii]).reduce((pp, qq) => pp + qq, 0);
export const vectorScale = (xx, aa) => aa.map(tt => xx * tt);

/** \brief Map points from the unbounded hyperbolic plane to the unit Poincaré disk.
  *
  * The points are translated so that the \a focus point (a length-2 array) is the origin of the disk.
  * The input points, \a xh, should be an array of points (with each point a length-2 array).
  *
  * Note that points outside a [-20,20] x [-20, 20] bounding box get mapped
  * to the boundary of the disk to within double-precision due to the exponential
  * operations involved.
  */
export function hyperbolicPlanePointsToPoincareDisk(xh, focus, scale) {
  // Translate all the points in xh to the focal point:
  const tx = xh.map(pt => pt.map((coord, ii) => (coord - focus[ii]) / scale));
  // Convert from cartesian coordinates to a radius and scale it to the disk:
  const rho = tx.map(pt => Math.sqrt((pt[0] * pt[0]) + (pt[1] * pt[1])));
  const rr = rho.map(rhoii => (rhoii < 1e-8 ? 0.0 : Math.tanh(rhoii / 2.0)));
  // Use similar triangles to map the translated points to the unit disk:
  const xd = rr.map((rrii, ii) => (rho[ii] < 1e-8 ? [0.0, 0.0] : tx[ii].map(txii => rrii * txii / rho[ii])));
  return xd.map((dd, ii) => ({ idx: ii, x: dd }));;
}

/** \brief Return true if the 3 input points are approximately (within \a tol) collinear.
  *
  * Each point \a p0, \a p1, \a p2 should be a length-2 array of coordinates.
  */
function pointsApproxCollinear(p0, p1, p2, tol) {
  // When the cross product is nearly zero (within tol), then the points are collinear.
  // This also handles the case where a pair of points are coincident.
  const ii = [0, 1];
  const e01 = ii.map(idx => p1[idx] - p0[idx]);
  const e02 = ii.map(idx => p2[idx] - p0[idx]);
  return Math.abs((e01[0] * e02[1]) - (e01[1] * e02[0])) < tol;
}

/** \brief Intersect 2 parametric lines in 2D, non-robustly (i.e., the lines are in general position).
  *
  * The intersection point is returned.
  *
  * \a p0 - a point on the first line
  * \a d0 - the direction vector for the first line
  * \a p1 - a point on the second line
  * \a d1 - the direction vector for the second line
  */
function lineLineIntersectFragile(p0, d0, p1, d1) {
  const b = [0, 1].map(ii => p1[ii] - p0[ii]);
  const denom = (d0[1] * d1[0]) - (d0[0] * d1[1]);
  const tnum = (b[1] * d1[0]) - (b[0] * d1[0]);
  const t = tnum / denom;
  const ipt = [0, 1].map(ii => p0[ii] + (d0[ii] * t));
  return ipt;
}

/** \brief Intersect a parametric line with a circle in 2D, non-robustly (i.e., general position).
  *
  * The line is assumed to intersect the circle in exactly 2 places.
  * The 2 intersection points are returned.
  *
  * \a pp - a point on the line
  * \a dd - the direction vector for the line
  * \a cc - the center point of the circle
  * \a rr - the radius of the circle
  */
function lineCircleIntersectFragile(pp, dd, cc, rr) {
  const dmag = vectorMag(dd);
  const dh = dd.map(a => a / dmag); // unit-length version of dd
  const cpd = vectorDot(dh, vectorDiff(pp, cc));
  const ee = vectorMAdd(pp, dh, cpd);
  const ec = vectorDiff(cc, ee);
  const emag = vectorMag(ec);
  if (emag > rr) {
    return [null, null];
  }
  const ddist = Math.sqrt((rr * rr) - (emag * emag));
  return [vectorMAdd(ec, dh, -ddist), vectorMAdd(ec, dh, ddist)];
}

/** \brief Compute the path of a geodesic between \a p0 and \a p1 projected to the unit Poincaré disk centered at \a focus.
  *
  * Geodesics in hyperbolic space are arcs of varying radius on the Poincaré disk.
  * The arcs are always portions of a circle orthogonal to the Poincaré disk,
  * however the radius is infinite in some cases (when a geodesic passes through
  * the center of the disk).
  *
  * This function returns an SVG path between each corresponding entry of p0 and p1.
  * The path will either be SVG's [arc]() command or a [lineto]() command.
  *
  * [arc]:  https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
  * [line]: https://www.w3.org/TR/SVG/paths.html#PathDataLinetoCommands
  */
export function hyperbolicPlaneGeodesicOnPoincareDisk(p0, p1, focus, scale) {
  // zip from http://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function:
  function zip(arrays) {
    return arrays[0].map((_, i) => arrays.map(array => array[i]));
  }
  // Translate all the points in xh to the focal point:
  const tx0 = p0.map(pt => pt.map((coord, ii) => (coord - focus[ii]) / scale));
  const tx1 = p1.map(pt => pt.map((coord, ii) => (coord - focus[ii]) / scale));
  const pts = zip([tx0, tx1]);
  const paths = pts.map((ppr, idx) => {
    const rho = [0, 0];
    const rr = [0, 0];
    const xd = [null, null];
    const bdy = [false, false]; // Does endpoint i lie on the disk boundary?
    for (let ii = 0; ii < 2; ++ii) {
      rho[ii] = Math.sqrt((ppr[ii][0] * ppr[ii][0]) + (ppr[ii][1] * ppr[ii][1]));
      if (rho[ii] < 1e-8) {
        rr[ii] = 0.0;
        xd[ii] = [0, 0];
      } else {
        rr[ii] = Math.tanh(rho[0] / 2.0);
        xd[ii] = ppr[ii].map(ptii => rr[ii] * ptii / rho[ii]);
        bdy[ii] = rr[ii] === 1.0;
      }
    }
    // Now construct orthogonal circular arc intersecting xd[0] && xd[1]:
    let pathCmd = `M ${xd[0][0]},${xd[0][1]}`;
    if (pointsApproxCollinear(xd[0], xd[1], [0.0, 0.0], 1e-8)) {
      // Case where the arc has infinite radius (i.e., a line):
      pathCmd = `${pathCmd} L ${xd[1][0]},${xd[1][1]}`;
    } else {
      let center = [0.0, 0.0]; // Center of circle forming geodesic between xd[0] & xd[1].
      if (bdy[0] && bdy[1]) {
        // Case where both points on disk boundary. Intersect tangents to get center.
        center = lineLineIntersectFragile(xd[0], [xd[0][1], -xd[0][0]], xd[1], [xd[1][1], -xd[1][0]]);
      } else {
        // At least one point is interior. Use it to obtain third point, then center from chord bisectors.
        let iptidx = null;
        if (!bdy[0]) { // xd[0] is interior
          iptidx = 0;
        } else { // xd[1] is interior
          iptidx = 1;
        }
        const ipt = xd[iptidx];
        // Find points on unit disc intersected by a line at ipt perpendicular to the line from [0,0] to ipt:
        // const imag = Math.sqrt(ipt[0]*ipt[0] + ipt[1]*ipt[1]);
        const cpts = lineCircleIntersectFragile(ipt, [ipt[1], -ipt[0]], [0, 0], 1.0);
        // The intersection of the tangent lines at the 2 cpts is a third point on the circle
        const p3 = lineLineIntersectFragile(cpts[0], [cpts[0][1], -cpts[0][0]], cpts[1], [cpts[1][1], -cpts[1][0]]);
        // Bisectors of circle chords intersect at the circle center.
        let bisectLeg1 = null;
        let bisectLeg2 = null;
        let bisectCtr1 = null;
        let bisectCtr2 = null;
        if (iptidx === 0) {
          // points can be ordered along arc p3, xd[0], xd[1]
          bisectLeg1 = [0, 1].map(ii => p3[ii] - xd[0][ii]);
          bisectLeg2 = [0, 1].map(ii => xd[0][ii] - xd[1][ii]);
          bisectCtr1 = [0, 1].map(ii => xd[0][ii] + (0.5 * bisectLeg1[ii]));
          bisectCtr2 = [0, 1].map(ii => xd[1][ii] + (0.5 * bisectLeg2[ii]));
        } else {
          // points can be ordered along arc: p3, xd[1], xd[0]
          bisectLeg1 = [0, 1].map(ii => p3[ii] - xd[1][ii]);
          bisectLeg2 = [0, 1].map(ii => xd[1][ii] - xd[0][ii]);
          bisectCtr1 = [0, 1].map(ii => xd[1][ii] + (0.5 * bisectLeg1[ii]));
          bisectCtr2 = [0, 1].map(ii => xd[0][ii] + (0.5 * bisectLeg2[ii]));
        }
        center = lineLineIntersectFragile(
          bisectCtr1, [bisectLeg1[1], -bisectLeg1[0]],
          bisectCtr2, [bisectLeg2[1], -bisectLeg2[0]]);
      }
      // Arc radius is distance from center to either xd[i] point.
      const dx = xd[0][0] - center[0];
      const dy = xd[0][1] - center[1];
      const ar = Math.sqrt((dx * dx) + (dy * dy));
      pathCmd = `${pathCmd} A ${ar},${ar} 0 0,1 ${xd[1][0]},${xd[1][1]}`;
    }
    return { idx, path: pathCmd };
  });
  return paths;
}

/** \brief Compute the Poincaré disk coordinates of points along geodesics between pairs of hyperbolic plane coordinates.
  *
  * \a p0 and \a p1 are each expected to be an array of length-2 arrays (i.e., arrays of points).
  * \a t must be an array of numbers between 0 and 1, inclusive.
  * \a p0, \a p1, and \a t should have the same length; array entries in each correspond to each other.
  * \a focus is a single length-2 array specifying the pre-image of the origin of the Poincaré disk in the hyperbolic plane.
  *
  * Each entry of \a p0, \a p1, and \a t specify a pair of hyperbolic-plane coordinates and a fraction of the
  * distance along the geodesic connecting them (\a t). The output is an array of length-2 arrays holding
  * points inside the unit-radius Poincaré disk.
  */
export function interpolateOnPoincareDisk(p0, p1, t, focus, scale) {
  // zip from http://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function:
  function zip(arrays) {
    return arrays[0].map((_, i) => arrays.map(array => array[i]));
  }
  // Translate all the points in xh to the focal point:
  const tx0 = p0.map(pt => pt.map((coord, ii) => (coord - focus[ii]) / scale));
  const tx1 = p1.map(pt => pt.map((coord, ii) => (coord - focus[ii]) / scale));
  const pts = zip([tx0, tx1, t]);
  const pout = pts.map((ppr) => {
    const rho = [0, 0];
    const rr = [0, 0];
    const xd = [null, null];
    const bdy = [false, false]; // Does endpoint i lie on the disk boundary?
    for (let ii = 0; ii < 2; ++ii) {
      rho[ii] = Math.sqrt((ppr[ii][0] * ppr[ii][0]) + (ppr[ii][1] * ppr[ii][1]));
      if (rho[ii] < 1e-8) {
        rr[ii] = 0.0;
        xd[ii] = [0, 0];
      } else {
        rr[ii] = Math.tanh(rho[0] / 2.0);
        xd[ii] = ppr[ii].map(ptii => rr[ii] * ptii / rho[ii]);
        bdy[ii] = rr[ii] === 1.0;
      }
    }
    // Now construct orthogonal circular arc intersecting xd[0] && xd[1]:
    let interp = xd[0];
    if (pointsApproxCollinear(xd[0], xd[1], [0.0, 0.0], 1e-8)) {
      // Case where the arc has infinite radius (i.e., a line):
      interp = vectorMAdd(interp, vectorDiff(xd[1], xd[0], ppr[2]));
    } else {
      let center = [0.0, 0.0]; // Center of circle forming geodesic between xd[0] & xd[1].
      if (bdy[0] && bdy[1]) {
        // Case where both points on disk boundary. Intersect tangents to get center.
        center = lineLineIntersectFragile(xd[0], [xd[0][1], -xd[0][0]], xd[1], [xd[1][1], -xd[1][0]]);
      } else {
        // At least one point is interior. Use it to obtain third point, then center from chord bisectors.
        let iptidx = null;
        if (!bdy[0]) { // xd[0] is interior
          iptidx = 0;
        } else { // xd[1] is interior
          iptidx = 1;
        }
        const ipt = xd[iptidx];
        // Find points on unit disc intersected by a line at ipt perpendicular to the line from [0,0] to ipt:
        // const imag = Math.sqrt(ipt[0]*ipt[0] + ipt[1]*ipt[1]);
        const cpts = lineCircleIntersectFragile(ipt, [ipt[1], -ipt[0]], [0, 0], 1.0);
        // The intersection of the tangent lines at the 2 cpts is a third point on the circle
        const p3 = lineLineIntersectFragile(cpts[0], [cpts[0][1], -cpts[0][0]], cpts[1], [cpts[1][1], -cpts[1][0]]);
        // Bisectors of circle chords intersect at the circle center.
        let bisectLeg1 = null;
        let bisectLeg2 = null;
        let bisectCtr1 = null;
        let bisectCtr2 = null;
        if (iptidx === 0) {
          // points can be ordered along arc p3, xd[0], xd[1]
          bisectLeg1 = [0, 1].map(ii => p3[ii] - xd[0][ii]);
          bisectLeg2 = [0, 1].map(ii => xd[0][ii] - xd[1][ii]);
          bisectCtr1 = [0, 1].map(ii => xd[0][ii] + (0.5 * bisectLeg1[ii]));
          bisectCtr2 = [0, 1].map(ii => xd[1][ii] + (0.5 * bisectLeg2[ii]));
        } else {
          // points can be ordered along arc: p3, xd[1], xd[0]
          bisectLeg1 = [0, 1].map(ii => p3[ii] - xd[1][ii]);
          bisectLeg2 = [0, 1].map(ii => xd[1][ii] - xd[0][ii]);
          bisectCtr1 = [0, 1].map(ii => xd[1][ii] + (0.5 * bisectLeg1[ii]));
          bisectCtr2 = [0, 1].map(ii => xd[0][ii] + (0.5 * bisectLeg2[ii]));
        }
        center = lineLineIntersectFragile(
          bisectCtr1, [bisectLeg1[1], -bisectLeg1[0]],
          bisectCtr2, [bisectLeg2[1], -bisectLeg2[0]]);
      }
      // Arc radius is distance from center to either xd[i] point.
      const dx = xd[0][0] - center[0];
      const dy = xd[0][1] - center[1];
      const ar = Math.sqrt((dx * dx) + (dy * dy)); // the radius of the geodesic from xd[0] to xd[1].
      const ch = vectorDiff(xd[0], xd[1]); // the chord vector from xd[0] to xd[1].
      const cl = Math.sqrt(vectorDot(ch, ch)); // length of chord cut by xd[0] and xd[1]
      const th = 2.0 * Math.asin(cl / 2.0 / ar) * ppr[2]; // Angle to rotate xd[0] to get interpolated point.
      const co = Math.cos(th);
      const sn = Math.sin(th);
      const rt = [(dx * co) - (dy * sn), (dx * sn) + (dy * co)]; // rotate [dx,dy] by th(eta)
      interp = vectorMAdd(center, rt, 1.0); // Add center back to rotated xd to get interpolated point.
    }
    return interp;
  });
  return pout;
}

console.log(hyperbolicPlaneGeodesicOnPoincareDisk(
  [[-0.5, -0.5], [-0.5, -0.5], [0, 0], [-0.5, 0]],
  [[0.5, -0.5], [0.5, 0], [0.3, 0.2], [-0.5, 0.25]],
  [0, 0], 1.0));

export default {
  vectorMag,
  vectorDiff,
  vectorMAdd,
  vectorDot,
  vectorScale,
  pointsApproxCollinear,
  lineLineIntersectFragile,
  lineCircleIntersectFragile,
  hyperbolicPlanePointsToPoincareDisk,
  hyperbolicPlaneGeodesicOnPoincareDisk,
  interpolateOnPoincareDisk,
};
