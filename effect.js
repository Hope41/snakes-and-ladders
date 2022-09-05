'use strict'
const EFFECT_TYPES = [
    {width: {min: .8, max: .9}, height: {min: .2, max: .2}}, // -------> 0 Stick
    {width: {min: .9, max: 1.2}, height: {min: .35, max: .35}}, // ----> 1 Centipede
    {width: {min: 1.3, max: 1.8}, height: {min: .4, max: .4}}, // -----> 2 Creeper
    {width: {min: 1, max: 1.5}, height: {min: .5, max: .5}}, // -------> 3 Chunk
    {width: {min: 2.3, max: 2.7}, height: {min: 2, max: 2}}, // -------> 4 Monster
    {width: {min: .5, max: .5}, height: {min: .5, max: .5}}, // -------> 5 Blob
    {width: {min: 3.5, max: 3.5}, height: {min: 2, max: 2}}, // -------> 6 Crab
    {width: {min: 2.6, max: 2.6}, height: {min: 7.5, max: 7.5}}, // ---> 7 Hammer
]
const EFFECT_COINS = [6, 7]
const EFFECT_COIN_COUNT = 10

function effectCoin(type) {
    for (let i = 0; i < EFFECT_COINS.length; i ++) {
        if (EFFECT_COINS[i] == type) return true
    }

    return false
}

function getLevelEffects() {
    /* Note: when adding to the arrays, make
    sure the biggest effect types come first */
    if (game.level <= 2) return [0]
    if (game.level <= 3) return [1, 1, 0]
    if (game.level <= 6) return [2, 2, 1, 0]
    if (game.level <= 7) return [3, 2, 1]
    if (game.level <= 8) return [4, 2, 0]
    if (game.level <= 9) return [6, 4, 1]
    if (game.level <= 10) return [7, 6, 2]
    if (game.level <= 11) return [7, 6, 4]
    return [0]
}

function shuffleEffects() {
    for (let i = 0; i < game.effect_arr.length; i ++) {
        const choice = random(i, game.effect_arr.length)
        const current = game.effect_arr[i]

        game.effect_arr[i] = game.effect_arr[choice]
        game.effect_arr[choice] = current
    }
}

function nextSideEffect() {
    if (game.effect_index >= game.effect_arr.length) {
        shuffleEffects()
        game.effect_index = 0
    }
    const value = game.effect_arr[game.effect_index]

    game.effect_index ++

    return value
}

function setLevelEffects() {
    game.effect_arr = getLevelEffects()
    shuffleEffects()
    game.effect_index = 0
}

function makeSideEffect(x, y, type, speed_x = 0, speed_y = 0, dir = 0) {
    if (effectCoin(type)) game.points_max += EFFECT_COIN_COUNT

    if (type == 0) game.effects.push(new Stick(x, y, type))
    if (type == 1) game.effects.push(new Centipede(x, y, type))
    if (type == 2) game.effects.push(new Creeper(x, y, type))
    if (type == 3) game.effects.push(new Chunk(x, y, type))
    if (type == 4) game.effects.push(new Monster(x, y, type))
    if (type == 5) game.effects.unshift(new Blob(x, y, type, speed_x, speed_y, dir))
    if (type == 6) game.effects.push(new Crab(x, y, type))
    if (type == 7) game.effects.push(new Hammer(x, y, type))
}

class Effect extends Base {
    constructor(x, y, type) {
        // coordinates
        super(x, y)

        const set = this.setSize(type)
        this.width = set.width
        this.height = set.height
        this.type = type

        // setting
        this.gravity = .01
        this.walk = 0
        this.do_kill = 0
        this.kill = false
        this.type = type

        this.face = 0
        this.dir = random(0, 2) ? 1 : -1

        this.do_hit = 0

        this._width = 1
        this._height = 1

        this.made_power_up = false
    }

    coins() {
        for (let i = 0; i < EFFECT_COIN_COUNT; i ++) {
            game.points.push(new Point(
                this.x + random(0, this.width, 0),
                this.y + random(0, this.height, 0)
            ))
        }
    }

    collide(obj) {
        if (!this.do_kill && collide(this, obj)){
            const overlap = merge(obj, this, obj.speed_y * 2)

            if (hero.in_recovery) {
                if (hero.safe) return 'hit'
            }

            else {
                if (overlap.x || overlap.y < 0) return 'loss'
                return 'hit'
            }
        }
    }

    hit() {
        this.do_hit ++
        this.health --
        if (hero.pound.state && hero.upgrade_past[hero.pound.i].drop)
            this.health --
        if (hero.jet.state && hero.upgrade_past[hero.jet.i].drop)
            this.health -= 3

        if (this.health <= 0 && this.do_hit == 1 && !this.made_power_up) {
            this.made_power_up = true
            this.do_hit = 0
            this.die()

            makePowerUp(this)
        }
    }

    control() {
        if (this.dir) this.face = this.dir
        this.move_timer --

        if (this.move_timer < 0) {
            if (!this.dir) {
                this.dir = this.face
                this.move_timer = random(this.move_range.min, this.move_range.max)
            }
            else {
                this.dir = 0
                this.move_timer = random(this.stop_range.min, this.stop_range.max)
            }
        }
    }

    setSize(type) {
        const width = random(
            EFFECT_TYPES[type].width.min,
            EFFECT_TYPES[type].width.max, 0
        )
        const height = random(
            EFFECT_TYPES[type].height.min,
            EFFECT_TYPES[type].height.max, 0
        )

        this.y -= height
        return {width, height}
    }

    collision() {
        const array = []
        const arr = []

        const box = {}
        box.x = Math.floor(this.x),
        box.y = Math.floor(this.y),
        box.width = Math.floor(this.x + this.width) - box.x,
        box.height = Math.floor(this.y + this.height) - box.y

        const index = posToIndex(box.x, box.y, map.width)

        for (let i = 0; i < box.width + 1; i ++) {
            array.push(index + i)
            array.push(index + (map.width * box.height) + i)
        }
        for (let i = 1; i < box.height; i ++) {
            array.push(index + (i * map.width))
            array.push(index + box.width + (i * map.width))
        }

        // turn our indices into objects
        for (let i = 0; i < array.length; i ++) {
            const I = array[i]

            // ctx.fillStyle = '#0f05'
            // fillRect(I % map.width, Math.floor(I / map.width), 1, 1)

            arr.push({
                x: I % map.width,
                y: Math.floor(I / map.width),
                width: 1,
                height: 1
            })
        }

        for (let i = 0; i < arr.length; i ++) {
            const obj = arr[i]

            if (obj.x >= 0 && obj.x < map.width &&
                obj.y >= 0 && obj.y < map.height) {

                if (collide(this, obj)) {
                    if (inItem(map.array[obj.x + obj.y * map.width], 0) == BLOCK) {
                        const overlap = merge(this, obj, this.gravity, 0, this.in_air ? this.speed_x : 0)

                        if (overlap.x) {
                            this.x -= overlap.x
                            this.speed_x = 0

                            this.dir = overlap.x > 0 ? -1 : 1
                        }
                        else {
                            this.y -= overlap.y
                            this.speed_y = 0

                            if (overlap.y > 0) this.in_air = false
                        }
                    }
                }
            }
        }
    }

    update() {
        this.draw()
        super.update()

        this.speed_x *= this.momentum

        this.y += this.speed_y
        this.x += this.speed_x

        if (this.do_hit) {
            this.do_hit ++
            if (this.do_hit >= this.hit_flash) this.do_hit = 0
        }

        if (effectCoin(this.type) && this.do_kill == 1) this.coins()
    }
}

class Stick extends Effect {
    constructor(x, y, type, dir = 0) {
        super(x, y, type)

        if (dir) this.dir = dir

        this.health = 1
        this.hit_flash = 20

        this.momentum = .95
        this.damping = 900
        this.move_range = {min: 50, max: 300}
        this.stop_range = {min: 50, max: 60}
        this.move_timer = 0
        this.alpha = 1
        this.segments = []
        this.generate()
    }

    generate() {
        const parts = random(3, 7)
        let number = random(0, 50)

        for (let i = 0; i < parts; i ++) {
            number += random(1, parts, 0)
            this.segments.push(number)
        }
    }

