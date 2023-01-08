
<template>
    <div class="sample">
        <div class="box">
            <div class="box-title">Microphone</div>
            <input
                type="button"
                v-bind:value="inputType"
                v-on:click="inputTypeToggle"
            />
            <input
                ref="microMute"
                type="button"
                v-bind:value="microMuted ? 'Unmute' : 'Mute'"
                v-on:click="microMuteToggle"
            />
            <br/>
            <canvas ref="canvas1" class="canvas"></canvas>
            <canvas ref="canvas2" class="canvas"></canvas>
            <br/>
            <canvas ref="canvasA1" class="canvasAH"></canvas>
            <br/>
            <canvas ref="canvasA2" class="canvasAH"></canvas>
        </div>
        <p/>
        <div class="box">
            <div class="box-title">Filtering</div>
            <input
                ref="audioRecording"
                type="button"
                v-bind:value="audioRecording ? 'Stop Recording' : 'Start Recording'"
                v-on:click="audioRecordingToggle"
            />
            <input
                ref="audioPlaying"
                type="button"
                v-bind:value="audioPlaying ? 'Stop Playing' : 'Start Playing'"
                v-on:click="audioPlayingToggle"
            />
            <input
                type="button"
                v-bind:value="audioBypass ? 'Stop Bypass' : 'Start Bypass'"
                v-on:click="audioBypassToggle"
            />
        </div>
        <p/>
        <div class="box">
            <div class="box-title">Speaker</div>
            <input
                ref="speakerMute"
                type="button"
                v-bind:value="speakerMuted ? 'Unmute' : 'Mute'"
                v-on:click="speakerMuteToggle"
            />
            <input
                ref="speakerVolume"
                type="range"
                min="0" max="100" step="1"
                v-model="speakerVolume"
            />
            <br/>
            <audio
                ref="speakerStream"
                class="audio"
                autoplay="true"
                controls
            ></audio>
        </div>
    </div>
</template>

<style scoped>
.sample {
    padding:          50px;
    font-family:      sans-serif;
    font-size:        22pt;
}
.sample .audio {
    height: 40px;
    width: 300px;
}
.sample .canvas {
    height: 200px;
    width:  400px;
    margin-right: 10px;
}
.sample .canvasAV {
    height: 200px;
    width:  10px;
    margin-right: 4px;
}
.sample .canvasAH {
    height: 10px;
    width:  200px;
    margin-right: 4px;
}
.sample .box {
    border: 1px solid #999999;
    border-radius: 10px;
    padding-top: 40px;
    padding-left: 20px;
    padding-right: 20px;
    padding-bottom: 20px;
    position: relative;
}
.sample .box .box-title {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% - 2px);
    background-color: #999999;
    color: #ffffff;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    text-align: center;
    padding: 2px;
}
</style>

