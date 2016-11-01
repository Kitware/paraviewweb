pointsApproxCollinear([0.0, 1e-6], [1, 1], [-1, -1.0000001], 1e-4) === true
pointsApproxCollinear([0.0, 1e-6], [1, 1], [-1, -1.0000001], 1e-6) === false
pointsApproxCollinear([0.0, 1e-6], [1, 1], [-1, -1.0000001], 1e-5) === true

lineLineIntersectFlimsy([-1, -1], [1,1], [-1, 0.5], [1,0]) === [  0.5, 0.5 ]
lineLineIntersectFlimsy([-1,  0], [1,1], [-1, 0.5], [1,0]) === [ -0.5, 0.5 ]

lineCircleIntersectFlimsy([ 0, 0.5], [1,  1],    [0, 0], 1) === [[0.4114378277661476,  0.9114378277661477 ],    [ -0.9114378277661475, -0.4114378277661475 ]]
lineCircleIntersectFlimsy([-1, 0.5], [1,  0],    [0, 0], 1) === [[0.8660254037844386,  0.5 ],                   [ -0.8660254037844386,  0.5                ]]
lineCircleIntersectFlimsy([-1,  -1], [1,  0.5],  [0, 0], 1) === [[0.9999999999999999, -5.551115123125783e-17 ], [ -0.6,                -0.8                ]]
lineCircleIntersectFlimsy([-1,  -1], [1,  0],    [0, 0], 1) === [[0,                  -1 ],                     [  0,                  -1                  ]]
lineCircleIntersectFlimsy([-1,  -1], [1,  0.05], [0, 0], 1) === [[0.3628207142312596, -0.9318589642884371 ],    [ -0.2680576219619333, -0.9634028810980967 ]]
lineCircleIntersectFlimsy([-1,  -1], [1, -0.05], [0, 0], 1) === [ null, null ]
