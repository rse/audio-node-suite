
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

**Audio-Node-Suite** is a JavaScript library for use in the Browser
(through its regular [Web Audio API](https://www.w3.org/TR/webaudio/))
and Node.js (through its Web Audio API emulating
[web-audio-api](https://github.com/audiojs/web-audio-api) or
[web-audio-engine](https://github.com/mohayonao/web-audio-engine)
modules), which provides a suite of Web Audio API compatible
[`AudioNode`](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode)
classes:

- `AudioNodeComposite`: this is a convenient class for creating
  a custom composite/wrapping `AudioNode` class. It is used internally
  and can be also used for creating your own custom composite/wrapping
  `AudioNode`. As an additional goodie, the class provides a useful
  `bypass()` method for temporarily bypassing the effect of the
  underlying `AudioNode` instances.

- `AudioNodeGain`, `AudioNodeCompressor`, `AudioNodeLimiter`: these
  are just convenient wrappers for the regular functionality provided
  by the Web Audio API `GainNode` and `DynamicsCompressorNode` classes,
  providing the `bypass()` functionality and some opinionated parameter defaults.

- `AudioNodeEqualizer`: this is based on the Web Audio API `BiquadFilterNode`
  class and provides a convenient multi-band parametric equalizer `AudioNode`.

- `AudioNodeMeter`: this is based on the Web Audio API `AnalyzerNode`
  class and continuously tracks and measures the overall volume in
  decibel of the audio stream. It is also the internal base building
  block for the `AudioNodeGate` and `AudioNodeSpectrum` classes.

- `AudioNodeGate`: this is based on the Web Audio API `GainNode`
  class and measures the volume in decibel of the audio stream and
  drains the volume if it drops below a certain decibel threshold. It is
  intended to act as a Noise Gate.

- `AudioNodeSpectrum`: this is based on `AudioNodeMeter` and
  hence the Web Audio API `AnalyzerNode` class to analyze the
  frequency/decibel spectrum of the audio stream and continuously render
  it in a (linear or logarithmic) scale to a `Canvas` element in the
  DOM.

- `AudioNodeVoice`: this is based on `AudioNodeEqualizer`,
  `AudioNodeGate`, `AudioNodeCompressor`, `AudioNodeGain` and
  `AudioNodeLimiter` to provide a convenient single `AudioNode`
  which acts as a reasonable filter chain for voice. Its opinionated
  parameters are intentionally hard-coded and are just based on some
  experiences of the author.

Usage
-----

See the [TypeScript definition](src/audio-node-suite.d.ts)
for details on the provided Application Programming Interface (API).

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

Copyright &copy; 2020 Dr. Ralf S. Engelschall &lt;http://engelschall.com&gt;

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

