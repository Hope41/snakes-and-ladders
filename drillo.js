'use strict'
class Drillo extends Base {
    constructor() {
        super()

        // coordinates
        this.width = .5
        this.height = .7

        // scale-wall physics
        this.scale_gravity = .02
        this.scale_momentum = .93
        this.scale_damping = 140
        this.scale_force_x = .05
        this.scale_force_y = .2

        // normal physics
        this.normal_gravity = .02
        this.normal_momentum = .8
        this.normal_damping = 30
        this.real_in_air = false

        // other
        this.health = 5
        this.color = '#000'

        // upgrades
        this.pound = {}
        this.point = {}
        this.jet = {}

        this.upgrades = [
            {type: 'none'},
            {type: 'point', perm: true},
            {type: 'pound', perm: 'jet',

            drop: false,
            force: 1,
            shake: .13,
            time: 20,
            reset: () => {
                this.upgrade_past[this.pound.i].drop = false
                key.down = false
            },
            puff: () => {
                cam.boom(
                    this.upgrade_past[this.pound.i].time,
                    this.upgrade_past[this.pound.i].shake,
                    this.upgrade_past[this.pound.i].shake
                )

                for (let i = 0; i < 20; i ++) {
                    const size = random(.05, .1, 0)
                    game.particles.push(
                        new Cloud({
                            x: this.x + random(0, this.width, 0),
                            y: this.y + this.height,
                            width: size,
                            height: size,
                            speed_x: random(-.3, .3, 0),
                            speed_y: random(-.08, 0, 0),
                            momentum: {x: .8, y: .93},
                            fade: .03,
                            gravity: 0,
                            fill: [0,0,50,1],
                            stroke: [0,0,0,0]
                        })
                    )
                }
            }},
            {type: 'jet', perm: true,
            // fly
            power: .1,
            smoke: 0,
            smoke_time: 2,
            jet: false,
            jet_x: 0,
            jet_y: 0,
            jet_width: .15,
            jet_height: .2,
            // pound
            force: 1,
            shake: .2,
            time: 20,
            drop: false,
            reset: () => {
                this.upgrade_past[this.jet.i].drop = false
                key.down = false
            },
            puff: () => {
                cam.boom(
                    this.upgrade_past[this.jet.i].time,
                    this.upgrade_past[this.jet.i].shake,
                    this.upgrade_past[this.jet.i].shake
                )

                for (let i = 0; i < 20; i ++) {
                    const size = random(.07, .15, 0)
                    game.particles.push(
                        new Cloud({
                            x: this.x + random(0, this.width, 0),
                            y: this.y + this.height,
                            width: size,
                            height: size,
                            speed_x: random(-.375, .375, 0),
                            speed_y: random(-.08, 0, 0),
                            momentum: {x: .8, y: .93},
                            fade: .01,
                            gravity: 0,
                            fill: [200,0,0,.5],
                            stroke: [0,0,0,.2]
                        })
                    )
                }
            }}
        ]
        this.upgrade_number = 0
        this.upgrade_past = [this.upgrades[0]]
        // powers
        this.powers = [
            {type: 'health',
            cancel: i => {
                this.power_past.splice(i, 1)
            }},

            {type: 'shield',
            momentum: .8,
            damping: 7,
            time: 0,
            ring: 0,
            ring_speed: 0,
            timer: 650,
            cancel: i => {
                if (this.power_past[i].ring > 0) this.power_past[i].ring -= .02
                else this.power_past.splice(i, 1)
            }},

            {type: 'super pound',
            drop: false,
            force: 1,
            shake: .13,
            time: 20,
            ring: .5,
            ring_speed: 0,
            x: 0,
            y: 0,
            alpha: .5,
            cancel: i => {
                key.down = false
                this.power_past.splice(i, 1)
            },
            puff: () => {
                cam.boom(70, .4, .15)

                for (let i = 0; i < 50; i ++) {
                    const size = random(.05, .1, 0)
                    game.particles.push(
                        new Cloud({
                            x: this.x + random(0, this.width, 0),
                            y: this.y + this.height,
                            width: size,
                            height: size,
                            speed_x: random(-.5, .5, 0),
                            speed_y: random(-.008, 0, 0),
                            momentum: {x: .8, y: .93},
                            fade: .03,
                            gravity: 0,
                            fill: [255,0,50,1],
                            stroke: [0,0,0,0]
                        })
                    )
                }
            }}
        ]
        this.power_past = [{type: 'none'}]

        this.set()
    }