    die() {
        if (!this.do_kill) this.jump(.1)
        this.do_kill ++
        this.speed_y += this.gravity
        this.collision()

        const splat_speed = .05
        const walk_speed = .05

        const fade_speed = .005
        const dir = this.dir ? this.dir : 1

        let splatted = true
        for (let i = 0; i < this.segments.length; i ++) {
            if ((this.walk % Math.PI + Math.PI) % Math.PI > walk_speed) {
                this.walk += walk_speed * dir
                splatted = false
            }

            else {
                const splat_range = ((this.segments[i] % Math.PI) + Math.PI) % Math.PI
                if (splat_range > splat_speed) {
                    this.segments[i] += splat_speed * dir
                    splatted = false
                }
            }
        }

        if (splatted) {
            this.alpha -= fade_speed
            if (this.alpha < 0) this.kill = true
        }
    }

    update() {
        super.update()

        if (this.do_kill) {
            this.die()
            return
        }

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 10

        this.collision()
        this.control()
    }
    
    draw() {
        const FOOT_LIFT = .35
        const FOOT_SLIDE = .3
        const COLOR = game.level == game.end_level ? [200, 200, 200] : [50, 0, 0]

        const step = (i, str) => {
            const range = 1 / this.segments.length * FOOT_SLIDE
            const length = range > .1 ? range : .1

            let x = 0
            let y = 0

            if (str == 'x')
                x = (i * this.width) / (this.segments.length - 1) + Math.cos(this.walk + this.segments[i]) * length
            else
                y = Math.sin(this.walk + this.segments[i]) * FOOT_LIFT

            y = y > 0 ? this.height : this.height + y

            return x ? this.x + x : this.y + y
        }

        ctx.fillStyle = this.do_hit ? rgb(...randomColor()) : rgb(...COLOR, this.alpha)
        for (let i = 0; i < this.segments.length; i ++) {
            line([
                step(i - 1, 'x'),
                step(i - 1, 'y'),
                step(i, 'x'),
                step(i, 'y')
            ], .06)
        }
    }
}

class Centipede extends Effect {
    constructor(x, y, type) {
        super(x, y, type)

        this.health = 2
        this.hit_flash = 20

        this.momentum = .96
        this.damping = 800
        this.move_range = {min: 300, max: 400}
        this.stop_range = {min: 50, max: 60}
        this.move_timer = 0

        this.leg_length = .26
        this.alpha = 1
        this.segments = []
        this.generate()
    }

    generate() {
        const parts = random(3, 6)
        let number = random(0, 50)

        for (let i = 0; i < parts; i ++) {
            number += random(1, parts, 0)
            this.segments.push(number)
        }
    }

    die() {
        if (!this.do_kill) this.jump(.1)
        this.do_kill ++
        this.speed_y += this.gravity
        this.collision()

        const splat_speed = .05
        const walk_speed = .05
        const fade_speed = .01
        const leg_shrink = .005
        const dir = this.dir ? this.dir : 1

        if (this.leg_length > leg_shrink) this.leg_length -= leg_shrink
        else this.leg_length = 0

        let splatted = true
        for (let i = 0; i < this.segments.length; i ++) {
            if ((this.walk % Math.PI + Math.PI) % Math.PI > walk_speed) {
                this.walk += walk_speed * dir
                splatted = false
            }

            else {
                const splat_range = ((this.segments[i] % Math.PI) + Math.PI) % Math.PI
                if (splat_range > splat_speed) {
                    this.segments[i] += splat_speed * dir
                    splatted = false
                }
            }
        }

        if (splatted) {
            this.alpha -= fade_speed
            if (this.alpha < 0) this.kill = true
        }
    }

    update() {
        super.update()

        if (this.do_kill) {
            this.die()
            return
        }

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 10

        this.collision()
        this.control()
    }
    
    draw() {
        const LEG_LIFT = .15
        const LEG_SLIDE = .1

        const step = (i, str) => {
            const offset = {
                x: (i / (this.segments.length - 1)) * this.width,
                y: this.height
            }

            let x = 'none'
            let y = 0

            if (str == 'x') x = 0
            else if (str == 'y')
                y = Math.sin(this.walk + this.segments[i]) * LEG_LIFT
            else if (str == 'x_foot') 
                x = Math.cos(this.walk + this.segments[i]) * LEG_SLIDE

            if (y > 0) y = 0
            return x != 'none' ? this.x + offset.x + x : this.y + offset.y + y
        }

        ctx.fillStyle = rgb(
            this.do_hit ? random(0, 255) : 100,
            this.do_hit && random(0, 255),
            this.do_hit && random(0, 255), this.alpha
        )

        for (let i = 0; i < this.segments.length; i ++) {
            line([
                step(i - 1, 'x'),
                step(i - 1, 'y') - this.leg_length,
                step(i, 'x'),
                step(i, 'y') - this.leg_length,
                step(i, 'x_foot'),
                step(i, 'y')
            ], .06)
        }
    }
}

class Creeper extends Effect {
    constructor(x, y, type) {
        super(x, y, type)

        this.health = 3
        this.hit_flash = 20

        this.momentum = .96
        this.damping = 800
        this.move_range = {min: 350, max: 500}
        this.stop_range = {min: 50, max: 60}
        this.move_timer = 0
        this._width = this.width
        this.shift = random(0, 500, 0)
        this.leg_length = .26
        this.leg_drop = 0
        this.eye_rot = random(0, Math.PI * 2, 0)
        this.alpha = 1
        this.segments = []
        
        this.generate()
    }

    generate() {
        const parts = random(3, 6)
        let number = random(0, 50)

        for (let i = 0; i < parts; i ++) {
            number += random(1, parts, 0)
            this.segments.push(number)
        }
    }

    die() {
        if (!this.do_kill) this.jump(.1)
        this.do_kill ++
        this.speed_y += this.gravity
        this.eye_rot += Math.sin(this.do_kill / 80) * .2
        this.collision()

        const splat_speed = .02
        const fade_speed = .01
        const dir = this.dir ? this.dir : 1
        const gravity = .0001

        this.leg_length -= this.leg_drop
        this.leg_drop += gravity

        if (this.leg_length <= 0) this.leg_length = 0

        let splatted = true
        for (let i = 0; i < this.segments.length; i ++) {
            if ((this.walk % Math.PI + Math.PI) % Math.PI > splat_speed) {
                this.walk += splat_speed * dir
                splatted = false
            }

            else {
                const splat_range = ((this.segments[i] % Math.PI) + Math.PI) % Math.PI
                if (splat_range > splat_speed) {
                    this.segments[i] += splat_speed * dir
                    splatted = false
                }
            }
        }

        if (splatted) {
            this.alpha -= fade_speed
            if (this.alpha <= 0) this.alpha = 0
            
            if (!this.leg_length && !this.alpha) this.kill = true
        }
    }

    update() {
        super.update()

        if (this.do_kill) {
            this.die()
            return
        }

        this.face = this.dir ? this.dir : this.face

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 10

        this.collision()
        this.control()
    }