<script>
module.exports = {
    name: "sample",
    props: {
    },
    data: () => ({
        inputTypeList:        [ "mic", "white", "pink" ],
        inputTypePos:         0,
        inputType:            "mic",
        microMuted:           false,
        microVolume:          100,
        microStream:          null,
        microStreamFiltered:  null,
        audioRecording:       false,
        audioPlaying:         false,
        recorder:             null,
        audioBlob:            null,
        audioBlobChunks:      [],
        audioBypass:          false,
        nodeVoiceFilter:      null,
        speakerContext:       null,
        speakerMuted:         true,
        speakerVolume:        100
    }),
    watch: {
        speakerMuted () {
            this.$refs.speakerStream.muted = this.speakerMuted
        },
        speakerVolume () {
            this.$refs.speakerStream.volume = this.speakerVolume / 100
        },
        microMuted () {
            if (this.microStream === null)
                return
            this.microStream.getAudioTracks()[0].enabled = !this.microMuted
        }
    },
    methods: {
        audioBypassToggle () {
            this.audioBypass = !this.audioBypass
            this.nodeVoiceFilter.bypass(this.audioBypass)
        },
        audioRecordingToggle () {
            this.audioRecording = !this.audioRecording
            if (this.audioRecording) {
                /*  start recording  */
                this.recorder = new MediaRecorder(this.microStreamFiltered, {
                    mimeType: "audio/webm; codecs=\"opus\"",
                    audioBitsPerSecond: 128000
                })
                this.audioBlob = null
                this.audioBlobChunks = []
                this.recorder.addEventListener("dataavailable", (event) => {
                    this.audioBlobChunks.push(event.data)
                })
                this.recorder.start()
            }
            else {
                /*  stop recording  */
                this.recorder.addEventListener("stop", (event) => {
                    this.audioBlob = new Blob(this.audioBlobChunks,
                        { "type" : "audio/webm; codecs=\"opus\"" })
                })
                this.recorder.stop()
            }
        },
        audioPlayingToggle () {
            this.audioPlaying = !this.audioPlaying
            if (this.audioPlaying) {
                /*  start playing  */
                this.$refs.speakerStream.src = URL.createObjectURL(this.audioBlob)
                this.$refs.speakerStream.addEventListener("paused", (event) => {
                    this.audioPlaying = false
                })
                this.$refs.speakerStream.addEventListener("ended", (event) => {
                    this.audioPlaying = false
                })
                this.$refs.speakerStream.play()
            }
            else {
                /*  stop playing  */
                this.$refs.speakerStream.pause()
                // this.audioElement.pause()
            }
        },
        speakerMuteToggle () {
            this.speakerMuted = !this.speakerMuted
            if (this.speakerContext !== null) {
                this.speakerContext.resume().then(() => {
                    console.log("ENABLED")
                })
            }
        },
        inputTypeToggle () {
            this.inputTypePos = (this.inputTypePos + 1) % this.inputTypeList.length
            this.inputType = this.inputTypeList[this.inputTypePos]
        },
        microMuteToggle () {
            this.microMuted = !this.microMuted
        },
        async setup () {
            this.microStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl:  false
                },
                video: false
            })

            /*  create audio graph  */
            const ac = new AudioContext({
                latencyHint: "interactive"
            })

            const mic   = ac.createMediaStreamSource(this.microStream)
            const white = new AudioNodeSuite.AudioNodeNoise(ac, { type: "white" })
            const pink  = new AudioNodeSuite.AudioNodeNoise(ac, { type: "pink" })
            const dst = ac.createMediaStreamDestination()
            this.microStreamFiltered = dst.stream

            /*  create noise  */
            const sources = { mic, white, pink }
            const input = new AudioNodeSuite.AudioNodeGain(ac)
            this.$watch("inputType", (newType, oldType) => {
                console.log(newType, oldType)
                sources[oldType].disconnect(input)
                sources[newType].connect(input)
            })
            mic.connect(input)

            /*  create amplitude filter #1 (V)  */
            const amplitude1 = new AudioNodeSuite.AudioNodeAmplitude(ac, {
                horizontal: true
            })
            amplitude1.draw(this.$refs.canvasA1)

            /*  create spectrum filter #1  */
            const spectrum1 = new AudioNodeSuite.AudioNodeSpectrum(ac, {
                colorBackground:       "#330000",
                colorBars:             "#ff0000",
                colorAvg:              "#ffffff",
                colorLayers:           "#660000",
                colorSlices:           "#440000"
            })
            spectrum1.draw(this.$refs.canvas1)

            /*  create voice filtering chain  */
            const voicefilter = new AudioNodeSuite.AudioNodeVoice(ac)
            this.nodeVoiceFilter = voicefilter

            /*  create amplitude filter #2  */
            const amplitude2 = new AudioNodeSuite.AudioNodeAmplitude(ac, {
                horizontal: true
            })
            amplitude2.draw(this.$refs.canvasA2)

            /*  create spectrum filter #2  */
            const spectrum2 = new AudioNodeSuite.AudioNodeSpectrum(ac, {
                colorBackground:       "#003300",
                colorBars:             "#00ff00",
                colorAvg:              "#ffffff",
                colorLayers:           "#006600",
                colorSlices:           "#004400"
            })
            spectrum2.draw(this.$refs.canvas2)

            /*  connect the audio nodes to a graph  */
            input.connect(amplitude1)
            input.connect(spectrum1)
            input.connect(voicefilter)
            voicefilter.connect(amplitude2)
            voicefilter.connect(spectrum2)
            voicefilter.connect(dst)
        }
    },
    mounted () {
        this.setup()
        console.log("Started up")
    }
}
</script>

