/*
**  Audio-Node-Suite -- Web Audio API AudioNode Suite
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
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
import { dBFSToGain } from "./audio-node-suite-1-util.js"

/*  custom AudioNode: gain  */
export class AudioNodeGain {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            gain: 0
        }, params)

        /*  create and configure underlying Gain node  */
        const gain = context.createGain()
        gain.gain.setValueAtTime(dBFSToGain(params.gain), context.currentTime)
        return gain
    }
}

/*  custom AudioNode: compressor  */
export class AudioNodeCompressor {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            threshold: -16.0,
            attack:    0.003,
            release:   0.400,
            knee:      3.0,
            ratio:     2.0
        }, params)

        /*  create and configure underlying Compressor node  */
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.value = params.threshold
        compressor.knee.value      = params.knee
        compressor.ratio.value     = params.ratio
        compressor.attack.value    = params.attack
        compressor.release.value   = params.release
        return compressor
    }
}

/*  custom AudioNode: limiter  */
export class AudioNodeLimiter {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            threshold: -3.0,
            attack:    0.003,
            release:   0.050,
            knee:      0.0,
            ratio:     20.0
        })

        /*  create and configure underlying Compressor node  */
        const limiter = context.createDynamicsCompressor()
        limiter.threshold.value = params.threshold
        limiter.knee.value      = params.knee
        limiter.ratio.value     = params.ratio
        limiter.attack.value    = params.attack
        limiter.release.value   = params.release
        return limiter
    }
}