    draw() {
        this._width += ((this.face * this.width) - this._width) / 7

        const LEG_LIFT = .15
        const LEG_SLIDE = .1
        const BODY_WIDTH = .07
        const EYE_SIZE = .2
        const PUPIL_SIZE = .07
        const NECK_LENGTH = .2

        const POS_X = this.width / 2 + this._width / 2
        const POS_Y = this.height - this.leg_length

        const step = (i, str) => {
            const offset = {
                x: POS_X - (i / (this.segments.length - 1)) * this._width,
                y: this.height
            }

            let x = 'none'
            let y = 0

            if (str == 'x') x = 0
            else if (str == 'y')
                y = Math.sin(this.walk + this.segments[i]) * LEG_LIFT

            else if (str == 'x_foot') 
                x = Math.cos(this.walk + this.segments[i]) * LEG_SLIDE
            else if (str == 'y_foot')
                y = Math.sin(this.walk + this.segments[i]) * LEG_LIFT

            if (y > 0) y = 0
            return x != 'none' ? this.x + offset.x + x : this.y + offset.y + y
        }

        ctx.fillStyle = rgb(
            this.do_hit ? random(0, 255) : 100,
            this.do_hit && random(0, 255),
            this.do_hit && random(0, 255), this.alpha
        )
        for (let i = 0; i < this.segments.length; i ++) {
            if (i > 0) line([
                step(i - 1, 'x'),
                step(i - 1, 'y') - this.leg_length,
                step(i, 'x'),
                step(i, 'y') - this.leg_length],
                BODY_WIDTH
            )
            line([
                step(i, 'x'),
                step(i, 'y') - this.leg_length,
                step(i, 'x_foot'),
                step(i, 'y_foot')],
                BODY_WIDTH
            )
        }
        const BOB = step(0, 'y') + POS_Y - this.leg_length - NECK_LENGTH - this.y
        const EYE_BOB = BOB - POS_Y + (this.do_kill && NECK_LENGTH - this.leg_length)

        // NECK
        !this.do_kill &&
        fillRect(
            this.x + POS_X - BODY_WIDTH / 2,
            this.y + EYE_BOB,
            BODY_WIDTH,
            NECK_LENGTH
        )
        // EYE WHITES
        ctx.fillStyle = rgb(255, 255, 255, this.alpha)
        fillRect(
            this.x + POS_X,
            this.y + EYE_BOB,
            EYE_SIZE, -EYE_SIZE
        )
        fillRect(
            this.x + POS_X - EYE_SIZE,
            this.y + EYE_BOB,
            EYE_SIZE, -EYE_SIZE
        )
        // EYE EDGES
        ctx.strokeStyle = rgb(0, 0, 0, this.alpha)
        ctx.lineWidth = .03 * scale
        fillRect(
            this.x + POS_X,
            this.y + EYE_BOB,
            EYE_SIZE, -EYE_SIZE, true
        )
        fillRect(
            this.x + POS_X - EYE_SIZE,
            this.y + EYE_BOB,
            EYE_SIZE, -EYE_SIZE, true
        )
        // PUPILS
        const center_x = POS_X - PUPIL_SIZE / 2
        const center_y = EYE_BOB - EYE_SIZE / 2 - PUPIL_SIZE / 2
        const dist_x = this.x - hero.x
        const dist_y = this.y - hero.y

        const angle = Math.atan2(dist_y, dist_x) + Math.PI
        if (!this.do_kill) this.eye_rot += (angle - this.eye_rot) / 3

        const rotate = (offset, str = 'sin') => {
            const LIMIT = EYE_SIZE / 2 - PUPIL_SIZE
            if (str == 'sin') return Math.sin(this.eye_rot + offset) * LIMIT
            if (str == 'cos') return Math.cos(this.eye_rot + offset) * LIMIT
        }

        ctx.fillStyle = rgb(0, 0, 0, this.alpha)
        fillRect(
            this.x + (center_x - EYE_SIZE / 2) + rotate(this.shift, 'cos'),
            this.y + center_y + rotate(this.shift, 'sin'),
            PUPIL_SIZE, PUPIL_SIZE
        )
        fillRect(
            this.x + (center_x + EYE_SIZE / 2) + rotate(0, 'cos'),
            this.y + center_y + rotate(0, 'sin'),
            PUPIL_SIZE, PUPIL_SIZE
        )
        // EYEBROWS
        const x = center_x + PUPIL_SIZE / 2
        ctx.fillStyle = rgb(0, 0, 0, this.alpha)
        line([
            this.x + x - EYE_SIZE,
            this.y + center_y - EYE_SIZE / 2,
            this.x + x,
            this.y + center_y - EYE_SIZE / 4,
            this.x + x + EYE_SIZE,
            this.y + center_y - EYE_SIZE / 2
        ], .05)
    }
}

class Chunk extends Effect {
    constructor(x, y, type) {
        super(x, y, type)

        this.health = 8
        this.hit_flash = 4

        this.eye_rot = 0
        this.momentum = .96
        this.damping = 800
        this.move_range = {min: 350, max: 500}
        this.stop_range = {min: 50, max: 60}
        this.move_timer = 0
        this._width = this.width
        this.leg_length = .3
        this.leg_drop = 0
        this.alpha = 1
        this.segments = []
        this.generate()
    }

    generate() {
        const parts = 2
        let number = random(0, 50)

        for (let i = 0; i < parts; i ++) {
            number += random(1, parts, 0)
            this.segments.push(number)
        }
    }

    die() {
        this.do_kill ++
        this.speed_y += this.gravity
        this.speed_x *= .7
        this.collision()

        const splat_speed = .02
        const fade_speed = .01
        const dir = this.dir ? this.dir : 1
        const gravity = .0001

        this.leg_length -= this.leg_drop
        this.leg_drop += gravity

        if (this.leg_length <= 0) this.leg_length = 0

        let splatted = true
        for (let i = 0; i < this.segments.length; i ++) {
            if ((this.walk % Math.PI + Math.PI) % Math.PI > splat_speed) {
                this.walk += splat_speed * dir
                splatted = false
            }

            else {
                const splat_range = ((this.segments[i] % Math.PI) + Math.PI) % Math.PI
                if (splat_range > splat_speed) {
                    this.segments[i] += splat_speed * dir
                    splatted = false
                }
            }
        }

        if (splatted) {
            this.alpha -= fade_speed
            if (this.alpha <= 0) this.alpha = 0
            
            if (!this.leg_length && !this.alpha) this.kill = true
        }
    }

    update() {
        super.update()

        if (this.do_kill) {
            this.die()
            return
        }

        if (this.do_hit && Math.abs(this.speed_x) < .2) this.speed_x *= 1.13

        this.face = this.dir ? this.dir : this.face

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 6

        this.collision()
        this.control()
    }

    draw() {
        this._width += ((this.face * this.width) - this._width) / 7

        const LEG_LIFT = .2
        const LEG_SLIDE = .14
        const LEG_WIDTH = .1
        const BODY_HEIGHT = .2
        const HEAD_WIDTH = .55
        const HEAD_HEIGHT = .3
        const EYE_SIZE = .16
        const BODY_BUMP = .04
        const PUPIL_SIZE = .06
        const FOOT_MARGIN = .1
        const TAIL_THICKNESS = .1

        const POS_X = this.width / 2 + this._width / 2
        const POS_Y = this.height - this.leg_length
        const BUMP = Math.cos(this.walk * 2) * BODY_BUMP
        const FLIP = flip(1, this._width, this.width)

        const step = (i, str) => {
            const offset = {
                x: (POS_X - flip(FOOT_MARGIN / 2, this._width, this.width)) -
                    (i / (this.segments.length - 1)) * 
                    (this._width - flip(FOOT_MARGIN, this._width, this.width)),
                y: this.height
            }

            let x = 'none'
            let y = 'none'

            if (str == 'x') x = 0
            else if (str == 'y') y = BUMP
            else if (str == 'x_foot') 
                x = Math.cos(this.walk + this.segments[i]) * LEG_SLIDE
            else if (str == 'y_foot')
                y = Math.sin(this.walk + this.segments[i]) * LEG_LIFT
            else if (str == 'x_foot2') 
                x = Math.cos(this.walk + this.segments[i] + Math.PI) * LEG_SLIDE
            else if (str == 'y_foot2')
                y = Math.sin(this.walk + this.segments[i] + Math.PI) * LEG_LIFT

            if (y > 0) y = 0
            return x != 'none' ? this.x + offset.x + x : this.y + offset.y + y
        }

        ctx.fillStyle = rgb(
            this.do_hit ? random(0, 255) : 50,
            this.do_hit ? random(0, 255) : 40,
            this.do_hit ? random(0, 255) : 40, this.alpha
        )
        for (let i = 0; i < this.segments.length; i ++) {
            line([
                step(i, 'x'),
                step(i, 'y') - this.leg_length,
                step(i, 'x_foot'),
                step(i, 'y_foot')],
                LEG_WIDTH
            )
            line([
                step(i, 'x'),
                step(i, 'y') - this.leg_length,
                step(i, 'x_foot2'),
                step(i, 'y_foot2')],
                LEG_WIDTH
            )
        }
        // BODY
        flipRect(
            -this.width / 2,
            POS_Y + .01 + BUMP,
            this.width,
            -BODY_HEIGHT - .01,

            this.x + this.width / 2, this.y, this._width / this.width, 1
        )
        // HEAD
        flipRect(
            this.width / 2 - .1,
            POS_Y + .01 - BODY_HEIGHT + BUMP,
            HEAD_WIDTH,
            -HEAD_HEIGHT - .01,

            this.x + this.width / 2, this.y, this._width / this.width, 1
        )

        // EAR
        flipRect(
            this.width / 2 - .08,
            POS_Y - BODY_HEIGHT - HEAD_HEIGHT + BUMP,
            .1, -.05,

            this.x + this.width / 2, this.y, this._width / this.width, 1
        )
        flipRect(
            this.width / 2 + .07,
            POS_Y - BODY_HEIGHT - HEAD_HEIGHT + BUMP,
            .1, -.05,

            this.x + this.width / 2, this.y, this._width / this.width, 1
        )

        // TAIL
        const rot = Math.cos(this.walk * 2 - .5) * .2 + Math.PI * (Math.sin(time / 5) * .05 + .7)
        const real = realPos(
            this.x + this.width / 2 - this.width / 2 * FLIP,
            this.y + POS_Y + BUMP - BODY_HEIGHT
        )
        ctx.save()
        ctx.translate(real.x, real.y)
        ctx.rotate(rot * FLIP)
        rotFlipRect(
            0, 0, .3, -TAIL_THICKNESS,
            0, 0, FLIP, 1
        )
        ctx.restore()

        // EYES
        ctx.fillStyle = rgb(255, 255, 255, this.alpha)
        const eye1 = flipRect(
            this.width / 2,
            POS_Y + .01 - BODY_HEIGHT - HEAD_HEIGHT / 2 - EYE_SIZE / 2 + BUMP,
            EYE_SIZE,
            EYE_SIZE,

            this.x + this.width / 2, this.y, this._width / this.width, 1,
            false, true
        )
        const eye2 = flipRect(
            this.width / 2 + EYE_SIZE + .02,
            POS_Y + .01 - BODY_HEIGHT - HEAD_HEIGHT / 2 - EYE_SIZE / 2 + BUMP,
            EYE_SIZE,
            EYE_SIZE,

            this.x + this.width / 2, this.y, this._width / this.width, 1,
            false, true
        )

        ctx.strokeStyle = rgb(0, 0, 0, this.alpha)
        ctx.lineWidth = .01 * scale
        fillRect(eye1.x, eye1.y, eye1.width, eye1.height, true)
        fillRect(eye2.x, eye2.y, eye2.width, eye2.height, true)

        // PUPILS
        const dist_x = this.x + (this.width / 2 * FLIP) - hero.x
        const dist_y = this.y - hero.y
        const angle = Math.atan2(dist_y, dist_x) + Math.PI
        this.eye_rot += (angle - this.eye_rot) / 3

        const LIMIT = EYE_SIZE / 2 - PUPIL_SIZE / 2
        const center = {
            x_1: eye1.x + eye1.width / 2 - PUPIL_SIZE / 2,
            y_1: eye1.y + eye1.height / 2 - PUPIL_SIZE / 2,
            x_2: eye2.x + eye2.width / 2 - PUPIL_SIZE / 2,
            y_2: eye2.y + eye2.height / 2 - PUPIL_SIZE / 2
        }

        ctx.fillStyle = rgb(0, 0, 0, this.alpha)
        fillRect(
            center.x_1 + Math.cos(this.eye_rot) * LIMIT,
            center.y_1 + Math.sin(this.eye_rot) * LIMIT,
            PUPIL_SIZE, PUPIL_SIZE
        )
        fillRect(
            center.x_2 + Math.cos(this.eye_rot) * LIMIT,
            center.y_2 + Math.sin(this.eye_rot) * LIMIT,
            PUPIL_SIZE, PUPIL_SIZE
        )

        // BROWS
        line([
            eye1.x,
            eye1.y,
            eye1.x + (eye2.x + eye2.width - eye1.x) / 2,
            eye1.y + EYE_SIZE / 5,
            eye2.x + eye2.width,
            eye2.y,
        ], .04)
    }
}

