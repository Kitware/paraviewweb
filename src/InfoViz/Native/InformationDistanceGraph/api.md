# Information distance

This is a component to display variables in a graph
such that related variables are near each other and
unrelated variables are far away.

The information distance component takes a set of
variables (via a FieldProvider), retrieves mutual
information (via a MutualInformationProvider), and generates
a graph of variables, where the distance between nodes is
proportional to the normalized "variation of information."
Variation of information is a distance metric based on mutual
information and joint entropy, since mutual information
is not a metric:

    VofI(a,b) = H(a,b) - MI(a,b)

The normalized distance (between 0 and 1) is:

    d(a,b) = 1 - MI(a,b) / H(a,b) = VofI(a,b) / H(a,b)

which is similar to [Jaccard distance]().

A slider at the top of the component (which cannot currently be
manipulated except via the keyboard) controls which portions of the
distance matrix are overwritten with large values, allowing the graph
to relax into a shape more indicative of the strongest relationships.

[Jaccard distance]: https://en.wikipedia.org/wiki/Jaccard_index

## Issues

1. Should the graph alone be its own component?
   The prototype included the graph plus a search bar and a 1-d histogram
   (to show whatever node you click on in the graph (or select via the search bar).
   I am leaning toward yes, but it complicates things if we want a separate
   search bar to highlight matching variables in the graph without "selecting" them
   (which would modify parallel coordinates plots and other components paying
   attention to selected variables in the FieldProvider).

2. Does anyone have preferences for the graph layout algorithm?
   CoLa (which is used under the hood) is quite fancy but the component just uses
   a simple force-directed layout without constraints (beyond target edge length)
   right now. We could

    a. Collapse similar variables and let users expand them like
       [this demo](http://marvl.infotech.monash.edu/webcola/examples/browsemovies.html).
       This would require some analysis and, in order to be effective, we
       would need to test on datasets with lots of variables that are not all
       trivially related.
    b. Do a gridded layout with only horizontal/vertical edges,
       [like so](http://marvl.infotech.monash.edu/webcola/examples/dotpowergraph.html).
    c. Build a power-graph layout (where subgraphs that are fully-connected
       are drawn as groups with no internal edges to avoid clutter),
       [like so](http://marvl.infotech.monash.edu/webcola/examples/powergraph.html).
       The analysis for this is part of CoLa.

3. Should we save the positions of graph nodes as state (so that you get the same
   layout as before unless you change the number of edges to keep with the slider)?

4. Interaction is tricky as there are several things that compete for gestures:
   zooming, panning, graph editing (node-dragging), indicating contect (i.e.,
   obtaining details about one node in the graph) and selection (i.e., adding
   or removing a variable from the active set).

   How should resizes be handled? Should the lengths be scaled so the graph always
   fits inside the tile? If so, how do we deal with a changing layout (and thus
   changing aspect-ratio and scale)? What if the current layout is a bad match for
   the aspect ratio of the tile?

   If we allow scrolling, how do we switch between panning, zooming, and graph
   editing.

5. Should we have a "focus node" that is pinned to the center of the tile?

6. Should we show "objective function" variables?

7. Should we have a "show only selected" button to illustrate relationships between
   a smaller (and probably more manageable) set of variables?
