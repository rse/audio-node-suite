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
import { gainTodBFS, ensureWithin, weightedAverage } from "./audio-node-suite-1-util.js"

/*  custom AudioNode: meter  */
export class AudioNodeMeter {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            fftSize:               512,
            minDecibels:           -94,
            maxDecibels:           0,
            smoothingTimeConstant: 0.8,
            intervalTime:          3,
            intervalCount:         100
        }, params)

        /*  create underlying analyser node  */
        const analyser = context.createAnalyser()
        analyser.fftSize               = params.fftSize
        analyser.minDecibels           = params.minDecibels
        analyser.maxDecibels           = params.maxDecibels
        analyser.smoothingTimeConstant = params.smoothingTimeConstant

        /*  initialize internal state  */
        const stat = { peak: -Infinity, rms:  -Infinity, rmsM: -Infinity, rmsS: -Infinity }
        const rmsLen  = params.intervalCount
        let   rmsInit = true
        let   rmsPos  = 0
        const rmsArr  = []
        const dataT = new Float32Array(analyser.fftSize)
        const dataF = new Float32Array(analyser.frequencyBinCount)

        /*  measure the metrics  */
        const measure = () => {
            /*  store time/amplitude data into storage bin  */
            analyser.getFloatTimeDomainData(dataT)

            /*  store frequency/decibel data into storage bin  */
            analyser.getFloatFrequencyData(dataF)

            /*  calculate the instant RMS and Peak amplitude of the signal  */
            let rms  = 0
            let peak = -Infinity
            for (let i = 0; i < dataT.length; i++) {
                const square = dataT[i] * dataT[i]
                rms += square
                if (peak < square)
                    peak = square
            }
            stat.rms  = ensureWithin(gainTodBFS(Math.sqrt(rms / dataT.length)), params.minDecibels, params.maxDecibels)
            stat.peak = ensureWithin(gainTodBFS(Math.sqrt(peak)),               params.minDecibels, params.maxDecibels)

            /*  determine RMS over time  */
            if (rmsLen > 0) {
                if (rmsPos === (rmsLen - 1) && rmsInit)
                    rmsInit = false
                rmsPos = (rmsPos + 1) % rmsLen
                rmsArr[rmsPos] = stat.rms
                stat.rmsM = weightedAverage(rmsArr, rmsInit, rmsPos, rmsLen)
            }
        }
        setInterval(measure, params.intervalTime)
        measure()

        /*  allow caller to access internals  */
        analyser.dataT = () => dataT
        analyser.dataF = () => dataF
        analyser.stat  = () => stat

        /*  return underlying node  */
        return analyser
    }
}