class Monster extends Effect {
    constructor(x, y, type) {
        super(x, y, type)

        this.health = 20
        this.hit_flash = 10

        this.eye_rot = 0
        this.momentum = .999
        this.damping = 800
        this.move_range = {min: 100, max: 130}
        this.stop_range = {min: 50, max: 100}
        this.move_timer = 100
        this._width = this.width
        this.leg_length = 1
        this.real_leg_length = this.leg_length
        this.leg_drop = 0
        this.alpha = 1
        this.do_crouch = false
        this.sit_crouch = false
        this.fake_y = this.y

        this.body_height = this.height - this.leg_length
        this.fake_height = this.body_height

        this.spit_range = {min: 60, max: 100}
        this.spit_timer = random(this.spit_range.min, this.spit_range.max)
        this.open = false
        this.jaw_angle = 0
        this.smoke = 0

        this.segments = []
        this.teeth = []
        this.generate()
    }

    collide(obj) {
        const dim = {
            x: this.x,
            y: this.fake_y,
            width: this.width,
            height: this.fake_height
        }

        if (!this.do_kill && collide(dim, obj)){
            const overlap = merge(obj, dim, obj.speed_y * 2)

            if (obj.in_recovery) {
                if (obj.safe) return 'hit'
            }

            else {
                if (overlap.x || overlap.y < 0) return 'loss'
                return 'hit'
            }
        }
    }

    generate() {
        const parts = 2
        const teeth = random(2, 4)

        let number = random(0, 50)

        for (let i = 0; i < parts; i ++) {
            number += random(1, parts, 0)
            this.segments.push(number)
        }

        for (let i = 0; i < teeth; i ++) this.teeth.push(random(0, 2) ? 1 : -1)
    }

    die() {
        if (!this.do_kill) this.jump(.1)
        this.do_kill ++
        this.speed_y += this.gravity
        this.speed_x *= .9
        this.collision()

        const splat_speed = .02
        const fade_speed = .01
        const dir = this.dir ? this.dir : 1
        const gravity = .0001

        this.jaw_angle *= .94

        this.real_leg_length -= this.leg_drop
        this.leg_drop += gravity

        if (this.real_leg_length <= 0) this.real_leg_length = 0

        let splatted = true
        for (let i = 0; i < this.segments.length; i ++) {
            if ((this.walk % Math.PI + Math.PI) % Math.PI > splat_speed) {
                this.walk += splat_speed * dir
                splatted = false
            }

            else {
                const splat_range = ((this.segments[i] % Math.PI) + Math.PI) % Math.PI
                if (splat_range > splat_speed) {
                    this.segments[i] += splat_speed * dir
                    splatted = false
                }
            }
        }

        if (splatted) {
            this.alpha -= fade_speed
            if (this.alpha <= 0) this.alpha = 0
            
            if (!this.real_leg_length && !this.alpha) this.kill = true
        }
    }

    crouch() {
        if (!this.do_crouch) {
            this.sit_crouch = true
            this.jump(.13)
        }
        this.do_crouch ++
        this.speed_x *= .9
        this.fake_y = this.y + this.height - this.real_leg_length - this.body_height

        if (this.sit_crouch) {
            if (this.real_leg_length > 0) this.real_leg_length -= .029
            else this.real_leg_length = 0

            if (!this.in_air) {
                if (this.real_leg_length <= 0) {
                    this.sit_crouch = false

                    cam.boom(20, .1, .1)
                }
            }
        }

        if (!this.sit_crouch) {
            const dist = this.leg_length - this.real_leg_length

            this.leg_drop = 0
            this.real_leg_length += dist / 10

            if (dist < .1) {
                this.fake_y = this.y
                this.real_leg_length = this.leg_length
                this.do_crouch = 0
            }
        }
    }

    update() {
        super.update()

        if (this.do_kill) {
            this.die()
            return
        }

        if (this.do_hit && Math.abs(this.speed_x) < .2) this.speed_x *= 1.13
    
        this.fake_y = this.y
        if (this.do_crouch) this.crouch()

        this.face = this.dir ? this.dir : this.face

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 4

        this.collision()
        this.control()

        if (hero.y > this.y + this.fake_height &&
            hero.y < this.y + this.height &&
            hero.x < this.x + this.width / 2 &&
            hero.x + hero.width > this.x + this.width / 2 &&
            !hero.do_kill)
                this.crouch()
    }

