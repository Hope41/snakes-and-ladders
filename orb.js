'use strict'
class Orb extends Base {
    constructor(x, y) {
        super(x, y)

        this.health = 20

        this.momentum = .99
        this.damping = 200
        this.gravity = .01

        this.size = .25

        this.width = this.size * 2
        this.height = this.size
        this.do_hit = 0
        this.do_kill = 0
        this.kill = 0

        this.flash = 100

        this.timer = {
            move_range: 300,
            move_time: 150,
            move: 300,

            fire_range: 60,
            fire: 60
        }

        this.y_max = 100
        this.x_max = 100

        this.walk = 0
        this.prev = {x: 0, y: 0}
    }

    collision() {
        const x = this.x
        const y = this.y
        const arr = [
            {x: Math.floor(x), y: Math.floor(y), width: 1, height: 1},
            {x: Math.ceil(x), y: Math.floor(y), width: 1, height: 1},
            {x: Math.floor(x), y: Math.ceil(y), width: 1, height: 1},
            {x: Math.ceil(x), y: Math.ceil(y), width: 1, height: 1}
        ]

        let side = false
        for (let i = 0; i < arr.length; i ++) {
            const obj = arr[i]

            if (obj.x >= 0 && obj.x < map.width &&
                obj.y >= 0 && obj.y < map.height) {

                if (collide(this, obj)) {
                    if (inItem(map.array[posToIndex(obj.x, obj.y, map.width)], 0) == BLOCK) {
                        const overlap = merge(this, obj, this.gravity)

                        if (overlap.x) {
                            this.x -= overlap.x
                            this.speed_x *= -1
                            side = Math.abs(overlap.x)
                        }
                        else {
                            this.y -= overlap.y
                            this.speed_y = 0
                            if (overlap.y > 0) {
                                if (this.in_air) cam.boom(10, .2, .2)
                                this.in_air = false
                            }
                        }
                    }
                }
            }
        }

        if (side) {
            const jump = .01 / side
            this.jump(jump > .1 ? .1 : jump)
        }

        super.update()
    }

    die() {
        if (!this.do_kill) {
            this.speed_x = 0
            this.speed_y = 0
        }
        this.do_kill ++

        this.speed_y += this.gravity

        this.collision()

        if (this.do_kill == 150) {
            cam.boom(20, .2, .2)
            for (let i = 0; i < 50; i ++) {
                const gray = random(20, 50)
                const red = random(50, 220)
                if (random(0, 2)) game.particles.push(
                    new Cloud({
                        x: this.x + this.width / 2,
                        y: this.y,
                        width: random(.3, 1.3, 0),
                        height: random(.3, 1.3, 0),
                        speed_x: random(-.5, .6, 0),
                        speed_y: random(-.6, .6, 0),
                        momentum: .95,
                        fade: .01,
                        gravity: 0,
                        fill: [red,random(0,red-50),0,.7],
                        stroke: [0,0,0,0]
                    }))
                else game.particles.push(
                    new Cloud({
                        x: this.x + this.width / 2,
                        y: this.y,
                        width: random(.8, 1.5, 0),
                        height: random(.8, 1.5, 0),
                        speed_x: random(-.2, .2, 0),
                        speed_y: random(-.2, .2, 0),
                        momentum: .95,
                        fade: .003,
                        gravity: 0,
                        fill: [gray,gray,gray,.6],
                        stroke: [0,0,0,0]
                    }))
            }

            makeFriend(this.x, this.y, {x: Math.sign(hero.x - this.x) * .5, y: -.5})

            this.kill = true
        }
    }

