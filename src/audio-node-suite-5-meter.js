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

import { gainTodBFS, weightedAverage } from "./audio-node-suite-1-util.js"

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
            intervalLength:        100
        }, params)

        /*  create analyser filter  */
        const analyser = context.createAnalyser()
        analyser.fftSize               = params.fftSize
        analyser.minDecibels           = params.minDecibels
        analyser.maxDecibels           = params.maxDecibels
        analyser.smoothingTimeConstant = params.smoothingTimeConstant

        /*  create storage bins  */
        const dataT  = new Float32Array(analyser.fftSize)
        const dataF  = new Float32Array(analyser.frequencyBinCount)

        /*  internal state  */
        let lvlAvgPos = -1
        let lvlMaxPos = -1
        const lvlAvgArr  = []
        const lvlMaxArr  = []
        for (let i = 0; i < params.intervalLength; i++) {
            lvlAvgArr[i] = -Infinity
            lvlMaxArr[i] = -Infinity
        }

        /*  measure the metrics  */
        const measure = () => {
            /*  store time/amplitude data into storage bin  */
            analyser.getFloatTimeDomainData(dataT)

            /*  store frequency/decibel data into storage bin  */
            analyser.getFloatFrequencyData(dataF)

            /*  calculate the average (RMS) and peak (MAX) amplitude of the signal  */
            const stat = {}
            let total = 0
            let max = -Infinity
            for (let i = 0; i < dataT.length; i++) {
                if (dataT[i] < analyser.minDecibels)
                    dataT[i] = analyser.minDecibels
                else if (dataT[i] > analyser.maxDecibels)
                    dataT[i] = analyser.maxDecibels
                const square = dataT[i] * dataT[i]
                total += square
                if (max < square)
                    max = square
            }
            stat.avg = gainTodBFS(Math.sqrt(total / dataT.length))
            stat.max = gainTodBFS(Math.sqrt(max))

            /*  find time-based/leveled weighted average  */
            lvlAvgPos = (lvlAvgPos + 1) % params.intervalLength
            lvlAvgArr[lvlAvgPos] = stat.avg
            stat.lvlAvg = weightedAverage(lvlAvgArr, lvlAvgPos, params.intervalLength)

            /*  find time-based/leveled weighted maximum  */
            lvlMaxPos = (lvlMaxPos + 1) % params.intervalLength
            lvlMaxArr[lvlMaxPos] = stat.max
            stat.lvlMax = weightedAverage(lvlMaxArr, lvlMaxPos, params.intervalLength)

            analyser._stat = stat
        }
        setInterval(measure, params.intervalTime)
        measure()

        /*  allow caller to access internals  */
        analyser.dataT = () => dataT
        analyser.dataF = () => dataF
        analyser.stat  = () => analyser._stat

        return analyser
    }
}