    cancelPower(i) {
        this.power_past[i].do_cancel = true
        this.power_past[i].cancel(i)
    }

    upgradeSort() {
        this.pound = upgradeIncludes('pound')
        this.point = upgradeIncludes('point')
        this.jet = upgradeIncludes('jet')
    }

    set() {
        this.x = 1
        this.y = 2 - this.height
        this.gravity = this.normal_gravity
        this.momentum = this.normal_momentum
        this.damping = this.normal_damping
        this.climb = false
        this.scale = 'none'
        this.climb_speed = .1
        this.do_kill = 0
        this.death = {
            head_y: 0,
            speed_y: 0
        }
        this.in_recovery = 0
        this.safe = true
        this.recover_timer = 100
        this.display = true
        this.do_exit = false
        this.exit_goal = 0
    }

    exit(item = 0) {
        // normalise variables
        if (!this.do_exit) {
            game.door.open()

            this.in_recovery = 0
            this.display = true
            this.scale = 'none'
            this.climb = false
            this.do_kill = 0
        }
        this.do_exit ++

        // animate
        if (item) this.exit_goal = item
        this.speed_x /= 1.1
        const distance = (this.walk % Math.PI + Math.PI) % Math.PI
        if (distance > 0) this.walk -= distance / 20
        if (this.exit_goal.state == 'open') this.display = false

        // centralise positions
        this.x += (this.exit_goal.x - this.x) / 3
        this.y += (this.exit_goal.y - this.y + 1 - this.height) / 3

        this.blockCollision()
        this.draw()
    }

    dust() {
        for (let i = 0; i < 2; i ++) {
            const size = random(.05, .1, 0)
            game.particles.push(
                new Cloud({
                    x: this.x + random(0, this.width, 0),
                    y: this.y + this.height - size / 2,
                    width: size,
                    height: size,
                    speed_x: random(-.1, .1, 0),
                    speed_y: random(-.01, 0, 0),
                    momentum: .7,
                    fade: .1,
                    gravity: 0,
                    fill: [0,0,0,1],
                    stroke: [0,0,0,0]
                })
            )
        }
    }

    recover() {
        if (!this.in_recovery) {
            this.health --
            this.safe = false
        }

        if (this.health < 1) {
            this.die()
            return
        }
        this.in_recovery ++

        if (this.in_recovery >= this.recover_timer) {
            this.in_recovery = 0
            this.safe = true
            this.display = true
            this.actorCollision()

            return
        }

        this.display = Math.floor(this.in_recovery / 4) % 2
    }

    die() {
        this.health = 0
        this.do_kill ++
        this.speed_y += this.gravity

        this.blockCollision()
        this.sortPowers()

        this.draw()

        if (this.do_kill > 100) game.reloadLevel()
    }

