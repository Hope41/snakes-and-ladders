'use strict'
class Point {
    constructor(x, y) {
        this.width = .2
        this.height = .25

        this.x = x - this.width / 2
        this.y = y

        this.kill = false
        this.offset = random(0, 9, 0)
        this.time = 0
    }

    collect() {
        if (!this.kill) game.points_collected ++

        for (let i = 0; i < 10; i ++) {
            const size = random(.05, .1, 0)
            game.particles.push(
                new Cloud({
                    x: this.x + random(0, this.width, 0),
                    y: this.y + random(0, this.height, 0),
                    width: size,
                    height: size,
                    speed_x: random(-.1, .1, 0),
                    speed_y: random(-.1, .1, 0),
                    momentum: .8,
                    fade: .05,
                    gravity: 0,
                    fill: [200,150,0,1],
                    stroke: [0,0,0,0]
                })
            )
        }

        this.kill = true
    }

    update() {
        this.time += .4
        this.y += Math.sin(this.time + this.offset) * .02

        this.draw()
    }

    draw() {
        const spin = Math.sin(this.time / 5 + this.offset) * this.width

        const reflect_width = spin / 5
        const reflect_height = this.height / 2
        const offset_x = this.width / 2 + this.x - spin / 2

        if (spin > 0) {
            ctx.fillStyle = '#ff0'
            fillRect(offset_x, this.y, spin, this.height)

            ctx.fillStyle = '#0004'
            fillRect(offset_x + spin / 3 - reflect_width, this.y + this.height / 4, reflect_width, reflect_height)
        }

        else {
            ctx.fillStyle = '#fd3'
            fillRect(offset_x, this.y, spin, this.height)
        }

        ctx.lineWidth = .02 * scale
        ctx.strokeStyle = '#550'
        fillRect(offset_x, this.y, spin, this.height, true)
    }
}