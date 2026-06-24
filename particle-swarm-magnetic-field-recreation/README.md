# Particle Swarm [Magnetic Field recreation]

A Pen created on CodePen.

Original URL: [https://codepen.io/ImagineProgramming/pen/LpOJzM](https://codepen.io/ImagineProgramming/pen/LpOJzM).

Click and drag to attract, right-click to repulse, middle-mouse-click to create a time-dilation field. Check out the options for colors and particle count (lower count might improve performance on FF).

Inspired by [thepheer's](http://codepen.io/thepheer) [magnetic field](http://codepen.io/thepheer/pen/yfkoC) pen. I wanted to recreate this pen completely by programming a perlin simplex noise generator, using my own implementation of [SmallPRNG](http://codepen.io/ImagineProgramming/pen/bcmyD) for seeding the noise generator, a simple Vector3D class and main code. 

All the functional code (but the [SmallPRNG](http://codepen.io/ImagineProgramming/pen/bcmyD) code) is in this pen, including vector and perlin noise stuff. In this implementation, the particles wrap the screen. This means that when they fall off one side, they re-appear on the other side.

Once again, thanks to @tmrDevelops for taking the time to help me with some issues.