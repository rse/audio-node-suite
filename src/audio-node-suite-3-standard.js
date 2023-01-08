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
import { dBFSToGain } from "./audio-node-suite-1-util.js"

/*  custom AudioNode: noise  */
export class AudioNodeNoise {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            type: "pink",
            channels: 1
        }, params)

        /*  generate noise  */
        const lengthInSamples = 5 * context.sampleRate
        const buffer = context.createBuffer(params.channels, lengthInSamples, context.sampleRate)
        if (params.type === "white") {
            /*  generate WHITE noise, i.e., random amplitudes across the entire frequency range  */
            for (let i = 0; i < lengthInSamples; i++) {
                const rand = (Math.random() * 2) - 1
                for (let j = 0; j < params.channels; j++) {
                    const data = buffer.getChannelData(j)
                    data[i] = rand
                }
            }
        }
        else if (params.type === "pink") {
            /*  generate PINK noise, i.e., random amplitudes across the entire frequency range and
                where the amplitudes of the higher frequences are less strong than the low frequences.  */

            /*  phase 1: generate PINK noise.
                This is based on the approximating algorithm from Paul Kellett.
                (see https://www.musicdsp.org/en/latest/_downloads/84bf8a1271c6bb0b3c88253c0546ae0f/pink.txt)  */
            let pink = []
            for (let i = 0; i < params.channels; i++) {
                pink[i] = new Float32Array(lengthInSamples)
                let b = [ 0, 0, 0, 0, 0, 0, 0 ]
                for (let j = 0; j < lengthInSamples; j++) {
                    const white = (Math.random() * 2) - 1
                    b[0] = 0.99886 * b[0] + white * 0.0555179
                    b[1] = 0.99332 * b[1] + white * 0.0750759
                    b[2] = 0.96900 * b[2] + white * 0.1538520
                    b[3] = 0.86650 * b[3] + white * 0.3104856
                    b[4] = 0.55000 * b[4] + white * 0.5329522
                    b[5] = -0.7616 * b[5] - white * 0.0168980
                    pink[i][j] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362
                    b[6] = white * 0.115926
                }
            }

            /*  phase 2: normalize to +/-1 and prevent positive saturation.  */
            let minA = []
            let maxA = []
            for (let i = 0; i < pink.length; i++) {
                minA.push(Math.min(...pink[i]))
                maxA.push(Math.max(...pink[i]))
            }
            const min = Math.min(...minA)
            const max = Math.max(...maxA)
            const coefficient = (2147483647 / 2147483648) / Math.max(Math.abs(min), max)
            for (let i = 0; i < params.channels; i++)
                for (let j = 0; j < lengthInSamples; j++)
                    buffer.getChannelData(i)[j] = pink[i][j] * coefficient
        }

        /*  create underlying BufferSource node  */
        const bs = context.createBufferSource()
        bs.buffer = buffer
        bs.loop = true
        bs.start(0)
        return bs
    }
}

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
        gain.adjustGainDecibel = (db, ms = 10) => {
            gain.gain.linearRampToValueAtTime(dBFSToGain(db), context.currentTime + ms)
        }
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
            ratio:     2
        }, params)

        /*  create and configure underlying Compressor node  */
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.setValueAtTime(params.threshold, context.currentTime)
        compressor.knee.setValueAtTime(params.knee, context.currentTime)
        compressor.ratio.setValueAtTime(params.ratio, context.currentTime)
        compressor.attack.setValueAtTime(params.attack, context.currentTime)
        compressor.release.setValueAtTime(params.release, context.currentTime)
        return compressor
    }
}

/*  custom AudioNode: limiter  */
export class AudioNodeLimiter {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            threshold: -3.0,
            attack:    0.001,
            release:   0.050,
            knee:      0,
            ratio:     20
        }, params)

        /*  create and configure underlying Compressor node  */
        const limiter = context.createDynamicsCompressor()
        limiter.threshold.setValueAtTime(params.threshold, context.currentTime)
        limiter.knee.setValueAtTime(params.knee, context.currentTime)
        limiter.ratio.setValueAtTime(params.ratio, context.currentTime)
        limiter.attack.setValueAtTime(params.attack, context.currentTime)
        limiter.release.setValueAtTime(params.release, context.currentTime)
        return limiter
    }
}

