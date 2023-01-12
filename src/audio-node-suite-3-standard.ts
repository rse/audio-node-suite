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
import { dBFSToGain }         from "./audio-node-suite-1-util.js"
import { AudioNodeComposite } from "./audio-node-suite-2-composite.js"

/*  custom AudioNode: silence  */
export class AudioNodeSilence extends AudioNodeComposite {
    constructor (context: AudioContext, params: { channels?: number } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.channels ??= 1

        /*  configure the underlying BufferSource node  */
        const bs = context.createBufferSource()
        bs.channelCount = params.channels
        bs.buffer = null
        bs.loop = true
        bs.start(0)

        this.chain(bs)
    }
}

/*  custom AudioNode: noise  */
export class AudioNodeNoise extends AudioNodeComposite {
    constructor (context: AudioContext, params: { type?: string, channels?: number } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.type     ??= "pink"
        params.channels ??= 1

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
            const pink = []
            for (let i = 0; i < params.channels; i++) {
                pink[i] = new Float32Array(lengthInSamples)
                const b = [ 0, 0, 0, 0, 0, 0, 0 ]
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
            const minA = []
            const maxA = []
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
        bs.channelCount = params.channels
        bs.buffer = buffer
        bs.loop = true
        bs.start(0)
        this.chain(bs)
    }
}

/*  custom AudioNode: mute  */
export class AudioNodeMute extends AudioNodeComposite {
    constructor (context: AudioContext, params: { muted?: boolean } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.muted ??= false

        /*  create and configure underlying Gain node  */
        this.gain.setValueAtTime(params.muted ? 0.0 : 1.0, this.context.currentTime)
    }
    mute (_mute: boolean, ms = 10) {
        const value = _mute ? 0.0 : 1.0
        this.gain.linearRampToValueAtTime(value, this.context.currentTime + ms / 1000)
    }
}

/*  custom AudioNode: gain  */
export class AudioNodeGain extends AudioNodeComposite {
    constructor (context: AudioContext, params: { gain?: number } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.gain ??= 0

        /*  create and configure underlying Gain node  */
        this.gain.setValueAtTime(dBFSToGain(params.gain), this.context.currentTime)
    }
    adjustGainDecibel (db: number, ms = 10) {
        this.gain.linearRampToValueAtTime(dBFSToGain(db), this.context.currentTime + ms / 1000)
    }
}

/*  custom AudioNode: compressor  */
export class AudioNodeCompressor extends AudioNodeComposite {
    constructor (context: AudioContext, params: { threshold?: number, attack?: number,
        release?: number, knee?: number, ratio?: number } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.threshold ??= -16.0
        params.attack    ??= 0.003
        params.release   ??= 0.400
        params.knee      ??= 3.0
        params.ratio     ??= 2

        /*  create and configure underlying Compressor node  */
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.setValueAtTime(params.threshold, context.currentTime)
        compressor.knee.setValueAtTime(params.knee, context.currentTime)
        compressor.ratio.setValueAtTime(params.ratio, context.currentTime)
        compressor.attack.setValueAtTime(params.attack, context.currentTime)
        compressor.release.setValueAtTime(params.release, context.currentTime)

        /*  configure compressor as sub-chain  */
        this.chain(compressor)
    }
}

/*  custom AudioNode: limiter  */
export class AudioNodeLimiter extends AudioNodeComposite {
    constructor (context: AudioContext, params: { threshold?: number, attack?: number,
        release?: number, knee?: number, ratio?: number } = {}) {
        super(context)

        /*  provide parameter defaults  */
        params.threshold ??= -3.0
        params.attack    ??= 0.001
        params.release   ??= 0.050
        params.knee      ??= 0
        params.ratio     ??= 20

        /*  create and configure underlying Compressor node  */
        const limiter = context.createDynamicsCompressor()
        limiter.threshold.setValueAtTime(params.threshold, context.currentTime)
        limiter.knee.setValueAtTime(params.knee, context.currentTime)
        limiter.ratio.setValueAtTime(params.ratio, context.currentTime)
        limiter.attack.setValueAtTime(params.attack, context.currentTime)
        limiter.release.setValueAtTime(params.release, context.currentTime)

        /*  configure limiter as sub-chain  */
        this.chain(limiter)
    }
}

