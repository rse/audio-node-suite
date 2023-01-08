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
import { AnimationFrameTimer } from "./audio-node-suite-1-util.js"
import { AudioNodeMeter }      from "./audio-node-suite-5-meter.js"

/*  custom AudioNode: amplitude visualizer  */
export class AudioNodeAmplitude {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            fftSize:               512,
            minDecibels:           -60,
            maxDecibels:           0,
            smoothingTimeConstant: 0.80,
            intervalTime:          1000 / 60,
            intervalCount:         Math.round(300 / (1000 / 60)), /* for 300ms RMS/m */
            decibelBar:            [ -60, -50, -21.0, -6.0 ],
            colorBar:              [ "#306090", "#00b000", "#e0d000", "#e03030" ],
            colorBarMuted:         [ "#606060", "#808080", "#a0a0a0", "#c0c0c0" ],
            colorRMS:              "#ffffff",
            colorBackground:       "#000000",
            logarithmic:           true,
            horizontal:            false
        }, params)

        /*  create meter  */
        const meter = new AudioNodeMeter(context, {
            fftSize:               params.fftSize,
            minDecibels:           params.minDecibels,
            maxDecibels:           params.maxDecibels,
            smoothingTimeConstant: params.smoothingTimeConstant,
            intervalTime:          params.intervalTime,
            intervalCount:         params.intervalCount
        })

        /*  internal state  */
        let canvases = []
        let timer = null

        /*  allow caller to adjust our mute state  */
        let active = true
        meter.active = (_active) => { active = _active }

        /*  add/remove canvas for spectrum visualization  */
        meter.draw = function (canvas) {
            canvases.push(canvas)
            if (canvases.length === 1) {
                timer = new AnimationFrameTimer(() => {
                    for (const canvas of canvases)
                        meter._draw(canvas)
                })
            }
        }
        meter.undraw = function (canvas) {
            canvases = canvases.filter((c) => c !== canvas)
            if (canvases.length === 0)
                timer.clear()
        }

        /*  draw spectrum into canvas  */
        meter._draw = function (canvas) {
            /*  determine meter information  */
            const peak = meter.stat().peak
            const rms  = meter.stat().rmsM

            /*  prepare canvas  */
            const canvasCtx = canvas.getContext("2d")
            canvasCtx.fillStyle = params.colorBackground
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

            const colorBar = active ? params.colorBar : params.colorBarMuted
            const scaleToCanvasUnits = (value) => {
                if (params.horizontal)
                    return (value / (meter.maxDecibels - meter.minDecibels)) * canvas.width
                else
                    return (value / (meter.maxDecibels - meter.minDecibels)) * canvas.height
            }
            const drawSeg = (from, to, color) => {
                const b = scaleToCanvasUnits(Math.abs(to - meter.minDecibels))
                const h = scaleToCanvasUnits(Math.abs(to - from))
                canvasCtx.fillStyle = color
                if (params.horizontal)
                    canvasCtx.fillRect(b - h, 0, h, canvas.height)
                else
                    canvasCtx.fillRect(0, canvas.height - b, canvas.width, h)
            }
            let len   = Math.min(params.decibelBar.length, colorBar.length)
            let from  = meter.minDecibels
            let color = colorBar[0]
            for (let i = 0; i < len; i++) {
                if (peak < params.decibelBar[i])
                    break
                else {
                    let to = params.decibelBar[i]
                    drawSeg(from, to, color)
                    color = colorBar[i]
                    from = to
                }
            }
            drawSeg(from, peak, color)

            const h = scaleToCanvasUnits(Math.abs(rms - meter.minDecibels))
            canvasCtx.fillStyle = params.colorRMS
            if (params.horizontal)
                canvasCtx.fillRect(h - 1, 0, 1, canvas.height)
            else
                canvasCtx.fillRect(0, canvas.height - h, canvas.width, 1)
        }
        return meter
    }
}

