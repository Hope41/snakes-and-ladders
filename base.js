'use strict'
class Base {
    constructor (x, y) {
        this.x = x
        this.y = y

        this.dir = 0
        this.walk = 0
        this.speed_x = 0
        this.speed_y = 0
        this.in_air = false

        this.x_max = .5
        this.y_max = .4
    }

    jump(force = .12) {
        this.speed_y = -force
        this.in_air = true
    }

    update() {
        if (this.speed_x > this.x_max) this.speed_x = this.x_max
        else if (this.speed_x < -this.x_max) this.speed_x = -this.x_max
        if (this.speed_y > this.y_max) this.speed_y = this.y_max
        else if (this.speed_y < -this.y_max) this.speed_y = -this.y_max
    }
}