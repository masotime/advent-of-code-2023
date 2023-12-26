Amusingly GraphViz automatically generates diagrams by separating out subgraphs as much as possible.

One look and you can see where the three connecting links are, in both the sample AND the input. Using an SVG output and taking advantage of the "cx" attribute, you can eyeball where the devide is and count the number of &lt;ellipse&gt; elements on the left and the right, then multiply the two.