    getHit() {
        if (!this.do_hit) {
            this.health --

            const overlap = merge(this, hero, 1)

            if (overlap.x) this.speed_x = Math.abs(overlap.x * 10) * Math.sign(hero.speed_x)
            else this.speed_x = Math.sign(hero.speed_x) * random(.1, .3, 0)
            this.jump(Math.abs(overlap.x + overlap.y) + random(.1, .4, 0))

            for (let i = 0; i < 20; i ++) {
                game.particles.push(
                    new Cloud({
                        x: this.x + random(0, this.width, 0),
                        y: this.y + random(0, this.height, 0),
                        width: random(.01, .09, 0),
                        height: random(.01, .09, 0),
                        speed_x: random(-.3, .3, 0),
                        speed_y: random(-.3, .3, 0),
                        momentum: .9,
                        fade: .01,
                        gravity: 0,
                        fill: [200,0,0,1],
                        stroke: [0,0,0,0]
                    })
                )
            }

            if (this.health <= 0) {
                this.die()

                this.do_hit = 0
                return
            }

            if (hero.health < 3) game.powers.push(new Power(this.x, this.y, 0, 0, 0))
        }
        this.do_hit ++

        if (this.do_hit > this.flash) this.do_hit = 0

        super.update()
    }

    touch(pound) {
        if (this.do_kill) return
        if (!pound) return 'loss'
        return 'hit'
    }

    quickUpdate(segments, move) {
        for (let i = 0; i < segments; i ++) {
            this.speed_x *= this.momentum
            this.x += this.speed_x / segments
            this.y += this.speed_y / segments
            this.speed_y += this.gravity

            this.walk += this.speed_x * 4

            if (move && !this.do_hit) {
                this.timer.move --

                if (this.timer.move < 0) {
                    this.timer.fire = this.timer.fire_range

                    if (!this.in_air) {
                        this.speed_x += this.dir / this.damping
                        this.dir = Math.sign(hero.x - this.x)

                        if (this.timer.move < -this.timer.move_time)
                            this.timer.move = this.timer.move_range
                    }
                }

                else {
                    this.timer.fire --
                    if (this.timer.fire < 0) {
                        const dis = hero.x - this.x
                        const dir = Math.sign(dis) || -1

                        let speed = Math.abs(dis / 60)
                        speed = speed > .3 ? .3 : speed < .1 ? .1 : speed

                        game.shots.push(new Fire(
                            this.x + this.width / 2 + this.speed_x * 5, this.y,
                            dir * speed,
                            random(-.2, -.1, 0)
                        ))
                        this.timer.fire = this.timer.fire_range
                    }
                }
            }

            super.update()
            this.collision()
        }
    }

    update() {
        if (this.do_kill) {
            this.die()
            return
        }

        const curr = {x: this.x + this.width / 2, y: this.y}
        const prev = {x: curr.x - this.speed_x, y: curr.y - this.speed_y}

        const dis_x = prev.x - curr.x
        const dis_y = prev.y - curr.y
        const dis = Math.sqrt(dis_x * dis_x + dis_y * dis_y)
        const segments = Math.ceil(dis * 4) || 1

        this.quickUpdate(segments, spoken.orb3)

        if (this.do_hit) this.getHit()
    }

    draw() {
        const real = realPos(this.x + this.width / 2, this.y)

        const div = this.do_hit ? random(1, 40) : 25
        ctx.fillStyle = '#f004'
        for (let i = 1; i < 4; i ++) {
            ctx.beginPath()
            ctx.arc(real.x, real.y, (this.size + i / div) * scale, 0, 7)
            ctx.fill()
        }

        ctx.fillStyle = this.do_hit ? rgb(...randomColor()) : rgb(34, 34, 34)
        ctx.beginPath()
        ctx.arc(real.x, real.y, this.size * scale, 0, 7)
        ctx.fill()

        const reflect = this.size / 1.5
        const size = .05
        ctx.fillStyle = '#fff5'
        fillRect(
            this.x + this.width / 2 + Math.cos(this.walk) * reflect - size / 2, 
            this.y + Math.sin(this.walk) * reflect - size / 2, size, size
        )
    }
}

class Fire extends Base {
    constructor(x, y, speed_x, speed_y) {
        super(x, y)

        this.speed_x = speed_x
        this.speed_y = speed_y

        this.momentum = 1
        this.damping = 10

        this.width = .2
        this.height = .2

        this.x -= this.width / 2
        this.y -= this.height / 2

        this.gravity = .005
        this.range = .2
    }

