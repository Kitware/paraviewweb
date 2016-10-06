# MutualInformationDiagram

This is a visualization component that illustrates the relationships between pairs of variables.
It uses 1-d and 2-d histograms to compute and present

1. the amount of [mutual information][] (MI) between pairs of variables;
2. the [pointwise mutual information][] (PMI) between values of one variable and another; and
3. the approximate probability distribution of each variable (for reference).

The diagram consists of an annular region for each variable indicated by a field provider.
The angle of each annular region is proportional to the information of the corresponding variable.
For this reasion, variables that take on a single value are not included in the diagram – since
their entropy is 0.
The center of the diagram contains an illustration of either MI or PMI, depending on user interaction.

+ An outer circular region used to display 1-d histogram (approximate PDF) of each variable.
+ Inside the histogram are colored annular regions that serve as a legend.
  Each region has a text title (the variable name) and (if a LegendProvider is specified) a legend mark.
  These bars serve as both a legend and as buttons for choosing what is displayed inside the circle they bound.
+ Inside the legend are chords that connect one variable to another:
    + Initially, the chords show all pairwise connections between variables.
      Each variable also has an chord connecting to itself that illustrates the self-information, or entropy,
      of the variable.
      The widths of all chords are proportional to the mutual information between the variables they connect
      (across all values that either variable takes on).
    + When one of the legend marks is clicked, then only those chords associated with the corrsponding variable
      are displayed.
    + When an chord between a pair of variables is clicked, then the inner diagram
      switches to display chords between some bins of the 1-d histograms of the 2 variables.
      The bins for which chords are shown correspond to those with the highest
      absolute, finite values of PMI.
      When an chord is green, the bins it connects co-occur more frequently than statistical independence would suggest.
      When an chord is red, the bins it connects co-occur less frequently than statistical independence would suggest.
      Bins that co-occur exactly as often as statistical independence would suggest are the last to be chosen for display.
      Bins that never co-occur across the entire dataset (i.e., when values are mutually exclusive) are never connected by chords.
      Arcs with finite, absolute PMI values above the 95-th percentile are included in the display.
    + When a 1-d histogram bin in the outer ring is clicked, the inner diagram
      switches to display chords between that bin and some bins of all the other variables in the dataset.
      The bins for which chords are shown correspond to those with the highest absolute, finite values of PMI.
      Arcs with finite, absolute PMI values above the 80-th percentile are included in the display.
      This display is similar to the one above except that it illustrates only chords attached to
      one bin of one variable instead of chords between any pair of bins between 2 variables.

## Providers

The diagram requires the data model to be
+ a field provider,
+ 1-d histogram provider, and
+ a mutual information provider.
The mutual information provider in turn requires a data model that is a 2-d histogram provider.

The mutual information diagram behaves differently depending on the API provided by the data model.
If the data model is a

+ legend provider, the legend will include colored glyphs in each variable's arc;
+ histogram-bin hover provider, histogram bins (including other components sharing the same data model)
  will be highlighted as the cursor hovers as described in this document;
+ selection provider, then double-clicking as described above will cause the active selection to
  be changed to the relevant set of bins as described in the Interactions section.

## Interactions

The following is a list of ways users can interact with the diagram, including those mentioned above:

+ Hovering outside the inner circle will highlight the 1-d histogram bin intersecting the line between
  the cursor position and the center of the diagram.
  This only happens when the data model is a bin-hover provider.
+ When PMI chords are displayed,
    + Hovering inside the inner circle will highlight the histogram bin as mentioned above **plus**
      bins in the corresponding variable with high PMI relative to that bin.
      This only happens when the data model is a bin-hover provider.
      The other exception to this rule is the following:
    + When drawing PMI chords for a single bin in 1 variable (and the most-dependent bins
      in all other variables), hovering inside the inner circle but outside of any chords
      will highlight (in yellow) all of the chords associated with the variable containing
      the cursor as well as highlighting (in blue) the 1-d histogram bins in the outer ring.
+ Clicking on a MI chord will display PMI chords between the 2 corresponding variables.
+ Clicking on a 1-d histogram bin will display PMI chords between that bin and bins of other variables.
  Double-clicking will turn the histogram bin into a range selection (if the data model is a selection provider).
+ Clicking on the legend will switch the inner circle to display MI chords or – if displaying
  MI chords – will toggle between showing all chords and just the chords for the legend's variable.
+ Double-clicking on a highlighted PMI chord will turn the corresponding bins (in both variables) into
  a bivariate range selection (if the data model is a selection provider).

[mutual information]: http://en.wikipedia.org/wiki/Mutual_information
[pointwise mutual information]: http://en.wikipedia.org/wiki/Pointwise_mutual_information