    draw() {
        this._width += ((this.face * this.width) - this._width) / 7

        const LEG_LIFT = .4
        const LEG_SLIDE = .3
        const LEG_WIDTH = .2
        const HEAD_WIDTH = 1
        const HEAD_HEIGHT = .5
        const JAW_HEIGHT = .25
        const EYE_SIZE = .25
        const EYE_SINK = .1
        const EYE_GAP = .05
        const BODY_BUMP = .06
        const PUPIL_SIZE = .07
        const FOOT_MARGIN = .5
        const TOOTH_SIZE = .1

        const POS_X = this.width / 2 + this._width / 2
        const POS_Y = this.height - this.real_leg_length
        const BUMP = Math.cos(this.walk * 2) * BODY_BUMP
        const FLIP = flip(1, this._width, this.width)

        const dist_x = (this.x + (this.width / 2 * FLIP)) - (hero.x + hero.width / 2)
        const dist_y = this.y - hero.y + hero.height
        const angle = Math.atan2(dist_y, dist_x) + Math.PI
        this.eye_rot = rotateSmooth(this.eye_rot, angle, {min: 0, max: Math.PI * 2})

        const step = (i, str) => {
            const offset = {
                x: (POS_X - flip(FOOT_MARGIN / 2, this._width, this.width)) -
                    (i / (this.segments.length - 1)) * 
                    (this._width - flip(FOOT_MARGIN, this._width, this.width)),
                y: this.height
            }

            let x = 'none'
            let y = 'none'

            if (str == 'x') x = 0
            else if (str == 'y') y = BUMP
            else if (str == 'x_foot') 
                x = Math.cos(this.walk + this.segments[i]) * LEG_SLIDE
            else if (str == 'y_foot')
                y = Math.sin(this.walk + this.segments[i]) * LEG_LIFT
            else if (str == 'x_foot2') 
                x = Math.cos(this.walk + this.segments[i] + Math.PI) * LEG_SLIDE
            else if (str == 'y_foot2')
                y = Math.sin(this.walk + this.segments[i] + Math.PI) * LEG_LIFT

            if (y > 0) y = 0
            return x != 'none' ? this.x + offset.x + x : this.y + offset.y + y
        }

        ctx.fillStyle = rgb(
            this.do_hit ? random(0, 255) : 150,
            this.do_hit ? random(0, 255) : 50,
            this.do_hit ? random(0, 255) : 50, this.alpha
        )
        for (let i = 0; i < this.segments.length; i ++) {
            line([
                step(i, 'x'),
                step(i, 'y') - this.real_leg_length,
                step(i, 'x_foot'),
                step(i, 'y_foot')],
                LEG_WIDTH
            )
            line([
                step(i, 'x'),
                step(i, 'y') - this.real_leg_length,
                step(i, 'x_foot2'),
                step(i, 'y_foot2')],
                LEG_WIDTH
            )
        }
        // BODY
        flipRect(
            -this.width / 2,
            POS_Y + .01 + BUMP,
            this.width,
            -this.body_height - .01,

            this.x + this.width / 2, this.y, FLIP, 1
        )
        // HEAD
        const pad = 1 / scale
        const sink_x = .05
        const sink_y = .3

        const head = {
            x: this.width / 2 - sink_x,
            y: POS_Y + sink_y - this.body_height + BUMP
        }
        const data = flipRect(
            head.x, head.y - JAW_HEIGHT, HEAD_WIDTH, -HEAD_HEIGHT - pad,

            this.x + this.width / 2, this.y, FLIP, 1,
            false, true
        )

        fillRect(data.x, data.y - pad, (HEAD_WIDTH * .35 + pad) * FLIP, JAW_HEIGHT + pad)

        if (!this.do_kill && !comment.active) {
            this.smoke --

            if (this.smoke < 0) {
                const add = Math.sign(this.speed_x) / 20
                const size = random(.1, .2, 0)
                game.particles.push(
                    new Cloud({
                        x: (data.x + HEAD_WIDTH * FLIP) + .1,
                        y: this.y + head.y - JAW_HEIGHT,
                        width: size,
                        height: size,
                        grow: 1.01,
                        speed_x: random(.05 * FLIP + add, .07 * FLIP + add, 0),
                        speed_y: random(-.02, 0, 0),
                        momentum: .99,
                        fade: .03,
                        gravity: -.005,
                        fill: random(0, 6) ? [0,0,0,.5] : [255,150,0,1],
                        stroke: [0,0,0,0]
                    })
                )

                this.smoke = 5
            }

            const burp = () => {
                const add = Math.sign(this.speed_x) / 20
                const size = random(.1, .2, 0)
                game.particles.push(
                    new Cloud({
                        x: data.x + (HEAD_WIDTH / 2) * FLIP,
                        y: this.y + head.y - JAW_HEIGHT + .2,
                        width: size,
                        height: size,
                        grow: 1.01,
                        speed_x: random(.05 * FLIP + add, .07 * FLIP + add, 0),
                        speed_y: random(-.01, .01, 0),
                        momentum: .99,
                        fade: .02,
                        gravity: 0,
                        fill: [0,200,0,.5],
                        stroke: [0,0,0,0]
                    })
                )
            }

            const next = value => {
                return findBlock(this.x + Math.sign(FLIP) * this.width, this.y, value, 0)
            }

            if (!next(1) && !next(2)) {
                const max_open = .4
                const shrink = this.spit_timer * .05

                // open mouth
                if (!this.open) {
                    this.jaw_angle = -shrink
                    if (this.jaw_angle < 0) this.jaw_angle = 0
                    else burp()
                    
                }
                // close mouth
                else {
                    this.jaw_angle -= .02

                    burp()

                    if (this.jaw_angle <= 0) {
                        this.jaw_angle = 0

                        this.open = false
                    }
                }

                this.spit_timer --

                // Spit out blob
                if (this.spit_timer == 0) {
                    makeSideEffect(
                        data.x + (HEAD_WIDTH * .75) * FLIP - .25,
                        this.y + head.y + .5, 5,
                        .1 * Math.sign(FLIP) + this.speed_x,
                        0,
                        Math.sign(FLIP)
                    )
                }
                // reset
                if (this.jaw_angle > max_open) {
                    this.open = true
                    this.spit_timer = random(this.spit_range.min, this.spit_range.max)
                }
            }
            else this.jaw_angle = 0
        }

        // DRAW JAW
        const real = realPos(data.x + (HEAD_WIDTH * .25) * FLIP, this.y + head.y)
        ctx.save()
        ctx.translate(real.x, real.y)
        ctx.rotate(this.jaw_angle * FLIP)
        rotFlipRect(
            0, 0, HEAD_WIDTH * .75, (-JAW_HEIGHT - .01),
            0, 0, FLIP, 1
        )
        ctx.restore()

        // TEETH
        ctx.fillStyle = rgb(255, 255, 255, this.alpha)
        for (let i = 0; i < this.teeth.length; i ++) {
            const item = this.teeth[i]

            flipRect(
                head.x + HEAD_WIDTH - i * TOOTH_SIZE * 2,
                head.y - JAW_HEIGHT,
                -TOOTH_SIZE,
                TOOTH_SIZE * item,

                this.x + this.width / 2, this.y, FLIP, 1
            )
        }
        const LIP_SIZE = .02
        ctx.fillStyle = rgb(0, 0, 0, this.alpha / 2)
        flipRect(
            head.x + HEAD_WIDTH,
            head.y - JAW_HEIGHT - LIP_SIZE,
            -HEAD_WIDTH / 2,
            LIP_SIZE,

            this.x + this.width / 2, this.y, FLIP, 1
        )

        // EYES
        ctx.fillStyle = rgb(255, 255, 255, this.alpha)
        const y = head.y - HEAD_HEIGHT - EYE_SIZE + EYE_SINK
        const x = this.width / 2 + .05
        const eye1 = flipRect(
            x, y, EYE_SIZE, EYE_SIZE,
            this.x + this.width / 2, this.y, FLIP, 1,
            false, true
        )
        const eye2 = flipRect(
            x + EYE_SIZE + EYE_GAP, y, EYE_SIZE, EYE_SIZE,

            this.x + this.width / 2, this.y, FLIP, 1,
            false, true
        )

        ctx.strokeStyle = rgb(0, 0, 0, this.alpha)
        ctx.lineWidth = .02 * scale
        fillRect(eye1.x, eye1.y, eye1.width, eye1.height, true)
        fillRect(eye2.x, eye2.y, eye2.width, eye2.height, true)

        // PUPILS
        this.eye_rot += (angle - this.eye_rot) / 3

        const LIMIT = EYE_SIZE / 2 - PUPIL_SIZE / 2
        const center = {
            x_1: eye1.x + eye1.width / 2 - PUPIL_SIZE / 2,
            y_1: eye1.y + eye1.height / 2 - PUPIL_SIZE / 2,
            x_2: eye2.x + eye2.width / 2 - PUPIL_SIZE / 2,
            y_2: eye2.y + eye2.height / 2 - PUPIL_SIZE / 2
        }

        ctx.fillStyle = rgb(0, 0, 0, this.alpha)
        fillRect(
            center.x_1 + Math.cos(this.eye_rot) * LIMIT,
            center.y_1 + Math.sin(this.eye_rot) * LIMIT,
            PUPIL_SIZE, PUPIL_SIZE
        )
        fillRect(
            center.x_2 + Math.cos(this.eye_rot) * LIMIT,
            center.y_2 + Math.sin(this.eye_rot) * LIMIT,
            PUPIL_SIZE, PUPIL_SIZE
        )

        // BROWS
        line([
            eye1.x,
            eye1.y,
            eye1.x + (eye2.x + eye2.width - eye1.x) / 2,
            eye1.y + (this.do_kill ? -EYE_SIZE / 7 : EYE_SIZE / 4),
            eye2.x + eye2.width,
            eye2.y,
        ], .04)
    }
}

