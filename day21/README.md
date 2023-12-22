KIV for later, but basically my "caching" doesn't work for some reason. I'm actually not sure caching helps at all.

tldr; the "outbound" for a given grid is not being cached correctly, it is generating rubbish - i'm not sure how this is possible.

======

Part 2

Caching only makes it easier to solve up to about step 1000... so there's no choice but to go into pattern derivation

tldr; e.g. this output:

Step 982 or (131 * 7 + 65):
                                979 5758  962                              
                           979 6712 7688 6702  962                         
                      979 6712 7688 7656 7688 6702  962                    
                 979 6712 7688 7656 7688 7656 7688 6702  962               
            979 6712 7688 7656 7688 7656 7688 7656 7688 6702  962          
       979 6712 7688 7656 7688 7656 7688 7656 7688 7656 7688 6702  962     
  979 6712 7688 7656 7688 7656 7688 7656 7688 7656 7688 7656 7688 6702  962
 5767 7688 7656 7688 7656 7688 7656 7688 7656 7688 7656 7688 7656 7688 5766
  988 6711 7688 7656 7688 7656 7688 7656 7688 7656 7688 7656 7688 6720  991
       988 6711 7688 7656 7688 7656 7688 7656 7688 7656 7688 6720  991     
            988 6711 7688 7656 7688 7656 7688 7656 7688 6720  991          
                 988 6711 7688 7656 7688 7656 7688 6720  991               
                      988 6711 7688 7656 7688 6720  991                    
                           988 6711 7688 6720  991                         
                                988 5775  991                              
962: 7
979: 7
988: 7
991: 7
5758: 1
5766: 1
5767: 1
5775: 1
6702: 6
6711: 6
6712: 6
6720: 6
7656: 36
7688: 49

1. The input garden is of size 131
2. The number of steps to solve for is 26501365
3. 26501365 % 131 = 65, so we need to find patterns for every 65th step
4. The above is a visualization of each "garden tile" that is repeated across the universe. The numbers are the number of reachable plots
   after traversing that number of steps
5. There's a pattern to how often each number repeats. For example 962,979,988,991 repeat every n times, where n is the result when you divide
   982 by 131. Note that the "coefficients" are unique depending on the offset (in this case, I am using 65)
6. Based on this you can write some complicated formula 

```
(962+979+988+991)*n +
(5758+5766+5767+5775) +
(6702+....)*(n-1) +
(7656)*(n-1)^2 +
(7688)*(n)^2

where n is the result of
26501355 = n * 131 + 65

ugggghhhhh.....
