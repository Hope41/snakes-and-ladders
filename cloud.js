'use strict'
class Cloud {
    constructor(dic) {
        this.x = dic.x
        this.y = dic.y
        this.width = dic.width
        this.height = dic.height
        this.grow = dic.grow || 1
        this.speed_x = dic.speed_x
        this.speed_y = dic.speed_y
        this.momentum = dic.momentum
        this.fade = dic.fade
        this.fade_time = dic.fade_time || 0
        this.gravity = dic.gravity
        this.fill = dic.fill
        this.stroke = dic.stroke
        this.stroke_width = dic.stroke_width || .06
    }

    update() {
        // Momentum can be an object or a variable
        const momentum = {
            x: this.momentum > 0 ? this.momentum : this.momentum.x, 
            y: this.momentum > 0 ? this.momentum : this.momentum.y
        }

        ctx.fillStyle = rgb(
            this.fill[0],
            this.fill[1],
            this.fill[2],
            this.fill[3]
        )
        ctx.strokeStyle = rgb(
            this.stroke[0],
            this.stroke[1],
            this.stroke[2],
            this.stroke[3]
        )
        
        this.x += this.speed_x
        this.y += this.speed_y
        this.speed_x *= momentum.x
        this.speed_y *= momentum.y

        this.speed_y += this.gravity
        this.width *= this.grow
        this.height *= this.grow

        if (this.fill[3] > 0) fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width, this.height
        )

        if (this.stroke[3] > 0) {
            const total = (this.width + this.height) * this.stroke_width
            ctx.lineWidth = total * scale
            fillRect(
                (this.x - this.width / 2) + total / 2,
                (this.y - this.height / 2) + total / 2,
                this.width - total, this.height - total, true
            )
        }

        this.fade_time --

        if (this.fade_time <= 0) {
            // fade colours
            this.fill[3] -= this.fade
            this.stroke[3] -= this.fade

            // remove if not visible
            if (this.fill[3] <= 0 && this.stroke[3] <= 0) this.kill = true
        }
    }
}