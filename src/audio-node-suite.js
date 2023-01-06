/*
**  Audio-Node-Suite -- Web Audio API AudioNode Suite
**  Copyright (c) 2020-2023 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  import all internally exported classes  */
import {
    AudioNodeComposite
} from "./audio-node-suite-2-composite.js"
import {
    AudioNodeGain,
    AudioNodeCompressor,
    AudioNodeLimiter
} from "./audio-node-suite-3-standard.js"
import {
    AudioNodeEqualizer
} from "./audio-node-suite-4-equalizer.js"
import {
    AudioNodeMeter
} from "./audio-node-suite-5-meter.js"
import {
    AudioNodeGate
} from "./audio-node-suite-6-gate.js"
import {
    AudioNodeSpectrum
} from "./audio-node-suite-7-spectrum.js"
import {
    AudioNodeVoice
} from "./audio-node-suite-8-voice.js"

/*  export the traditional way for interoperability reasons
    (as Babel would export an object with a 'default' field)  */
module.exports = {
    AudioNodeComposite,
    AudioNodeGain,
    AudioNodeCompressor,
    AudioNodeLimiter,
    AudioNodeEqualizer,
    AudioNodeMeter,
    AudioNodeGate,
    AudioNodeSpectrum,
    AudioNodeVoice
}