class Blob extends Effect {
    constructor(x, y, type, speed_x = 0, speed_y = 0, dir) {
        super(x, y, type)

        this.speed_x = speed_x
        this.speed_y = speed_y

        this.health = 1
        this.hit_flash = 20

        this.dir = dir

        this.momentum = .9
        this.damping = 150
        this.move_range = {min: 20, max: 90}
        this.stop_range = {min: 30, max: 100}
        this.move_timer = random(this.move_range.min, this.move_range.max)
        this.stop_timer = random(this.stop_range.min, this.stop_range.max)

        this.open = false
        this.eye_rot = 0

        this.eyes = {
            width: .3,
            height: .34
        }

        this.eyelid = 0
    }
    die() {
        this.walk = 0
        this.do_kill ++
        this.speed_x *= .6

        const splat = .04

        this.height -= splat
        this.width += splat
        this.x -= splat / 2
        this.y += splat

        if (this.height <= 0) this.kill = true
    }
    stop() {
        this.walk = 0

        if (this.move_timer < 0 && !this.in_air) {
            this.sit = true

            this.speed_x = 0
            this.open = true
            this.dir = 0

            this.move_timer = random(this.move_range.min, this.move_range.max)
        }
    }
    control() {
        if (this.dir) this.move_timer --
        else this.stop_timer --

        if (this.stop_timer < 0) {
            this.sit = false
            this.dir = Math.sign(hero.x - this.x)

            this.stop_timer = random(this.stop_range.min, this.stop_range.max)
        }
    }
    update() {
        super.update()
        if (this.dir) this.face = this.dir

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 2.5

        if (this.do_kill) this.die()
        this.control()

        this.collision()
    }
    draw() {
        const EYE_SIZE = .3 * (this.width + this.height) / 2
        const EYE = {
            from_center: .03,
            from_top: .14
        }
        const PUPIL_SIZE = .05

        const COLOR = rgb(160, 50, 0)

        const dist_x = this.width / 2
        const dist_y = this.height / 2
        const diagonal_dist = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y))
        const bump_dist = diagonal_dist - (this.width + this.height) / 2

        const bump = Math.abs(Math.sin(this.walk * 2) * bump_dist)
        if (Math.abs(this.walk) > Math.PI / 2) this.stop()

        const real = realPos(this.x + this.width / 2, this.y + this.height / 2 - bump)
        ctx.save()
        ctx.translate(real.x, real.y)
        ctx.rotate(this.walk)
        ctx.fillStyle = COLOR
        rotFillRect(-this.width / 2, -this.height / 2, this.width, this.height)
        ctx.restore()

        const features = () => {
            ctx.fillStyle = '#eef'
            const eye1 = flipRect(
                EYE.from_center,
                EYE.from_top,
                EYE_SIZE, EYE_SIZE,

                this.x + this.width / 2, this.y, -1, 1, false, true
            )
            const eye2 = flipRect(
                EYE.from_center,
                EYE.from_top,
                EYE_SIZE, EYE_SIZE,

                this.x + this.width / 2, this.y, 1, 1, false, true
            )

            const dist_x = (this.x + this.width / 2) - (hero.x + hero.width / 2)
            const dist_y = this.y - hero.y + hero.height
            const angle = Math.atan2(dist_y, dist_x) + Math.PI
            this.eye_rot = rotateSmooth(this.eye_rot, angle, {min: 0, max: Math.PI * 2})
            this.eye_rot += (angle - this.eye_rot) / 3
            this.eye_rot += random(-.1, .1, 0)
            
            const LIMIT = EYE_SIZE / 2 - PUPIL_SIZE / 2
            const center = {
                x_1: eye1.x - EYE_SIZE / 2 - PUPIL_SIZE / 2,
                y_1: eye1.y + EYE_SIZE / 2 - PUPIL_SIZE / 2,
                x_2: eye2.x + EYE_SIZE / 2 - PUPIL_SIZE / 2,
                y_2: eye2.y + EYE_SIZE / 2 - PUPIL_SIZE / 2
            }

            ctx.fillStyle = '#900'
            fillRect(
                center.x_1 + Math.cos(this.eye_rot + .1) * LIMIT,
                center.y_1 + Math.sin(this.eye_rot + .1) * LIMIT,
                PUPIL_SIZE, PUPIL_SIZE
            )
            fillRect(
                center.x_2 + Math.cos(this.eye_rot) * LIMIT,
                center.y_2 + Math.sin(this.eye_rot) * LIMIT,
                PUPIL_SIZE, PUPIL_SIZE
            )
            ctx.fillStyle = '#000'
            line([
                eye1.x - EYE_SIZE,
                eye1.y,
                eye1.x + (eye2.x + EYE_SIZE - eye1.x - EYE_SIZE) / 2,
                eye1.y + (this.do_kill ? -EYE_SIZE / 7 : EYE_SIZE / 4),
                eye2.x + EYE_SIZE,
                eye2.y,
            ], .04)

            // close & open eyes before and after rolling
            const speed = .03

            const shrink = this.stop_timer * speed
            if (shrink < EYE_SIZE) this.eyelid = EYE_SIZE - shrink
            if (this.eyelid > 0) this.open = false

            if (!this.open) {
                this.eyelid -= speed
                if (this.eyelid <= 0) {
                    this.eyelid = 0
                    this.open = true
                }
            }

            // Draw eyelid
            const pad = 1 / scale
            ctx.fillStyle = COLOR
            fillRect(
                this.x,
                this.y + EYE.from_top - pad,
                this.width,
                this.eyelid
            )
        }

        if (!this.do_kill && this.sit) features()
    }
}

class Crab extends Effect {
    constructor(x, y, type) {
        super(x, y, type)

        this.health = 40
        this.hit_flash = 10

        this.remain_dead = true

        this.momentum = .9
        this.damping = 90

        this.fake_height = 1.2
        this.offset_y = 0

        this.time = 0
        this.wobble = 0

        this.arm = {
            count: [],
            length: 1.4,
            snap_range: 100,
            snap_timer: 100,
            snapping_range: 100,
            snapping_timer: 100,
            do_damage: false
        }

        this.eye = {
            red: 0,
            angle: 0
        }
        this.alpha = 1

        this.generate()
    }

    generate() {
        const make_arm = val => {this.arm.count.push({
            angle: 0,
            claw: 0,
            goal: {arm: 0, claw: 0},
            val
        })}

        make_arm(-1)
        make_arm(1)
    }

    die() {
        if (!this.do_kill) {
            this.jump(.2)
            cam.boom(10, .1, .1)
        }
        this.do_kill ++
        this.momentum = .93
        this.speed_y += this.gravity
        this.walk += this.speed_x * 3
        this.do_hit = false
        this.arm.do_damage = false

        if (this.offset_y < this.height - this.fake_height)
            this.offset_y += this.do_kill / 2000
        else this.offset_y = this.height - this.fake_height

        const speed = .1 / (this.do_kill / 5 + 1)
        this.eye.angle += speed > .001 && speed

        for (let i = 0; i < this.arm.count.length; i ++) {
            const item = this.arm.count[i]
            item.goal.arm = 2 * item.val - Math.PI / 2

            item.angle += (item.goal.arm - item.angle) / 10
        }

        this.collision()
    }

    collide(obj) {
        if (!this.do_kill) {
            const dim = {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.fake_height
            }
            if (collide(dim, obj)) {
                const overlap = merge(obj, dim, obj.speed_y * 2)

                if (hero.in_recovery) {
                    if (hero.safe) return 'hit'
                }

                else {
                    if (overlap.x || overlap.y < 0) return 'loss'
                    return 'hit'
                }
            }

            // Claw Collision
            if (this.arm.do_damage) {
                const claw_size = 1

                for (let i = 0; i < this.arm.count.length; i ++) {
                    const item = this.arm.count[i]

                    const box = {
                        x: item.x - claw_size / 2,
                        y: item.y - claw_size,
                        width: claw_size,
                        height: claw_size
                    }

                    if (collide(box, obj)) {
                        obj.safe = true
                        return 'loss'
                    }
                }
            }
        }
    }

