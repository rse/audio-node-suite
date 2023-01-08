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

/*  internal requirements  */
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
    AudioNodeGate
} from "./audio-node-suite-6-gate.js"

/*  custom AudioNode: voice filter  */
export class AudioNodeVoice {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            gain: 0.0
        }, params)

        /*  1. create: cutting equalizer  */
        const cutEQ = new AudioNodeEqualizer(context, {
            bands: [
                { type: "highpass",  freq:    80, q:  4.00 },
                { type: "notch",     freq:    50, q:  1.50 },
                { type: "notch",     freq:   960, q:  1.50 },
                { type: "lowpass",   freq: 20480, q:  0.25 }
            ]
        })

        /*  2. create: noise gate  */
        const gate = new AudioNodeGate(context, {
            threshold:  -50,
            hysteresis: -3,
            reduction:  -30,
            interval:   2,
            attack:     4,
            hold:       40,
            release:    200
        })

        /*  3. create: compressor  */
        const comp = new AudioNodeCompressor(context, {
            threshold: -16,
            attack:    0.003,
            release:   0.400,
            knee:      3.0,
            ratio:     2
        })

        /*  4. create: boosting equalizer  */
        const boostEQ = new AudioNodeEqualizer(context, {
            bands: [
                { type: "peaking",   freq:   240, q:  0.75, gain: 3.00 },
                { type: "highshelf", freq:  3840, q:  0.75, gain: 6.00 }
            ]
        })

        /*  5. create: gain compensator  */
        const gain = new AudioNodeGain(context, {
            gain: -9.0 + params.gain
        })

        /*  6. create: limiter  */
        const limiter = new AudioNodeLimiter(context)

        /*  connect the chain  */
        cutEQ.connect(gate)
        gate.connect(comp)
        comp.connect(boostEQ)
        boostEQ.connect(gain)
        gain.connect(limiter)

        /*  return a composite node  */
        return new AudioNodeComposite(cutEQ, limiter)
    }
}

