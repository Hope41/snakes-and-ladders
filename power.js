'use strict'
function powerIncludes(str) {
    for (let i = 0; i < hero.power_past.length; i ++)
        if (hero.power_past[i].type == str)
            return {state: true, i}
    return {state: false, i: 0}
}
class Power {
    constructor(x, y, dir, type, speed_y = -random(.05, .1, 0)) {
        this.x = x
        this.y = y

        this.dir = dir
        this.width = .3
        this.height = .3
        this.speed_x = dir / 10
        this.speed_y = speed_y

        this.damping = 1
        this.momentum = .9

        this.x = x - this.width / 2
        this.y = y - this.height

        this.spin_offset = random(0, 100, 0)
        this.time = 0

        this.wake = 0
        this.ready = .7

        this.spark_timer = 3
        this.spark = 0

        this.type = type
    }

    collect() {
        hero.power_past.push({...hero.powers[this.type]})
        const last = hero.power_past.length - 1
        hero.power_past[last].do_cancel = false

        const goal = hero.power_past[last]

        for (let i = 0; i < last; i ++) {
            const item = hero.power_past[i]
            if (item.type == goal.type) hero.power_past.splice(i, 1)
        }
        talk(hero.powers[this.type].type, 1)

        for (let i = 0; i < 20; i ++) {
            const size = random(.09, .12, 0)
            game.particles.push(
                new Cloud({
                    x: this.x + random(0, this.width, 0),
                    y: this.y + random(0, this.height, 0),
                    width: size,
                    height: size,
                    grow: .96,
                    speed_x: random(-.3, .3, 0),
                    speed_y: random(-.3, .3, 0),
                    momentum: .7,
                    fade: .09,
                    gravity: 0,
                    fill: [...randomColor(),1],
                    stroke: [0,0,0,0]
                })
            )
        }

        this.kill = true
    }

    makeSpark() {
        this.spark --
        if (this.spark < 0) {
            for (let i = 0; i < 2; i ++) {
                const size = random(.05, .1, 0)
                game.particles.push(
                    new Cloud({
                        x: this.x + random(0, this.width, 0),
                        y: this.y + random(0, this.height, 0),
                        width: size,
                        height: size,
                        grow: .96,
                        speed_x: random(-.125, .125, 0),
                        speed_y: random(-.125, .125, 0),
                        momentum: .7,
                        fade: .05,
                        gravity: 0,
                        fill: [...randomColor(),1],
                        stroke: [0,0,0,0]
                    })
                )
            }

            this.spark = this.spark_timer
        }
    }

    update() {
        this.makeSpark()

        this.time += .1

        if (this.wake < 1) this.wake += .02
        else this.wake = 1

        this.x += this.speed_x / this.damping
        this.y += this.speed_y

        this.speed_x *= this.momentum
        this.speed_y *= this.momentum

        this.draw()
    }

    draw() {
        const type = hero.powers[this.type].type
        if (type == 'health') {
            this.y += Math.sin(this.time) * .002

            const half = this.width / 2
            const data = [
                this.x, this.y + half / 2,
                this.x + half, this.y + this.height,
                this.x + this.width, this.y + half / 2,
                this.x + half * 1.5, this.y,
                this.x + half, this.y + half / 2,
                this.x + half / 2, this.y,
                this.x, this.y + half / 2
            ]

            ctx.fillStyle = rgb(0, 187, 0, this.wake)
            lineFill(data)
            ctx.fillStyle = rgb(0, 34, 0, this.wake)
            line(data, .02)
        }
        if (type == 'shield') {
            this.y += Math.sin(this.time) * .002

            const angle = this.time + Math.sin(this.time * 3) * .2
            const bar_thickness = .04
            const ring_thickness = .05
            ctx.strokeStyle = rgb(0, 0, 200, this.wake)
            ctx.fillStyle = rgb(0, 0, 200, this.wake)

            // CIRCLE
            const pos = realPos(this.x, this.y, this.width, this.height)
            ctx.lineWidth = ring_thickness * scale
            ctx.beginPath()
            ctx.arc(
                pos.x + pos.w / 2,
                pos.y + pos.h / 2,
                pos.w / 2, 0, 7
            )
            ctx.stroke()

            // BARS
            ctx.save()
            const real = realPos(this.x + this.width / 2, this.y + this.height / 2)
            ctx.translate(real.x, real.y)
            ctx.rotate(angle)
            rotFillRect(-this.width / 2, -bar_thickness / 2, this.width, bar_thickness)
            rotFillRect(-bar_thickness / 2, -this.height / 2, bar_thickness, this.height)
            ctx.restore()
        }
        if (type == 'super pound') {
            const blob = (offset = 0) => {
                return Math.sin(this.time + offset) * .03
            }

            const top = blob()
            const mid = blob(1)
            const bot = blob(2)

            const out = this.width / 4
            const data = [
                this.x + out, this.y + top,
                this.x + out, this.y + this.height / 2 + mid,
                this.x, this.y + this.height / 2 + mid,

                this.x + this.width / 2, this.y + this.height + bot,

                this.x + this.width, this.y + this.height / 2 + mid,
                this.x + this.width - out, this.y + this.height / 2 + mid,
                this.x + this.width - out, this.y + top,
                this.x + out, this.y + top
            ]

            ctx.fillStyle = rgb(100, 230, 120, this.wake)
            lineFill(data)
            ctx.fillStyle = rgb(0, 0, 0, this.wake * .6)
            line(data, .02)
        }
    }
}