'use strict'
class Talk {
    constructor() {
        this.active = false
        this.queue = []

        // chat box data
        this.color = []
        this.bg_color = []
        this.offset_x = 0
        this.offset_y = 0
        this.set_cam = {}
        this.speaker = {}
        this.speech = ''
        this.lines = []

        this.font = 0
    }

    setChatBox() {
        this.font = scale / 3
        ctx.font = this.font + 'px sans-serif'

        const words = this.speech.split(' ')
        this.lines = ['']

        this.box = {
            width: this.font * 10,
            height: this.font * .7
        }

        for (let i = 0; i < words.length; i++) {
            const add = words[i] + ' '
            if (ctx.measureText(this.lines[this.lines.length - 1] + add).width > this.box.width)
                this.lines.push(add)
            else this.lines[this.lines.length - 1] += add
        }
    }

    continueChat() {
        key.up = false
        key.down = false
        key.left = false
        key.right = false

        if (!this.queue.length) {
            cam.goal = {...cam.default}
            this.active = false
            return
        }
        
        const dic = this.queue[0]
        this.offset_x = dic.offset_x
        this.offset_y = dic.offset_y
        this.speech = dic.speech
        this.speaker = dic.speaker
        this.color = dic.color
        this.bg_color = dic.bg_color
        cam.goal = {...dic.set_cam}

        this.queue.splice(0, 1)

        this.setChatBox()
    }

    chat(speaker, speech) {
        let offset_x = 0
        let offset_y = 0
        let color = [0,0,0,0]
        let bg_color = []
        let set_cam = {
            type: cam.default.type,
            x: cam.default.x,
            y: cam.default.y
        }

        if (speaker == 'hero') {
            offset_x = hero.width / 2
            bg_color = [238,221,170]
        }
        else if (speaker == 'friend') {
            offset_x = game.friend.width / 2
            bg_color = [220,200,100]

            set_cam.type = game.friend
            set_cam.x = game.friend.width / 2
            set_cam.y = 0
        }
        else if (speaker == 'orb') {
            offset_x = game.orb.width / 2
            offset_y = -game.orb.size
            color = [255,255,255,0]
            bg_color = [0,0,0]

            set_cam.type = game.orb
            set_cam.x = game.orb.width / 2
            set_cam.y = -game.orb.size
        }

        for (let i = 0; i < speech.length; i ++)
            this.queue.push({speaker, speech: speech[i], offset_x, offset_y, color, bg_color, set_cam})

        if (!this.active) {
            this.continueChat()
            this.active = true
        }
    }

    update() {
        this.color[3] += .025

        if (this.color[3] >= .9) {
            if (key.up || key.left || key.down || key.right) {
                this.color[3] = 0
                this.continueChat()
            }
        }

        this.draw()
    }

    draw() {
        const speaker_x = cam.goal.type.x
        const speaker_y = cam.goal.type.y

        const pad = .1
        const line_pad = .2

        const line_height = this.box.height / scale
        const line_whole = line_height + line_pad

        const width = (this.box.width / scale) + pad * 2
        const height = (line_whole * this.lines.length) + pad * 2 - line_pad

        // sizes of the pointy thing that's under the box
        const point_width = .1
        const point_height = .1
        // how far up the box hovers
        const gap_up = .05

        // the exact coordinates of the pointy point's point
        const base_x = speaker_x + this.offset_x
        const base_y = speaker_y + this.offset_y - gap_up
        // the top left corner of the box
        let x = base_x - width / 2
        let y = base_y - height - point_height

        const outline = .04
        const point_y = y + height
        const data = [
            base_x - point_width / 2, point_y,
            x, y + height,
            x, y,
            x + width, y,
            x + width, y + height,
            base_x + point_width / 2, point_y,
            base_x, point_y + point_height,
            base_x - point_width / 2, point_y
        ]

        // STROKE
        ctx.fillStyle = rgb(this.color[0], this.color[1], this.color[2])
        line(data, outline)
        // FILL
        ctx.fillStyle = rgb(...this.bg_color)
        lineFill(data)

        // TEXT
        ctx.fillStyle = rgb(...this.color)
        ctx.font = this.font + 'px sans-serif'
        for (let i = 0; i < this.lines.length; i++) {
            const pad_x = x + pad
            const pad_y = y + pad
            const text_y = line_height + i * line_whole
            fillText(this.lines[i], pad_x, pad_y + text_y)
        }
    }
}