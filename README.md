
Audio-Node-Suite
================

Web Audio API `AudioNode` Suite

<p/>
<img src="https://nodei.co/npm/audio-node-suite.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/audio-node-suite.png" alt=""/>

Installation
------------

```shell
$ npm install audio-node
```

About
-----

Audio-Node-Suite is a JavaScript library for use in the Browser and Node.js,
which provides a suite of Web Audio API compatible `AudioNode` classes:

- `AudioNodeComposite`: this is a convenient class for creating
  a custom composite/wrapping `AudioNode` class. It is used internally
  and can be also used for creating your own custom composite/wrapping
  `AudioNode`. As an additional goodie, the class provides a useful
  `bypass()` method for temporarily bypassing the effect of the
  underlying `AudioNode` instances.

- `AudioNodeGain`, `AudioNodeCompressor`, `AudioNodeLimiter`: these
  are just convenient wrappers for the regular functionality provides
  by the Web Audio API `GainNode` and `DynamicsCompressorNode` classes,
  providing the `bypass()` functionality and useful parameter defaults.

- `AudioNodeEqualizer`: this is based on Web Audio API `BiquadFilterNode`
  instances and provides a convenient multi-band parametric equalizer `AudioNode`.

- `AudioNodeMeter`: this is based on a Web Audio API `AnalyzerNode` 
  instance and measures the volume in decibel of the audio stream in various ways.

- `AudioNodeGate`: this is based on a Web Audio API `GainNode` 
  instance and measures the volume in decibel of the audio stream and
  drains the volume if it drops below a certain decibel threshold. It is
  intended to act as a Noise Gate.

- `AudioNodeSpectrum`: this is based on `AudioNodeMeter` and
  hence a Web Audio API `AnalyzerNode` instance to analyze the
  frequency/decibel spectrum of the audio stream and continuously render
  it in a logarithmic scale to a `Canvas` DOM element.

- `AudioNodeVoice`: this is based on `AudioNodeEqualizer`,
  `AudioNodeGate`, `AudioNodeCompressor`, `AudioNodeGain` and
  `AudioNodeLimiter` to provide a convenient single `AudioNode`
  which acts as a reasonable filter chain for voice. Its opinionated
  parameters are hard-coded and just based on some experiences.

Usage
-----

See the [TypeScript definition file](src/audio-node-suite.d.ts)
for details on the exposed Application Programming Interface (API).

Implementation Notice
---------------------

Although Audio-Node-Suite is written in ECMAScript 2020, it is transpiled to older
environments and this way runs in really all current (as of 2020)
JavaScript environments, of course.

Additionally, there are two transpilation results: first, there is a
compressed `audio-node-suite.browser.js` for Browser environments. Second, there is
an uncompressed `audio-node-suite.node.js` for Node.js environments.

License
-------

Copyright (c) 2020 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

