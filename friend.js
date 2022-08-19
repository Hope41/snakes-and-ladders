'use strict'
function makeFriend(x, y, stand = false) {
    game.friend = new Friend(x, y, stand)
}

class Friend extends Base {
    constructor(x, y, stand) {
        super(x, y)

        this.stand = stand

        if (stand) {
            this.speed_x = stand.x
            this.speed_y = stand.y
        }

        this.width = .4
        this.height = .46

        this.damping = 80
        this.momentum = .85
        this.gravity = .02

        this.color = '#ca0'
        this.eye = {x: 0, y: 0, goal: {x: 0, y: 0}, close: 0}
        this.goal = {}

        this.action_range = {min: 10, max: 40}
        this.action_timer = 5
        this.action_choice = 0
        this.action_do = 0

        /* The friend uses A* Path Finding to find to Drillo. */
        this.setPath()

        this.time = 1 // ---- time between each scan
        this.goal = {} // --- the next cell to reach
        this.timer = 0
    }

    setPath() {
        this.final_path = []
        this.active = [{
            index: posToIndex(
                Math.floor(this.x + this.width / 2),
                Math.floor(this.y + this.height / 2), map.width
            ),
            link: 'empty'
        }]
        this.closed = []
        this.index = 0

        this.target = this.calculateTarget()
    }

    trot(amount) {
        this.speed_x += amount / this.damping
    }

    actionReset() {
        this.action_do = 0
        this.action_timer = random(this.action_range.min, this.action_range.max)
    }