    blockCollision() {
        /* arr contains all the positions
        of the blocks that Drillo could be
        colliding with */

        const arr = [
            // top left
            {x: Math.floor(this.x), y: Math.floor(this.y), width: 1, height: 1},
            // top right
            {x: Math.ceil(this.x), y: Math.floor(this.y), width: 1, height: 1},
            // bottom left
            {x: Math.floor(this.x), y: Math.ceil(this.y), width: 1, height: 1},
            // bottom right
            {x: Math.ceil(this.x), y: Math.ceil(this.y), width: 1, height: 1}
        ]

        let colliding = false

        for (let i = 0; i < arr.length; i ++) {
            const obj = arr[i]

            if (obj.x >= 0 && obj.x < map.width &&
                obj.y >= 0 && obj.y < map.height) {

                if (collide(this, obj)) {
                    const norm_type = map.array[obj.x + obj.y * map.width]
                    const chat_type = map.chat_array[obj.x + obj.y * map.width]

                    // COLLIDE
                    if (inItem(chat_type) == CHAT_BOX) talk(inItem(chat_type, 1), 1)

                    if (inItem(norm_type) == BLOCK) {
                        const overlap = merge(
                            this, obj, this.gravity,
                            this.jet.state && this.upgrade_past[this.jet.i].jet ?
                            this.upgrade_past[this.jet.i].power + this.gravity : 0
                        )

                        if (overlap.x) {
                            this.x -= overlap.x
                            this.speed_x = 0

                            if (key.up) {
                                const dir = Math.sign(overlap.x)
                                this.speed_x = -this.scale_force_x * dir
                                this.speed_y = -this.scale_force_y

                                this.scale = dir > 0 ? 'right' : 'left'
                                this.gravity = this.scale_gravity
                                this.momentum = this.scale_momentum
                                this.damping = this.scale_damping

                                for (let i = 0; i < 5; i ++) {
                                    const size = random(.05, .1, 0)
                                    game.particles.push(
                                        new Cloud({
                                            x: this.x + (dir > 0 ? this.width : 0),
                                            y: this.y + random(0, this.height, 0),
                                            width: size,
                                            height: size,
                                            speed_x: random(0, .1 * -dir, 0),
                                            speed_y: random(-.01, 0, 0),
                                            momentum: .7,
                                            fade: .04,
                                            gravity: .005,
                                            fill: [0,0,0,.5],
                                            stroke: [0,0,0,0]
                                        })
                                    )
                                }
                            }
                        }
                        else {
                            colliding = true

                            this.stopScaling()
                            this.y -= overlap.y

                            if (this.speed_y > this.gravity * 2) this.dust()

                            if (this.in_recovery != 1) this.speed_y = 0
                            if (overlap.y > 0) this.in_air = false
                        }
                    }
                    else if (inItem(norm_type) == LADDER) this.climb = true
                }
            }
        }

        if (!colliding && this.speed_y > this.gravity) this.real_in_air = true
    }

    actorCollision() {
        // EFFECT COLLISION
        const hop = top => {
            this.speed_y = 0
            this.y = top - this.height
        }
        const attack = item => {
            hop(item.y)
            this.jump(.2)
            this.dust()
            if (this.climb) key.down = false
        }
        const enemyHurt = item => {
            if (!item.do_hit) {
                cam.boom(5, .1, .1)
                item.hit()
            }
        }
        const drilloHurt = () => {
            cam.boom(20, .1, .1)
            this.recover()
        }
        const shieldHurt = item => {
            for (let i = 0; i < 20; i ++) {
                const size = random(.05, .1, 0)
                game.particles.push(
                    new Cloud({
                        x: this.x + random(0, this.width, 0),
                        y: this.y + random(0, this.height, 0),
                        width: size,
                        height: size,
                        speed_x: random(-.1, .1, 0),
                        speed_y: random(-.1, .1, 0),
                        momentum: .9,
                        fade: .01,
                        gravity: 0,
                        fill: [255,50,0,1],
                        stroke: [0,0,0,0]
                    })
                )
            }
            
            item.jump(.1)
            item.health = 0
            enemyHurt(item)
        }
        const pound = (
            this.pound.state && this.upgrade_past[this.pound.i].drop ||
            this.jet.state && this.upgrade_past[this.jet.i].drop
        )
        const power = (
            this.pound.state ?
            this.upgrade_past[this.pound.i] :
            this.upgrade_past[this.jet.i]
        )

        const shield = powerIncludes('shield')

        let safe = true
        game.effects.forEach(item => {
            const state = item.collide(hero)
            if (state != undefined) {
                safe = false

                if (shield.state) {
                    if (state == 'hit') attack(item)
                    shieldHurt(item)
                }
                else {
                    if (pound) {
                        enemyHurt(item)
                        attack(item)
                        power.puff()
                        power.reset()
                    }
                    else {
                        if (state == 'hit') {
                            enemyHurt(item)
                            attack(item)
                        }
                        else if (state == 'loss') drilloHurt()
                    }
                }
            }
        })

        if (this.in_recovery && safe && this.speed_y < 0) this.safe = true

        // POINT COLLISION
        game.points.forEach(item => {if (collide(this, item)) item.collect()})

        // UPGRADE COLLISION
        game.upgrades.forEach(item => {if (collide(this, item)) item.collect()})

        // POWER COLLISION
        game.powers.forEach(item => {
            if (item.wake >= item.ready && collide(this, item))
                item.collect()
        })

        // ORB COLLISION
        if (game.orb && !game.orb.do_hit && collide(this, game.orb)) {
            const state = game.orb.touch(pound)

            if (state == 'hit') {
                game.orb.getHit()
                attack(game.orb)
            }
            else if (state == 'loss') drilloHurt()
        }

        // DOOR COLLISION
        if (!game.door.do_open && collide(this, game.door) && key.down) {
            if (game.points_collected + game.upgrades_collected >= game.points_max + game.upgrades_max)
                this.exit(game.door)
            else {
                talk('door')

                for (let i in key) key[i] = false
            }
        }
    }

