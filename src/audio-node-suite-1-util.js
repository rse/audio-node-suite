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

/*  utility functions for converting from dBFS (0.0 .. -120.0) to Gain (1.0 .. 0.0)  */
export const dBFSToGain = (dbfs) =>
    Math.pow(10, dbfs / 20)

/*  utility functions for converting from Gain (1.0 .. 0.0) to dBFS (0.0 .. -120.0)  */
export const gainTodBFS = (gain) =>
    20 * Math.log10(gain)

/*  a window "requestAnimationFrame" based timer  */
export class AnimationFrameTimer {
    constructor (cb) {
        this.timer = null
        if (window !== undefined) {
            this.timer = { repeat: true }
            const once = () => {
                cb()
                if (this.timer.repeat)
                    window.requestAnimationFrame(once)
            }
            window.requestAnimationFrame(once)
        }
        else
            this.timer = setInterval(() => cb(), 1000 / 60) /* 60 fps */
    }
    clear () {
        if (window !== undefined)
            this.timer.repeat = false
        else
            clearTimeout(this.timer)
    }
}