    blockCollision() {
        const sides = [
            {x: Math.floor(this.x), y: Math.floor(this.y), width: 1, height: 1},
            {x: Math.ceil(this.x), y: Math.floor(this.y), width: 1, height: 1},
            {x: Math.floor(this.x), y: Math.ceil(this.y), width: 1, height: 1},
            {x: Math.ceil(this.x), y: Math.ceil(this.y), width: 1, height: 1}
        ]
        for (let i = 0; i < sides.length; i ++) {
            const obj = sides[i]

            if (obj.x >= 0 && obj.x < map.width &&
                obj.y >= 0 && obj.y < map.height) {

                if (collide(this, obj) && inItem(map.array[obj.x + obj.y * map.width], 0) == BLOCK) {
                    const overlap = merge(this, obj, .25 - this.gravity)

                    if (overlap.x) {
                        this.x -= overlap.x
                        this.speed_x = 0
                        this.dir *= -1
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

    actorCollision() {
        for (let i = 0; i < game.effects.length; i ++) {
            const item = game.effects[i]

            if (item.collide(this) && !item.do_hit) {
                this.setPath()

                item.hit()
                cam.boom(10, .1, .1)

                this.jump(.2)
            }
        }
    }

    calculateTarget() {
        const x = Math.floor(hero.x + hero.width / 2)

        for (let y = Math.floor(hero.y + hero.height / 2); y < map.height; y ++)
            if (inItem(map.array[posToIndex(x, y + 1, map.width)], 0) == BLOCK)
                return posToIndex(x, y, map.width)
    }

    AICalculate() {
        this.timer --
        if (this.timer < 0) {
            /* --- START FRAME STEP --- */
            this.timer = this.time

            /* Define an array that contains all
            the active cells for the next frame */
            const new_active = []

            // Go through every active cell
            for (let i = 0; i < this.active.length; i ++) {
                const square = this.active[i]

                const set = direction => {
                    // Check if the cell can be placed where specified

                    /* Hit returns true if the current cell touches
                    a previously scanned cell, another active cell
                    or a cell that has recently been calculated. */
                    const hit =
                        this.active.find(cell => cell.index == direction) ||
                        this.closed.find(cell => cell.index == direction) ||
                        new_active.find(cell => cell.index == direction)

                    /* Closed.length defines the amount of steps it
                    has taken to get to this stage. In other words,
                    the scan has to reverse by that amount to get
                    back to the original source. */
                    if (inItem(map.array[direction], 0) != BLOCK && !hit)
                        new_active.push({index: direction, link: this.closed.length})
                }

                const check = direction => {
                    // Checks whether a cell should be placed to the left or right

                    if (inItem(map.array[direction + map.width], 0) == BLOCK ||
                        inItem(map.array[direction + map.width - 1], 0) == BLOCK ||
                        inItem(map.array[direction + map.width + 1], 0) == BLOCK)
                            set(direction)
                }

                const up = square.index - map.width // -----> up
                const down = square.index + map.width // ---> down
                const left = square.index - 1 // -----------> left
                const right = square.index + 1 // ----------> right

                // drop down holes
                set(down)

                // move left and right along ground
                check(left)
                check(right)

                // climb up walls and ladders
                if (inItem(map.array[up - 1], 0) == BLOCK ||
                    inItem(map.array[up + 1], 0) == BLOCK ||
                    inItem(map.array[square.index - 1], 0) == BLOCK ||
                    inItem(map.array[square.index + 1], 0) == BLOCK ||
                    inItem(map.array[up], 0) == LADDER) set(up)

                this.closed.push(square)

                /* When the scan reaches it's target or it hits Drillo on
                the way, calculate the final_path array. This array gives
                indices, one after the other, that go from Drillo to the
                friend. That's why the array is reversed at the bottom
                of this function. */
                const target = this.calculateTarget()
                if (square.index == this.target || square.index == target) {
                    if (square.index == target) this.target = target

                    let next = this.closed.length - 1
                    this.final_path = []

                    while (next >= 0) {
                        this.final_path.push(this.closed[next].index)
                        next = this.closed[next].link
                    }
                }
            }
            this.active = new_active

            /* --- END FRAME STEP --- */
        }

        this.final_path.reverse()
    }

    AIMove() {
        const bound = {
            x: this.x + this.width / 2,
            y: this.y + this.height - .5
        }

        // override path follow if collides with Drillo
        if (Math.floor(bound.x) == Math.floor(hero.x) &&
            Math.floor(bound.y) == Math.floor(hero.y)) this.setPath()

        if (this.final_path.length) {
            const pos = indexToPos(this.final_path[this.index], map.width)
            this.goal.x = pos.x + .5
            this.goal.y = pos.y + .5

            const range_x = Math.abs(this.speed_x)
            const range_y = Math.abs(this.speed_y)

            if (this.x > pos.x - range_x && this.x + this.width < pos.x + 1 + range_x &&
                this.y > pos.y - range_y && this.y + this.height < pos.y + 1 + range_y) {
                    this.index ++

                    if (this.index > this.final_path.length - 1) this.setPath()
                }

            else {
                const dis_x = this.goal.x - bound.x
                const dis_y = this.goal.y - bound.y
                const angle = Math.atan2(dis_y, dis_x)
    
                const x = Math.cos(angle)
                const y = Math.sin(angle)
    
                // up and down
                if (Math.abs(y) > Math.abs(x)) {
                    if (y > 0) this.speed_x = dis_x / 5

                    else {
                        this.speed_y = -.1
                        this.speed_x = dis_x / 5

                        this.eye.goal = {x: .5, y: -1}
                    }
                }

                // left and right
                else {
                    const dis = (Math.ceil(this.y + this.height / 2) - this.height) - this.y
                    this.speed_y = dis / 5
                    this.trot(x)
                }
            }
        }
    }

    update() {
        super.update()

        this.y += this.speed_y
        this.x += this.speed_x
        this.speed_x *= this.momentum
        this.speed_y += this.gravity

        this.blockCollision()

        if (!spoken.friend) return

        this.actorCollision()

        if (!this.stand) {
            if (!this.final_path.length) this.AICalculate()
            this.AIMove()
        }
    }

    draw() {
        const EYE_SIZE = .12
        const EYE_OUT = .02
        const PUPIL_SIZE = .053
        const BODY_HEIGHT = .4
        const FOOT_OUT = .1
        const ARM_WIDTH = .065
        const ARM_HEIGHT = .16

        const arm = value => {
            const pos = {
                x: this.x + this.width / 2 + (this.width / 2 - ARM_WIDTH / 2) * value,
                y: this.y + BODY_HEIGHT / 3
            }

            const speed = Math.abs(this.speed_y) > this.gravity && this.speed_y
            const _rot = -Math.abs(speed) * 10
            const rot = _rot < -2 ? -2 : _rot > 0 ? 0 : _rot

            const real = realPos(pos.x, pos.y)
            ctx.fillStyle = '#555'
            ctx.save()
            ctx.translate(real.x, real.y)
            ctx.rotate(rot * value)
            rotFillRect(-ARM_WIDTH / 2, 0, ARM_WIDTH, ARM_HEIGHT)
            ctx.restore()
        }

        arm(-1)
        arm(1)

        ctx.fillStyle = this.color
        fillRect(this.x, this.y, this.width, BODY_HEIGHT)

        const move = moveToward(this.eye, this.eye.goal, .3)

        this.action_timer --
        if (this.action_timer < 0) {
            if (!this.action_do) this.action_choice = random(0, 100)
            this.action_do ++

            // Eye Horizontal
            if (this.action_choice <= 40) {
                if (this.action_do == 1)
                    this.eye.goal.x = random(-1, 1, 0)

                if (move == 'hit') this.actionReset()
            }

            // Eye Vertical
            else if (this.action_choice <= 80) {
                if (this.action_do == 1)
                    this.eye.goal.y = random(-1, 1, 0)

                if (move == 'hit') this.actionReset()
            }

            // Blink
            else if (this.action_choice <= 100) {
                this.eye.close = Math.cos(this.action_do / 7) * 1.1

                if (this.eye.close <= 0) {
                    this.eye.close = 0
                    this.actionReset()
                }
            }
        }
        const eye = value => {
            const pos = {
                x: this.x + this.width / 2 + (EYE_OUT + EYE_SIZE / 2) * value,
                y: this.y + .1 + EYE_SIZE / 2
            }
            ctx.fillStyle = '#fff'
            fillRect(pos.x - EYE_SIZE / 2, pos.y - EYE_SIZE / 2, EYE_SIZE, EYE_SIZE)

            const limit = EYE_SIZE / 2 - PUPIL_SIZE / 2
            ctx.fillStyle = '#000'
            fillRect(
                pos.x - PUPIL_SIZE / 2 + this.eye.x * limit,
                pos.y - PUPIL_SIZE / 2 + this.eye.y * limit,
                PUPIL_SIZE, PUPIL_SIZE
            )

            ctx.fillStyle = this.color
            fillRect(this.x, pos.y - EYE_SIZE / 2, this.width, this.eye.close * EYE_SIZE)
        }
        eye(-1)
        eye(1)

        const foot = value => {
            const FOOT_SIZE = this.height - BODY_HEIGHT

            const pos = {
                x: this.x + this.width / 2 + (FOOT_OUT + FOOT_SIZE / 2) * value,
                y: this.y + BODY_HEIGHT
            }

            ctx.fillStyle = '#555'
            fillRect(
                pos.x - FOOT_SIZE / 2,
                pos.y, FOOT_SIZE,
                Math.abs(Math.sin(time / 3 + value * Math.PI / 4) * FOOT_SIZE))
        }

        foot(-1)
        foot(1)
    }
}