    update() {
        super.update()
        this.time += .1

        if (this.do_kill) {
            this.die()
            return
        }

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 3

        this.offset_y = Math.sin(this.walk * 2) * .1
        this.wobble = Math.abs(Math.sin(this.walk / 5)) / 10

        // DETECT IF DRILLO IS ON TOP
        const box = {
            x: this.x,
            y: this.y - 3,
            width: this.width
        }
        box.height = this.y - box.y

        if (collide(box, hero)) this.arm.snap_timer --
        else {
            this.arm.snap_timer = this.arm.snap_range
            this.arm.snapping_timer = this.arm.snapping_range
        }

        // ARM CALCULATIONS
        this.arm.do_damage = false
        const base_angle = Math.sin(this.walk * (this.wobble + 1)) * .7 - Math.PI / 2
        const base_claw = Math.sin(this.walk) * .2 - Math.PI / 2

        for (let i = 0; i < this.arm.count.length; i ++) {
            const item = this.arm.count[i]
            const new_angle = Math.PI / 7 * item.val
            const new_claw = Math.PI / 2 * item.val

            item.claw += (item.goal.claw - item.claw) / 5
            item.angle += (item.goal.arm - item.angle) / 5

            // Snapping
            if (this.arm.snap_timer <= 0) {
                item.goal.arm = base_angle - new_angle
                item.goal.claw = base_claw - new_claw

                this.arm.do_damage = true

                this.arm.snapping_timer --

                if (this.arm.snapping_timer <= 0) {
                    this.arm.snapping_timer = this.arm.snapping_range
                    this.arm.snap_timer = this.arm.snap_range
                }
            }

            // Normal
            else {
                item.goal.arm = base_angle + new_angle * 1.5
                item.goal.claw = base_claw
            }
        }

        // EYES
        const dis_x = (hero.x + hero.width / 2) - (this.x + this.width / 2)
        const dis_y = (hero.y + hero.height / 2) - (this.y + this.height / 2)
        this.eye.angle = Math.atan2(dis_y, dis_x)

        this.collision()
    }

    draw() {
        const LEG_WIDTH = .2
        const LEG_PIVOT = .4
        const FOOT_MOVE = .4
        const FOOT_LIFT = .3
        const KNEE_HEIGHT = .5
        const ARM_WIDTH = .2
        const EYE_DOWN = .3
        const EYE_SIZE = .6
        const PUPIL_SIZE = .15

        // amount of frames before attack
        const anger_point = 120
        const shake_point = 50

        const time = this.arm.snap_timer

        const anger = time < anger_point && (anger_point - time) / anger_point
        const shake = time < shake_point && time > 0 && !this.do_kill && random(-.1, .1, 0)

        const half = this.width / 2
        const center = this.x + half
        // LEG
        ctx.fillStyle = rgb(34,170,136,this.alpha)
        const leg = val => {
            const dir = Math.sign(val)
            const walk = this.walk + Math.sin(val * val + dir * 9) * 5

            const step = Math.cos(walk) < 0 && Math.cos(walk)
            const foot = {
                x: Math.sin(-walk) * FOOT_MOVE,
                y: step * FOOT_LIFT
            }
            const knee = {
                x: Math.sin(-walk) * FOOT_MOVE / 2,
                y: step * FOOT_LIFT
            }

            const x = center + val * half
            line([
                x,
                this.y + this.offset_y + this.fake_height - LEG_WIDTH / 2,
                x + knee.x + LEG_PIVOT * dir,
                this.y + this.height - KNEE_HEIGHT + knee.y,
                x + foot.x + LEG_PIVOT * dir,
                this.y + this.height + foot.y
            ], LEG_WIDTH)
        }

        leg(-.9)
        leg(-.6)
        leg(-.3)
        leg(.3)
        leg(.6)
        leg(.9)

        // ARM
        for (let i = 0; i < this.arm.count.length; i ++) {
            const item = this.arm.count[i]
            const val = item.val

            const x1 = center + val * (half - ARM_WIDTH / 2)
            const y1 = this.y + this.offset_y + this.fake_height / 2
            const x2 = x1 + Math.cos(item.angle + shake) * this.arm.length
            const y2 = y1 + Math.sin(item.angle + shake) * this.arm.length

            item.x = x2
            item.y = y2

            const snap = this.arm.do_damage ?
                Math.sin(this.time * 6 + val) * 2
                : Math.sin(this.walk * 2 * this.wobble + val) * 2 + 1.8
            const snap_rot = snap > .5 ? .5 : snap > 0 && snap

            // ARMS
            ctx.fillStyle = rgb(34,170,136,this.alpha)
            line([x1, y1, x2, y2], ARM_WIDTH)

            // CLAWS
            ctx.fillStyle = rgb(221,85,34,this.alpha)
            const real = realPos(x2, y2)
            ctx.save()
            ctx.translate(real.x, real.y)
            ctx.save()
            ctx.rotate(item.claw)
            rotFillRect(0, 0, .9, .5 * val)
            ctx.restore()
            ctx.save()
            ctx.rotate(item.claw - snap_rot * val)
            rotFillRect(0, 0, .8, -.2 * val)
            ctx.restore()
            ctx.restore()
        }

        // BODY
        ctx.fillStyle = this.do_hit ?
            rgb(...randomColor())
            : rgb(34,153,119,this.alpha)
        fillRect(this.x, this.y + this.offset_y, this.width, this.fake_height)

        // EYES
        const eye = val => {
            const dir = Math.sign(val)
            const eye_x = center + half * val
            const eye_y = this.y + this.offset_y + EYE_DOWN

            this.eye.red += (anger - this.eye.red) / 10

            const amount = this.eye.red * 150
            ctx.fillStyle = rgb(255,255 - amount,255 - amount,this.alpha)
            fillRect(eye_x, eye_y, EYE_SIZE * dir, EYE_SIZE)

            const ang = this.do_kill ? this.eye.angle * val * 9 : this.eye.angle

            const sum = EYE_SIZE / 2 - PUPIL_SIZE / 2
            const x = Math.cos(ang + shake) * sum
            const y = Math.sin(ang + shake) * sum

            ctx.fillStyle = rgb(0,0,0,this.alpha)
            fillRect(eye_x + sum * dir + x, eye_y + sum + y, PUPIL_SIZE * dir, PUPIL_SIZE)

            ctx.fillStyle = rgb(51,0,0,this.alpha)
            line([
                eye_x + EYE_SIZE * dir, eye_y,
                eye_x, eye_y + .1
            ], .1)
        }
        eye(-.3)
        eye(.3)
    }
}

class Hammer extends Effect {
    constructor(x, y, type) {
        super(x, y, type)

        this.health = 60
        this.hit_flash = 15
        this.gravity = .02

        this.momentum = .9
        this.damping = 330

        this.fake_height = 5.5
        this.offset_y = 0

        this.time = 0
        this.alpha = 1

        this.move = 0

        this.eye = {
            red: 0,
            angle: 0
        }

        this.arm = {
            hammer: {x: 0, y: 0},
            bash_range: 100,
            bash_timer: 100,
            upper: 0,
            fore: 0,
            down: 0,
            goal: {fore: 0, upper: 0, down: 0},
            speed: 0,
            time: 0
        }
    }

    die() {
        if (!this.do_kill) {
            this.jump(.3)
            cam.boom(20, .5, .5)

            for (let i = 0; i < 30; i ++) {
                const size = random(.05, 2, 0)
                game.particles.push(
                    new Cloud({
                        x: this.x + random(0, this.width, 0),
                        y: this.y + random(0, this.height, 0),
                        width: size,
                        height: size,
                        speed_x: random(-.2, .2, 0),
                        speed_y: random(-.2, .2, 0),
                        momentum: .95,
                        fade: .015,
                        gravity: 0,
                        fill: [20,10,0,.5],
                        stroke: [0,0,0,0]
                    })
                )
            }
        }
        this.do_kill ++

        this.speed_x *= .9
        this.speed_y += this.gravity
        this.walk += this.speed_x * 3
        this.arm.bash_timer = 100

        this.eye.angle += .1
        this.alpha -= .05

        this.collision()

        if (this.alpha <= 0) this.kill = true
    }

    collide(obj) {
        if (!this.do_kill) {
            const dim = {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.fake_height
            }

            if (collide(dim, obj)) {
                const overlap = merge(obj, dim, obj.speed_y * 2)

                if (hero.in_recovery) {
                    if (hero.safe) return 'hit'
                }

                else {
                    if (overlap.x || overlap.y < 0) return 'loss'
                    return 'hit'
                }
            }

            if (this.arm.bash_timer <= 0) {
                const HAMMER_WIDTH = this.width
                const HAMMER_HEIGHT = 3

                const item = this.arm.hammer

                const box = {
                    x: item.x - HAMMER_WIDTH / 2,
                    y: item.y - HAMMER_HEIGHT / 2,
                    width: HAMMER_WIDTH,
                    height: HAMMER_HEIGHT
                }

                if (collide(box, obj)) {
                    obj.safe = true
                    return 'loss'
                }
            }
        }
    }