    die() {
        if (!this.do_kill) {
            cam.boom(15, .1, .1)
            for (let i = 0; i < 20; i ++)
                game.particles.push(
                    new Cloud({
                        x: this.x + random(0, this.width, 0),
                        y: this.y + random(0, this.height, 0),
                        width: random(.05, .4, 0),
                        height: random(.05, .4, 0),
                        speed_x: random(-this.speed_x / 2, this.speed_x / 7, 0),
                        speed_y: random(-this.speed_y / 2, this.speed_y / 7, 0),
                        momentum: .94,
                        fade: .005,
                        gravity: 0,
                        fill: [random(90,200),random(30,90),random(0,30),.5],
                        stroke: [0,0,0,0]
                    })
                )
            this.range = 1
        }

        this.do_kill ++
        this.kill = true
    }

    collide() {
        const arr = [
            {x: Math.floor(this.x), y: Math.floor(this.y), width: 1, height: 1},
            {x: Math.ceil(this.x), y: Math.floor(this.y), width: 1, height: 1},
            {x: Math.floor(this.x), y: Math.ceil(this.y), width: 1, height: 1},
            {x: Math.ceil(this.x), y: Math.ceil(this.y), width: 1, height: 1}
        ]

        let touching = false
        for (let i = 0; i < arr.length; i ++) {
            const obj = arr[i]

            if (obj.x >= 0 && obj.x < map.width &&
                obj.y >= 0 && obj.y < map.height) {

                if (collide(this, obj)) {
                    // COLLIDE
                    if (inItem(map.array[obj.x + obj.y * map.width], 0) == BLOCK) {
                        const overlap = merge(this, obj)
                        touching = {...overlap}
                    }
                }
            }
        }

        return touching
    }

    update() {
        this.y += this.speed_y
        this.x += this.speed_x

        super.update()

        this.speed_y += this.gravity

        if (this.do_kill || this.collide()) this.die()

        const obj = {
            x: this.x + this.width / 2 - this.range / 2,
            y: this.y + this.height / 2 - this.range / 2,
            width: this.range,
            height: this.range
        }

        if (collide(obj, hero)) {
            cam.boom(20, .1, .1)
            hero.recover()
        }
    }
    
    draw() {
        if (random(0, 2)) {
            const red = random(50, 220)
            game.particles.push(
                new Cloud({
                    x: this.x + random(0, this.width, 0),
                    y: this.y + random(0, this.height, 0),
                    width: random(.03, .1, 0),
                    height: random(.03, .1, 0),
                    speed_x: random(-.02, .02, 0),
                    speed_y: random(-.02, .02, 0),
                    momentum: .94,
                    fade: .005,
                    gravity: 0,
                    fill: [red,random(0,red-50),0,.7],
                    stroke: [0,0,0,0]
                })
            )
        }
        else {
            game.particles.push(
                new Cloud({
                    x: this.x + random(0, this.width, 0),
                    y: this.y + random(0, this.height, 0),
                    width: random(.1, .2, 0),
                    height: random(.1, .2, 0),
                    grow: 1.02,
                    speed_x: random(-.02, .02, 0),
                    speed_y: random(-.02, .02, 0),
                    momentum: .94,
                    fade: .005,
                    gravity: 0,
                    fill: [50,50,50,.5],
                    stroke: [0,0,0,0]
                })
            )
        }

        game.particles.push(
            new Cloud({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                width: this.width,
                height: this.height,
                speed_x: 0,
                speed_y: 0,
                momentum: 1,
                fade: random(.03, .04, 0),
                gravity: 0,
                fill: [random(100,255),random(0,90),0,1],
                stroke: [0,0,0,0]
            })
        )

        ctx.fillStyle = '#422'
        fillRect(this.x, this.y, this.width, this.height)
    }
}