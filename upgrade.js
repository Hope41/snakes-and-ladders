'use strict'
function upgradeIncludes(str) {
    for (let i = 0; i < hero.upgrade_past.length; i ++)
        if (hero.upgrade_past[i].type == str)
            return {state: true, i}
    return {state: false, i: 0}
}

class Upgrade {
    constructor(x, y) {
        this.width = .3
        this.height = .3

        this.x = x - this.width / 2
        this.y = y

        this.spark_timer = 3
        this.spark = 0

        this.spin_offset = 0
        this.time = 0
    }

    collect() {
        if (!this.kill) game.upgrades_collected ++

        if (hero.upgrade_number < hero.upgrades.length - 1) {
            hero.upgrade_number ++
            hero.upgrade_past.push(hero.upgrades[hero.upgrade_number])

            for (let i = 0; i < hero.upgrade_past.length; i ++) {
                const item = hero.upgrade_past[i]
                const goal = hero.upgrade_past[hero.upgrade_past.length - 1]
    
                if (item.perm != true && item.perm == goal.type)
                    hero.upgrade_past.splice(i, 1)
            }

            hero.upgradeSort()
        }
        talk(hero.upgrades[hero.upgrade_number].type, 1)

        for (let i = 0; i < 10; i ++) {
            const size = random(.05, .1, 0)
            game.particles.push(
                new Cloud({
                    x: this.x + random(0, this.width, 0),
                    y: this.y + random(0, this.height, 0),
                    width: size,
                    height: size,
                    speed_x: random(-.125, .125, 0),
                    speed_y: random(-.125, .125, 0),
                    momentum: .8,
                    fade: .01,
                    gravity: 0,
                    fill: [0,50,random(200, 250),1],
                    stroke: [0,0,0,0]
                })
            )
        }

        this.kill = true
    }

    update() {
        this.time += .1
        this.spin_offset += .02
        this.spark --

        if (this.spark <= 0) {
            const size = random(.05, .1, 0)
            game.particles.push(
                new Cloud({
                    x: this.x + random(0, this.width, 0),
                    y: this.y + random(0, this.height, 0),
                    width: random(.05, .1, 0),
                    height: random(.05, .1, 0),
                    speed_x: random(-this.width / 3, this.width / 3, 0),
                    speed_y: random(-this.height / 3, this.height / 3, 0),
                    momentum: .75,
                    fade: .05,
                    fade_time: 5,
                    gravity: 0,
                    fill: [0,random(50, 200),80,1],
                    stroke: [0,0,0,0]
                })
            )

            this.spark = this.spark_timer
        }

        this.y += Math.sin(this.time) * .01

        this.draw()
    }

    draw() {
        const spin_sin = Math.sin(this.spin_offset) * this.width
        const spin_cos = Math.cos(this.spin_offset) * this.width
        const offset = this.width / 2 + this.x - (spin_sin + spin_cos) / 2

        if (spin_cos < 0) {
            ctx.fillStyle = '#060'
            fillRect(offset, this.y, spin_cos, this.height)
        }
        else {
            ctx.fillStyle = '#060'
            fillRect(offset + spin_sin, this.y, spin_cos, this.height)
        }
        if (spin_sin > 0) {
            ctx.fillStyle = '#0f0'
            fillRect(offset, this.y, spin_sin, this.height)
        }
        else {
            ctx.fillStyle = '#0f0'
            fillRect(offset + spin_cos, this.y, spin_sin, this.height)
        }
    }
}