# Field Relation Diagram

This component can be configured to render Taylor diagrams or Correa-Lindstrom Scaled Mutual Information (SMI) diagrams.
Taylor diagrams are polar plots showing scaled standard deviation on the radial _r_ axis
and the arc-cosine of the Pearson correlation coefficient on the _θ_ axis.
SMI diagrams are polar plots showing entropy on the radial _r_ axis
and the arc-cosine of the scaled mutual information on the _θ_ axis.

Because the arc-cosine has a range of [0,π], the diagrams are semi-circular and thus have a 2:1 aspect ratio.

## setDiagramType

Passing either "`Taylor`" or "`SMI`" will change the diagram to
show linear correlations or non-linear mutual information, respectively.