    update() {
        super.update()
        this.time += .1

        if (this.do_kill) {
            this.die()
            return
        }

        this.speed_x += this.dir / this.damping
        this.speed_y += this.gravity
        this.walk += this.speed_x * 3

        this.offset_y = Math.cos(this.walk * 2) * .05

        const dis_x = (hero.x + hero.width / 2) - (this.x + this.width / 2)
        const dis_y = (hero.y + hero.height / 2) - (this.y + this.height / 4)
        this.eye.angle = Math.atan2(dis_y, dis_x)

        // DETECT IF DRILLO IS ON TOP
        const box = {
            x: this.x,
            y: this.y - 3,
            width: this.width
        }
        box.height = this.y - box.y

        if (collide(box, hero)) this.arm.bash_timer --
        else this.arm.bash_timer = this.arm.bash_range

        this.collision()

        // ARM CALCULATIONS
        const REST_SPEED = 10
        const BASH_SPEED = 10
        const END_SPEED = 50
        const PRECISION_BASH_SPEED = .6
        const PRECISION_REST_SPEED = 2

        if (this.arm.bash_timer <= 0) {
            const swing = Math.sin(this.arm.bash_timer / BASH_SPEED + Math.PI / 2)

            this.arm.goal.down = 1.3
            this.arm.goal.upper = 4.5 - Math.abs(swing)
            this.arm.goal.fore = 5.8 - Math.abs(swing)

            if (this.arm.speed > 1) this.arm.speed -= PRECISION_BASH_SPEED
            else this.arm.speed = 1

            if (swing < 0) {
                this.jump(.1)
                cam.boom(25, .4, .4)
                screen.fadeIn(.3, 10, [0, 0, 0, 0], 10)
                this.arm.speed = END_SPEED
                this.arm.bash_timer = this.arm.bash_range
            }
        }
        else {
            if (this.arm.speed > REST_SPEED) this.arm.speed -= PRECISION_REST_SPEED
            else this.arm.speed = REST_SPEED

            const walk = this.walk + Math.PI
            this.arm.goal.upper = Math.sin(walk) / 2 + 2.2
            this.arm.goal.fore = Math.cos(walk) / 2 + 1.3
            this.arm.goal.down = 2.1
        }
        
        this.arm.upper += (this.arm.goal.upper - this.arm.upper) / this.arm.speed
        this.arm.fore += (this.arm.goal.fore - this.arm.fore) / this.arm.speed
        this.arm.down += (this.arm.goal.down - this.arm.down) / this.arm.speed
    }

    draw() {
        const LEG_WIDTH = .25
        const LEG_LIFT = .3
        const LEG_MOVE = .3
        const KNEE_DOWN = 1
        const LEG_BEND = .8
        const EYE_SIZE = .8
        const EYE_DOWN = .5
        const PUPIL_SIZE = .12
        const ARM_WIDTH = .25
        const ARM_LENGTH = 1
        const FOREARM_LENGTH = 1.5
        const HANDLE_LENGTH = .3
        const HAMMER_HEIGHT = .6
        const HAMMER_LENGTH = 1

        const half = this.width / 2
        const center = this.x + half
        const y = this.y + this.offset_y + this.fake_height - LEG_WIDTH / 2

        const anger_point = 90
        const redness = 200

        const anger = (anger_point - this.arm.bash_timer) / anger_point
        this.eye.red += (anger - this.eye.red) / 20
        const red = this.eye.red * redness

        this.move += (Math.sign(this.speed_x) - this.move) / 20

        // LEGS
        ctx.fillStyle = rgb(110, 0, 0, this.alpha)
        const leg = val => {
            const dir = Math.sign(val)
            const walk = this.walk + Math.PI / 2 * dir

            const step = (val, lim = 0) => {return Math.sin(val) < lim ? Math.sin(val) : lim}

            const x = center + half * val - LEG_WIDTH / 2 * dir
            const foot_swing =
                step(walk) * Math.sin(walk) * LEG_BEND -
                Math.sin(walk + Math.PI / 2 * this.move) * .3

            const thigh_angle = walk
            const shin_angle = foot_swing + Math.PI / 2
            const foot_angle = step(walk) * Math.sin(walk)

            const knee_pos = this.fake_height + KNEE_DOWN
            const knee = {
                x: x + Math.cos(thigh_angle) * LEG_MOVE,
                y: this.y + step(thigh_angle, .2) * LEG_LIFT
            }

            const shin_length = this.height - knee_pos - LEG_WIDTH / 2
            const ankle = {
                x: Math.cos(shin_angle) * shin_length * this.move,
                y: Math.sin(shin_angle) * shin_length
            }

            const foot_length = .5
            const foot = {
                x: Math.cos(foot_angle) * foot_length * this.move,
                y: Math.sin(foot_angle) * foot_length
            }

            line([
                // hip
                x, y,

                // knee
                knee.x,
                knee_pos + knee.y,

                // ankle
                knee.x + ankle.x,
                knee_pos + knee.y + ankle.y,

                // foot
                knee.x + ankle.x + foot.x,
                knee_pos + knee.y + ankle.y + foot.y

            ], LEG_WIDTH)
        }

        leg(-.9)
        leg(.9)

        // BODY
        ctx.fillStyle = this.do_hit ? rgb(...randomColor()) : rgb(120, 0, 0, this.alpha)
        fillRect(this.x, this.y + this.offset_y, this.width, this.fake_height)

        // EYES
        const eye = val => {
            const dir = Math.sign(val)
            const eye_x = center + half * val
            const eye_y = this.y + this.offset_y + EYE_DOWN

            ctx.fillStyle = rgb(255, 255 - red, 255 - red, this.alpha)
            fillRect(eye_x, eye_y, EYE_SIZE * dir, EYE_SIZE)

            const sum = EYE_SIZE / 2 - PUPIL_SIZE / 2
            const x = Math.cos(this.eye.angle) * sum
            const y = Math.sin(this.eye.angle) * sum

            ctx.fillStyle = rgb(0, 0, 0, this.alpha)
            fillRect(eye_x + sum * dir + x, eye_y + sum + y, PUPIL_SIZE * dir, PUPIL_SIZE)

            ctx.fillStyle = rgb(0, 0, 0,this.alpha)
            line([
                eye_x + EYE_SIZE * dir, eye_y,
                eye_x, eye_y + .1
            ], .1)
        }

        eye(-.12)
        eye(.12)

        // ARMS
        const arm = (val, arm_angle, forearm_angle, down) => {
            const dir = Math.sign(val)
            const arm_x = center + half * val - ARM_WIDTH / 2 * dir
            const arm_y = this.y + this.offset_y + down

            const elbow = {
                x: arm_x + Math.cos(arm_angle) * ARM_LENGTH * -dir,
                y: arm_y + Math.sin(arm_angle) * ARM_LENGTH
            }
            const wrist = {
                x: Math.cos(forearm_angle) * FOREARM_LENGTH * -dir,
                y: Math.sin(forearm_angle) * FOREARM_LENGTH
            }

            ctx.fillStyle = rgb(110, 0, 0, this.alpha)
            line([
                arm_x, arm_y,
                elbow.x, elbow.y,
                elbow.x + wrist.x, elbow.y + wrist.y
            ], ARM_WIDTH)

            return {x: elbow.x + wrist.x, y: elbow.y + wrist.y, angle: forearm_angle}
        }

        const hammer = arm(-1, this.arm.upper, this.arm.fore, this.arm.down)
        const ball = arm(1, Math.sin(this.walk) / 2 + 2.2, Math.cos(this.walk) / 2 + 1.3, 2.1)

        this.arm.hammer = {...hammer}

        // HAMMER
        ctx.fillStyle = rgb(90, 0, 0, this.alpha)
        line([
            hammer.x, hammer.y,
            hammer.x - Math.cos(hammer.angle) * HANDLE_LENGTH,
            hammer.y - Math.sin(hammer.angle) * HANDLE_LENGTH
        ], ARM_WIDTH / .6)
        line([
            hammer.x, hammer.y,
            hammer.x + Math.cos(hammer.angle) * HAMMER_HEIGHT,
            hammer.y + Math.sin(hammer.angle) * HAMMER_HEIGHT
        ], HAMMER_LENGTH)

        // BALL
        ctx.fillStyle = rgb(110, 0, 0, this.alpha)
        const real = realPos(ball.x, ball.y)
        ctx.beginPath()
        ctx.arc(real.x, real.y, .35 * scale, 0, 7)
        ctx.fill()
    }
}