    sortPowers() {
        for (let i = 0; i < this.power_past.length; i ++) {
            const pow = this.power_past[i]

            if (pow.do_cancel) pow.cancel(i)
            else {
                if (pow.type == 'health') {
                    this.health ++
                    this.cancelPower(i)
                }
                if (pow.type == 'shield') {
                    const ring_happy = .55 + Math.sin(pow.time / 5) * .03

                    pow.time ++
                    pow.ring_speed *= pow.momentum
                    pow.ring_speed -= pow.ring - ring_happy
                    pow.ring += pow.ring_speed / pow.damping

                    if (pow.time >= pow.timer) this.cancelPower(i)
                }
                if (pow.type == 'super pound' && !this.climb) {
                    const strength = 7

                    if (pow.drop == 'done') {
                        // Screen Colours
                        if (pow.ring < 3) {
                            if (pow.ring < 1.4) {
                                const gray = randomColor()[0]
                                screen.fadeIn(.7, .1, [gray, gray, gray], 4)
                            }
                            else screen.fadeIn(.7, .1, randomColor(), 10)
                        }
                        else screen.fadeOut(.01, randomColor(), 10)

                        // Boom ring
                        pow.ring_speed += .01
                        pow.ring += pow.ring_speed
                        pow.alpha -= .005

                        ctx.lineWidth = .03 * scale
                        ctx.strokeStyle = rgb(0, 0, 0, pow.alpha)

                        ctx.beginPath()
                        const scale_rand = (random(0, 50) ? 1 : random(2, 4, 0))

                        const real = realPos(
                            pow.x + this.width / 2,
                            pow.y + this.height / 2
                        )

                        ctx.arc(real.x, real.y, pow.ring * scale / scale_rand, 0, 7)
                        ctx.stroke()

                        // Cut-off Point
                        const biggest = cvs.width > cvs.height ? cvs.width : cvs.height
                        if (pow.ring > biggest / scale / 2) {
                            for (let i = 0; i < game.effects.length; i ++) {
                                const item = game.effects[i]
                                if (!item.do_kill) {
                                    item.health -= strength
                                    item.jump(.1)

                                    if (item.health <= 0) item.hit()
                                }
                            }

                            this.cancelPower(i)
                        }
                    }

                    if (key.down) {
                        if (this.real_in_air && pow.drop != 'done') {
                            pow.drop = true
                            this.speed_y = pow.force
                        }

                        if (pow.drop == true && this.speed_y <= 0) {
                            pow.puff()

                            pow.x = this.x
                            pow.y = this.y
                            pow.drop = 'done'
                        }
                    }

                    else if (pow.drop == true) pow.drop = false
                }
            }
        }
    }

    stopScaling() {
        if (this.scale) {
            this.scale = 'none'

            this.gravity = this.normal_gravity
            this.momentum = this.normal_momentum
            this.damping = this.normal_damping
        }
    }

