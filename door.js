'use strict'
class Door {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.width = .7
        this.height = 1

        this._width = this.width
        this.do_open = 0
        this.slam = 0
        this.state = 'closed'
    }

    open() {
        this.do_open ++

        let progress = Math.cos((this.do_open / 10) + 1)
        if (progress > .5) progress = .5
        if (progress < -.5) progress = -.5

        this._width = progress * this.width * 2
        if (progress <= -.5) this.state = 'open'
        if (progress >= .5 && this.state == 'open') {
            if (!this.slam) cam.boom(15, .07, .07)
            this.slam ++
            if (this.slam > 20) game.nextLevel()
        }
    }

    update() {
        if (this.do_open) this.open()

        this.draw()
    }

    draw() {
        const HANDLE = .14
        const PLANKS = 5

        ctx.fillStyle = '#000'
        fillRect(this.x, this.y, this.width, this.height)

        for (let i = 0; i < PLANKS; i ++) {
            const grade = Math.sin(Math.tan(i * 5) * 2) * 5
            ctx.fillStyle = rgb(
                150 - grade,
                90 - grade,
                40 - grade
            )
            fillRect(
                this.x + i * (this._width / PLANKS),
                this.y,
                this._width / PLANKS,
                this.height
            )
        }

        ctx.fillStyle = '#333'
        fillRect(
            this.x + this._width - HANDLE / .75,
            this.y + this.height / 2 - HANDLE / 2,
            HANDLE,
            HANDLE
        )
    }
}