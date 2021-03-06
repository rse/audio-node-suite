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

/*  Composite Web Audio API AudioNode  */
export class AudioNodeComposite {
    constructor (input, output) {
        /*  require at least a wrapped input node  */
        if (typeof input !== "object" || !(input instanceof AudioNode))
            throw new Error("input has to be a valid AudioNode")

        /*  allow distinct output node, or use the input one  */
        if (typeof output !== "object")
            output = input

        /*  determine AudioContext via input node  */
        const context = input.context

        /*  use a no-op AudioNode node to represent us  */
        const node = context.createGain()

        /*  always initially connect us to the input node  */
        node.connect(input)

        /*  track the connected targets and bypass state  */
        node._targets = []
        node._bypass  = false

        /*  provide an overloaded Web API "connect" method  */
        node._connect = node.connect
        node.connect = (...target) => {
            /*  track target  */
            node._targets.push(target)

            /*  fire event before  */
            node.dispatchEvent(new CustomEvent("connect-before", { detail: { target } }))

            /*  connect us to target node  */
            let result
            if (node._bypass)
                result = node._connect(...target)
            else
                result = output.connect(...target)

            /*  fire event after  */
            node.dispatchEvent(new CustomEvent("connect-after", { detail: { result, target } }))

            return result
        }

        /*  provide an overloaded Web API "disconnect" method  */
        node._disconnect = node.disconnect
        node.disconnect = (...target) => {
            /*  fire event before  */
            node.dispatchEvent(new CustomEvent("disconnect-before", { detail: { target } }))

            /*  disconnect us from target node  */
            let result
            if (node._bypass)
                result = node._disconnect(...target)
            else
                result = output.disconnect(...target)

            /*  untrack target  */
            node._targets = node._targets.filter((_target) => {
                if (_target.length !== target.length)
                    return true
                for (let i = 0; i < target.length; i++)
                    if (_target[i] !== target[i])
                        return true
                return false
            })

            /*  fire event before  */
            node.dispatchEvent(new CustomEvent("disconnect-after", { detail: { result, target } }))

            return result
        }

        /*  provide a custom "bypass" method  */
        node.bypass = (bypass) => {
            /*  short-circuit no operations  */
            if (node._bypass === bypass)
                return

            /*  take over new state and dispatch according to it  */
            node._bypass = bypass
            if (node._bypass) {
                /*  fire event before  */
                node.dispatchEvent(new CustomEvent("bypass-enable-before"))

                /*  bypass mode: connect us to targets directly  */
                node._disconnect(input)
                for (const _target of node._targets) {
                    output.disconnect(..._target)
                    node._connect(..._target)
                }

                /*  fire event after  */
                node.dispatchEvent(new CustomEvent("bypass-enable-after"))
            }
            else {
                /*  fire event before  */
                node.dispatchEvent(new CustomEvent("bypass-disable-before"))

                /*  regular mode: connect us to to targets via input/output nodes  */
                for (const _target of node._targets) {
                    node._disconnect(..._target)
                    output.connect(..._target)
                }
                node._connect(input)

                /*  fire event after  */
                node.dispatchEvent(new CustomEvent("bypass-disable-after"))
            }
        }

        /*  return our "AudioNode" representation (instead of ourself)  */
        return node
    }
}