    control() {
        if (key.left) {
            this.dir = -1
            if (this.scale == 'right') this.stopScaling()
        }
        if (key.right) {
            this.dir = 1
            if (this.scale == 'left') this.stopScaling()
        }

        if (key.up && key.down) key.up = false

        // climb ladders
        if (this.climb) {
            this.speed_y = 0

            if (key.up) this.in_air ? this.jump(.2) : this.speed_y = -this.climb_speed
            if (key.down) this.speed_y = this.climb_speed

            this.in_air = false
        }

        // jump
        else if (key.up && !this.in_air && this.scale == 'none' && !this.jet.state)
            this.jump(.2)

        // POUND GROUND UPGRADE
        if (this.pound.state && !this.climb) {
            const power = this.upgrade_past[this.pound.i]

            if (key.down) {
                if (this.real_in_air) {
                    power.drop = true
                    this.speed_y = power.force
                }

                if (power.drop && this.speed_y <= 0) {
                    power.puff()
                    power.reset()
                }
            }

            else if (power.drop) power.reset()
        }
        // JET PACK UPGRADE
        if (this.jet.state && !this.climb) {
            const power = this.upgrade_past[this.jet.i]

            if (key.down) {
                if (this.real_in_air) {
                    power.drop = true
                    this.speed_y = power.force
                }

                if (power.drop && this.speed_y <= 0) {
                    power.puff()
                    power.reset()
                }
            }
            else if (power.drop) power.reset()

            if (key.up) {
                power.jet = true
                this.in_air = false
                this.speed_y = -power.power - this.gravity
    
                power.smoke --
    
                if (power.smoke <= 0) {
                    const smoke = random(0, 5)
                    const size = random(.1, .13, 0)
                    game.particles.push(
                        new Cloud({
                            x: this.x + power.jet_x + power.jet_width / 2,
                            y: this.y + power.jet_y + power.jet_height / 2 + size / 2,
                            width: size,
                            height: size,
                            grow: 1.02,
                            speed_x: random(-.02, .02, 0),
                            speed_y: random(0, .05, 0),
                            momentum: .99,
                            fade: .02,
                            gravity: 0,
                            fill: smoke ? [0,0,0,.5] : [255,150,0,1],
                            stroke: [0,0,0,smoke&&1]
                        })
                    )
    
                    power.smoke = power.smoke_time
                }
            }

            else power.jet = false
        }
    
        // stop climbing a wall if there is no wall to climb!
        if (!key.up || (!key.left && !key.right))
            if (this.scale != 'none')
                this.stopScaling()
    }

    update() {
        super.update()

        this.real_in_air = this.in_air

        // go through door
        if (this.do_exit) {
            this.exit()
            return
        }

        // physics
        this.speed_x *= this.momentum
        this.y += this.speed_y
        this.x += this.speed_x

        // kill
        if (this.do_kill) {
            this.die()
            return
        }
        this.speed_x += this.dir / this.damping
        this.walk += this.speed_x * 2

        // griavity
        if (!this.climb) this.speed_y += this.gravity
        else {
            if (this.pound.state) this.upgrade_past[this.pound.i].drop = false 
            if (this.jet.state) this.upgrade_past[this.jet.i].drop = false 
        }

        // collide with ground
        this.dir = 0
        this.actorCollision()
        this.climb = false
        this.blockCollision()
        this.sortPowers()
        this.control()

        // flash on and off
        if (this.in_recovery) this.recover()

        this.draw()
    }

