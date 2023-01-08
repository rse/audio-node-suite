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
import { AudioNodeMeter }     from "./audio-node-suite-5-meter.js"

/*  custom AudioNode: (noise) gate  */
export class AudioNodeGate {
    constructor (context, params = {}) {
        /*  provide parameter defaults  */
        params = Object.assign({}, {
            threshold:  -45,  /*  open above threshold (dbFS)  */
            hysteresis: -3,   /*  close below threshold+hysteresis (dbFS)  */
            reduction:  -30,  /*  reduction of volume gain (dbFS)  */
            interval:   2,    /*  tracking interval (ms)  */
            attack:     4,    /*  time to attack/clamp-up volume (ms)  */
            hold:       40,   /*  time to hold volume after it dropped below threshold+hysteresis (ms)  */
            release:    200   /*  time to release/clamp-down volume (ms)  */
        }, params)

        /*  leverage Meter node for determining volume level  */
        const meter = new AudioNodeMeter(context, {
            fftSize:               512,
            minDecibels:           -94,
            maxDecibels:           0,
            smoothingTimeConstant: 0.8,
            intervalTime:          2,
            intervalCount:         25
        })

        /*  leverage Gain node for changing the gain  */
        const gain = context.createGain()
        meter.connect(gain)

        /*  continuously control gain  */
        let state = "open"
        let timer = null
        const gainOpen   = 1.0
        const gainClosed = dBFSToGain(params.reduction)
        const controlGain = () => {
            /*  determine current average level  */
            const level = meter.stat().rmsM

            /*  dispatch according to current state  */
            if (state === "closed") {
                if (level >= params.threshold) {
                    /*  ramp up  */
                    state = "attack"
                    gain.gain.cancelScheduledValues(context.currentTime)
                    gain.gain.linearRampToValueAtTime(gainOpen, context.currentTime + params.attack / 1000)
                    if (timer !== null)
                        clearTimeout(timer)
                    timer = setTimeout(() => {
                        /*  stay open  */
                        state = "open"
                    }, params.attack)
                }
            }
            else if (state === "attack") {
                if (level < params.threshold + params.hysteresis) {
                    /*  re-close again with a re-release  */
                    state = "release"
                    gain.gain.cancelScheduledValues(context.currentTime)
                    gain.gain.linearRampToValueAtTime(gainClosed, context.currentTime + params.release / 1000)
                    if (timer !== null)
                        clearTimeout(timer)
                    timer = setTimeout(() => {
                        state = "closed"
                    }, params.release)
                }
            }
            else if (state === "open") {
                if (level < params.threshold + params.hysteresis) {
                    /*  prepare for ramp down  */
                    state = "hold"
                    if (timer !== null)
                        clearTimeout(timer)
                    timer = setTimeout(() => {
                        /*  ramp down  */
                        state = "release"
                        gain.gain.cancelScheduledValues(context.currentTime)
                        gain.gain.linearRampToValueAtTime(gainClosed, context.currentTime + params.release / 1000)
                        timer = setTimeout(() => {
                            state = "closed"
                        }, params.release)
                    }, params.hold)
                }
            }
            else if (state === "hold") {
                if (level >= params.threshold) {
                    /*  re-open immediately again  */
                    state = "open"
                    if (timer !== null)
                        clearTimeout(timer)
                }
            }
            else if (state === "release") {
                if (level >= params.threshold) {
                    /*  re-open again with a re-attack  */
                    state = "attack"
                    gain.gain.cancelScheduledValues(context.currentTime)
                    gain.gain.linearRampToValueAtTime(gainClosed, context.currentTime + params.attack / 1000)
                    if (timer !== null)
                        clearTimeout(timer)
                    timer = setTimeout(() => {
                        state = "open"
                    }, params.attack)
                }
            }

            /*  re-schedule next interval  */
            setTimeout(controlGain, params.interval)
        }

        /*  schedule first interval  */
        setTimeout(controlGain, params.interval)

        /*  return compose node  */
        return new AudioNodeComposite(meter, gain)
    }
}

