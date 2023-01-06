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

/*  custom AudioNode: meter  */
export class AudioNodeMeter {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            fftSize:               2048,
            minDecibels:           -100,
            maxDecibels:           0,
            smoothingTimeConstant: 0.8,
            intervalTime:          1000 / 120,
            intervalLength:        100
        }, params)

        /*  create analyser filter  */
        const analyser = context.createAnalyser()
        analyser.fftSize               = params.fftSize
        analyser.minDecibels           = params.minDecibels
        analyser.maxDecibels           = params.maxDecibels
        analyser.smoothingTimeConstant = params.smoothingTimeConstant

        /*  create storage bins  */
        const data       = new Float32Array(analyser.frequencyBinCount)
        const dataSorted = new Float32Array(analyser.frequencyBinCount)

        /*  internal state  */
        const lvlAvgArr  = []
        let lvlAvgPos = -1
        const devAvgArr  = []
        let devAvgPos = -1

        /*  calculate weighted average value  */
        const avg = (arr, pos, len) => {
            const max = arr.length < len ? arr.length : len

            let avg = 0
            let num = 0
            for (let i = 0; i <= pos; i++) {
                const w = i + (max - pos)
                avg += w * arr[i]
                num += w
            }
            for (let i = pos + 1; i < max; i++) {
                const w = i - (pos + 1)
                avg += w * arr[i]
                num += w
            }
            avg /= num
            return avg
        }

        /*  measure the metrics  */
        const measure = () => {
            /*  store FFT data into storage bin  */
            analyser.getFloatFrequencyData(data)

            /*  calculate the average decibel level of the signal over all frequencies  */
            const stat = {}
            let total = 0
            for (let i = 0; i < data.length; i++) {
                if (data[i] < analyser.minDecibels)
                    data[i] = analyser.minDecibels
                else if (data[i] > analyser.maxDecibels)
                    data[i] = analyser.maxDecibels
                total += data[i] * data[i]
                dataSorted[i] = data[i]
            }
            stat.avg = Math.sqrt(total / data.length)

            /*  sort frequencies and determine quantiles  */
            dataSorted.sort()
            stat.min = dataSorted[0]
            const q = Math.floor(dataSorted.length / 8)
            stat.q1  = dataSorted[q * 1]
            stat.q2  = dataSorted[q * 2]
            stat.q3  = dataSorted[q * 3]
            stat.med = dataSorted[q * 4]
            stat.q4  = dataSorted[q * 5]
            stat.q5  = dataSorted[q * 6]
            stat.q6  = dataSorted[q * 7]
            stat.max = dataSorted[dataSorted.length - 1]

            /*  find time-based average  */
            lvlAvgPos = (lvlAvgPos + 1) % params.intervalLength
            lvlAvgArr[lvlAvgPos] = stat.max
            stat.lvlAvg = avg(lvlAvgArr, lvlAvgPos, params.intervalLength)
            stat.lvlDev = Math.abs(stat.max - stat.lvlAvg)

            /*  find time-based deviation  */
            devAvgPos = (devAvgPos + 1) % params.intervalLength
            devAvgArr[devAvgPos] = stat.lvlDev
            stat.devAvg = avg(devAvgArr, devAvgPos, params.intervalLength)
            stat.devDev = Math.abs(stat.lvlDev - stat.devAvg)

            analyser._stat = stat
        }
        setInterval(measure, params.intervalTime)
        measure()

        /*  allow caller to access internals  */
        analyser.data = () => data
        analyser.stat = () => analyser._stat

        return analyser
    }
}

