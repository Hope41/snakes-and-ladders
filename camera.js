'use strict'
class Camera {
    constructor(x, y) {
        this.x = x
        this.y = y

        this.momentum = .7
        this.damping = 10

        this.speed_x = 0
        this.speed_y = 0

        this.booms = []

        this.default = {
            type: hero,
            x: hero.width / 2,
            y: hero.height / 2
        }
        this.goal = {...this.default}
    }

    boom(time, x_shake, y_shake) {
        this.booms.push({time, shake: {x: x_shake, y: y_shake}})
    }

    update() {
        this.speed_x *= this.momentum
        this.speed_y *= this.momentum

        this.x += this.speed_x
        this.y += this.speed_y

        this.speed_x += (this.goal.type.x + this.goal.x - this.x) / this.damping
        this.speed_y += (this.goal.type.y + this.goal.y - this.y) / this.damping

        for (let i = 0; i < this.booms.length; i ++) {
            const item = this.booms[i]
            item.time --

            if (item.time > 0) {
                this.x += random(-item.shake.x, item.shake.x, 0)
                this.y += random(-item.shake.y, item.shake.y, 0)
            }
            else this.booms.splice(i, 1)
        }
    }
}