    draw() {
        const _shield = powerIncludes('shield')
        if (_shield.state) {
            const ring_outline = .07
            const time_outline = .1

            const pow = this.power_past[_shield.i]
            const half = [this.x + this.width / 2, this.y + this.height / 2]

            const real = realPos(...half)
            const ring = pow.ring > 0 ? pow.ring : 0

            ctx.lineWidth = ring_outline * scale
            ctx.strokeStyle = '#05b'
            ctx.beginPath()
            ctx.arc(real.x, real.y, ring * scale, 0, 7)
            ctx.stroke()

            const time = 1 - pow.time / pow.timer
            const radius = ring - ring_outline / 2 - time_outline / 2

            if (time > 0 && radius > 0) {
                const whole = Math.PI * 2
                ctx.lineWidth = time_outline * scale
                ctx.strokeStyle = '#3355'
                ctx.beginPath()
                ctx.arc(real.x, real.y, radius * scale, 0, time * whole)
                ctx.stroke()
            }
        }

        if (this.display) {
            const BOB = .05
            const HEAD_HEIGHT = this.height / 2.5
            const EYE_SIZE = this.width / 7
            const EYE_FROM_SIDE = this.width / 3.3
            const MAX_TURN_EYE = .08
            const FOOT_SIZE = this.width / 5
            const FOOT_FROM_SIDE = this.width / 3.3
            const FOOT_LIFT = .22
            const FOOT_SLIDE = .17
            const BODY_BOB = Math.sin(this.walk * 2) * BOB

            if (this.do_kill) {
                const gravity = .005

                this.death.speed_y += gravity

                if (this.death.head_y < this.height - HEAD_HEIGHT)
                    this.death.head_y += this.death.speed_y
                else {
                    this.death.head_y = this.height - HEAD_HEIGHT
                    this.death.speed_y = 0
                }

                const body = (x, y, width, height) => {
                    ctx.fillStyle = this.color
                    fillRect(this.x + x, this.y + y + this.death.head_y, width, height)
                }

                const eye = (x, y, width, height) => {
                    ctx.fillStyle = '#fff'
                    fillRect(this.x + x, this.y + y + this.death.head_y, width, height)
                }

                const foot = (x, width, height) => {
                    ctx.fillStyle = this.color
                    fillRect(
                        this.x + x,
                        this.y + this.height - FOOT_SIZE,
                        width, height
                    )
                }

                body(0, 0, this.width, HEAD_HEIGHT)
                eye(EYE_FROM_SIDE, HEAD_HEIGHT / 3, EYE_SIZE, .03)
                eye(this.width - EYE_FROM_SIDE - EYE_SIZE, HEAD_HEIGHT / 3, EYE_SIZE, .03)

                foot(
                    FOOT_FROM_SIDE - this.death.head_y, FOOT_SIZE, FOOT_SIZE
                )
                foot(
                    this.width - FOOT_FROM_SIDE - FOOT_SIZE + this.death.head_y, FOOT_SIZE, FOOT_SIZE
                )
            }

            else {
                const body = (x, y, width, height) => {
                    y += BODY_BOB

                    if (this.jet.state) {
                        const power = this.upgrade_past[this.jet.i]

                        const SPEED = this.speed_x * 2
                        const MAX_TURN_JET = this.width / 2

                        const OFFSET = Math.abs(SPEED) > MAX_TURN_JET ?
                        MAX_TURN_JET * Math.sign(SPEED) : SPEED

                        const center_x = this.width / 2 - power.jet_width / 2

                        power.jet_x = x + center_x - OFFSET
                        power.jet_y = y + height - power.jet_height + (Math.abs(OFFSET) * height * 2)

                        ctx.fillStyle = '#555'
                        fillRect(
                            this.x + power.jet_x,
                            this.y + power.jet_y,
                            power.jet_width, power.jet_height
                        )
                    }

                    ctx.fillStyle = this.color
                    fillRect(this.x + x, this.y + y, width, height)
                }

                const eye = (x, y, width, height) => {
                    x += Math.abs(this.speed_x) > MAX_TURN_EYE ?
                    MAX_TURN_EYE * Math.sign(this.speed_x) : this.speed_x

                    y += BODY_BOB

                    ctx.fillStyle = '#fff'
                    fillRect(this.x + x, this.y + y, width, height)
                }

                const foot = (x, y, width, height) => {
                    const floor_y = this.height - FOOT_SIZE

                    y = y > 0 ? floor_y : floor_y + y

                    ctx.fillStyle = this.color
                    fillRect(this.x + x, this.y + y, width, height)
                }

                body(0, 0, this.width, HEAD_HEIGHT)

                if (!this.climb || (!key.up && !key.down)) {
                    eye(EYE_FROM_SIDE, HEAD_HEIGHT / 3, EYE_SIZE, EYE_SIZE)
                    eye(this.width - EYE_FROM_SIDE - EYE_SIZE, HEAD_HEIGHT / 3, EYE_SIZE, EYE_SIZE)

                    foot(
                        FOOT_SIZE / 2 + FOOT_FROM_SIDE + Math.cos(this.walk) * FOOT_SLIDE,
                        Math.sin(this.walk) * FOOT_LIFT, FOOT_SIZE, FOOT_SIZE
                    )
                    foot(
                        FOOT_SIZE / 2 + FOOT_FROM_SIDE + Math.cos(this.walk + Math.PI) * FOOT_SLIDE,
                        Math.sin(this.walk + Math.PI) * FOOT_LIFT, FOOT_SIZE, FOOT_SIZE
                    )
                }
                else {
                    foot(
                        FOOT_FROM_SIDE - FOOT_SIZE,
                        Math.sin(time) * FOOT_LIFT, FOOT_SIZE, FOOT_SIZE
                    )
                    foot(
                        this.width - FOOT_FROM_SIDE,
                        Math.sin(time + Math.PI) * FOOT_LIFT, FOOT_SIZE, FOOT_SIZE
                    )
                }
            }
        }
    }
}
