'use strict'
class Screen {
    constructor() {
        this.bg = [0, 0, 0, 0]
        this.change = 2.2

        this.closest = {
            item: 0,
            type: '',

            angle: 0,
            rot_speed: 0,
            momentum: .9,
            damping: 100,

            fade: 0
        }

        this.set()

        this.bg_cvs = document.createElement('canvas')
        this.bg_ctx = this.bg_cvs.getContext('2d')

        this.health_momentum = .8
        this.health_damping = 10
        this.health = []
        this.center = {
            x: 0,
            speed: 0,
            momentum: .7,
            damping: 10
        }

        this.filter = [0, 0, 0, 0]

        this.fade = {use: false}

        this.end = {
            white: 255,
        }
    }

    generateBackground() {
        if (game.level == game.end_level) {
            this.bg_cvs.width = cvs.width
            this.bg_cvs.height = cvs.height

            this.bg_ctx.fillStyle = '#000'
            this.bg_ctx.fillRect(0, 0, this.bg_cvs.width, this.bg_cvs.height)
        }
        else {
            this.bg_cvs.width = cvs.width
            this.bg_cvs.height = cvs.height
            this.bg_ctx.clearRect(0, 0, cvs.width, cvs.height)

            const big = cvs.width > cvs.height ? cvs.width : cvs.height
            const small = cvs.width > cvs.height ? cvs.height : cvs.width

            const h_blocks = 150
            const v_blocks = h_blocks / (big / small)

            const width = cvs.width / Math.floor(h_blocks)
            const height = cvs.height / Math.floor(v_blocks)

            for (let x = 0; x < h_blocks; x ++) {
                for (let y = 0; y < v_blocks; y ++) {
                    this.bg_ctx.fillStyle = rgb(0, 0, 0, random(0, .022, 0))
                    this.bg_ctx.fillRect(x * width, y * height, width, height)
                }
            }
        }
    }

    set() {
        const rgb = colorChange(this.change)
        const alpha = (game.level - 1) / 50 + .1

        this.bg[0] = rgb[0]
        this.bg[1] = rgb[1]
        this.bg[2] = rgb[2]
        this.bg[3] = alpha > .5 ? .5 : alpha

        this.change += .2
    }

    calcClosest() {
        const close = {
            dist: 'none',
            type: 'none',
            i: 0,
        }

        const think = (index, item, type) => {
            const dist_x = cam.x - item.x
            const dist_y = cam.y - item.y
            const dist = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y))

            if (close.dist == 'none' || close.dist > dist) {
                close.dist = dist
                close.i = index
                close.type = type
            }
        }

        for (let i = 0; i < game.points.length; i ++) think(i, game.points[i], 'point')
        for (let i = 0; i < game.upgrades.length; i ++) think(i, game.upgrades[i], 'upgrade')

        if (close.type == 'point') this.closest.item = game.points[close.i]
        if (close.type == 'upgrade') this.closest.item = game.upgrades[close.i]
        this.closest.type = close.type
    }

    fadeIn(max, speed, color, smoothness) {
        this.fade.use = true

        this.filter[0] += (color[0] - this.filter[0]) / smoothness
        this.filter[1] += (color[1] - this.filter[1]) / smoothness
        this.filter[2] += (color[2] - this.filter[2]) / smoothness

        if (this.filter[3] < max) this.filter[3] += speed
        if (this.filter[3] > max) this.filter[3] = max
    }

    fadeOut(speed, color, smoothness) {
        this.fade.use = true

        this.filter[0] += (color[0] - this.filter[0]) / smoothness
        this.filter[1] += (color[1] - this.filter[1]) / smoothness
        this.filter[2] += (color[2] - this.filter[2]) / smoothness

        if (this.filter[3] > 0) this.filter[3] -= speed
        if (this.filter[3] < 0) this.filter[3] = 0
    }

    update() {
        if (!this.fade.use) this.fadeOut(.01, [0, 0, 0], 10)

        if (hero.point.state) {
            if (!game.points.length && !game.upgrades.length) this.closest.item = 0
            else this.calcClosest()
        }

        this.fade.use = false
    }

    drawBack() {
        const speed = .3

        const width = (cvs.width / scale) / speed
        const height = (cvs.height / scale) / speed

        const cam_x = (cam.x % width + width) % width
        const cam_y = (cam.y % height + height) % height

        const x = -cam_x * scale * speed
        const y = -cam_y * scale * speed

        ctx.drawImage(this.bg_cvs, x, y)
        ctx.drawImage(this.bg_cvs, x + cvs.width, y)
        ctx.drawImage(this.bg_cvs, x, y + cvs.height)
        ctx.drawImage(this.bg_cvs, x + cvs.width, y + cvs.height)
    }

    drawMid() {
        ctx.fillStyle = rgb(this.filter[0], this.filter[1], this.filter[2], this.filter[3])
        ctx.fillRect(0, 0, cvs.width, cvs.height)
    }

    draw() {
        const COLOR = game.level == game.end_level ? '#fff' : '#000'

        // Health
        const health = {
            distance: scale / 2.4,
            width: scale / 3.7,
            height: scale / 2.5
        }
        const font_pad = 5
        const font_size = scale / 2.5

        const center = cvs.width / 2 - hero.health / 2 * health.distance

        if (!this.center.x) this.center.x = cvs.width / 2
        this.center.speed *= this.center.momentum
        this.center.x += this.center.speed / this.center.damping
        this.center.speed -= this.center.x - center

        for (let i = 0; i < this.health.length; i ++) {
            if (this.health[i].size >= 1 && this.health[i].state == 'grow')
                this.health[i].state = 'norm'

            this.health[i].speed *= this.health_momentum
            this.health[i].size += this.health[i].speed / this.health_damping

            if (this.health[i].state == 'die') {
                this.health[i].speed -= .1 / this.health[i].size

                if (this.health[i].size <= 0) {
                    this.health.pop()
                    continue
                }
            }
            else this.health[i].speed += 1 - this.health[i].size

            const w = health.width * this.health[i].size
            const h = health.height * this.health[i].size

            ctx.fillStyle = COLOR
            ctx.fillRect(
                (this.center.x + i * health.distance) - w / 2,
                health.distance - h / 2,
                w, h
            )
        }

        // make health get bigger and smaller
        for (let i = 0 ; i < (this.health.length || 1); i ++) {
            const state = this.health.length ? this.health[this.health.length - 1].state : 'norm'

            if (state == 'norm') {
                if (this.health.length < hero.health)
                    this.health.push({size: 0, speed: 0, state: 'grow'})

                else if (this.health.length > hero.health)
                    this.health[this.health.length - 1].state = 'die'
            }
        }

        ctx.fillStyle = COLOR
        ctx.font = font_size + 'px monospace'
        // Level
        const text = 'LEVEL ' + game.level
        const width = ctx.measureText(text).width
        ctx.fillText(
            text,
            cvs.width - width - font_pad * 2,
            font_size + font_pad
        )

        // Points
        ctx.fillText(
            (game.points_collected + game.upgrades_collected) + '/' +
            (game.points_max + game.upgrades_max) + ' COINS',
            font_pad * 2,
            font_size + font_pad
        )

        // Upgrades & Power-ups
        let upg_text = ''
        const _type = hero.upgrade_past[hero.upgrade_past.length - 1].type
        if (_type == 'pound') upg_text = 'Ground Pound'
        if (_type == 'point') upg_text = 'Coin Location'
        if (_type == 'jet') upg_text = 'Jetpack'

        ctx.fillStyle = COLOR
        ctx.fillText('UPG ' + upg_text, font_pad * 2, (font_size + font_pad) * 2)

        let pow_text = ''

        const add = (text, mid) => {
            let str = ''
            if (mid) str += ' / '
            pow_text += text + str
        }

        for(let i = 0; i < hero.power_past.length; i ++) {
            const type = hero.power_past[i].type
            const mid = (i < hero.power_past.length - 1)

            if (type == 'shield') add('Shield', mid)
            else if (type == 'super pound') add('Super Pound', mid)
        }

        ctx.fillText('PWR ' + pow_text, font_pad * 2, (font_size + font_pad) * 3)

        // Point Search Upgrade
        if (hero.point.state && this.closest.item) {
            const arrowTo = (item, color) => {
                const dist_x = (cam.x - hero.width / 2) - (item.x - hero.width / 2)
                const dist_y = (cam.y - hero.height / 2) - (item.y - hero.height / 2)
                const dist = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y))

                const smallest = cvs.width < cvs.height ? cvs.width / 3 : cvs.height / 3
                const fade_dist = (dist - 1) * scale

                const _fade = (fade_dist - smallest) / 400
                const fade = _fade > 1 ? 1 : _fade

                const size = scale / 6

                let angle = Math.atan2(dist_y, dist_x)
                const bit = Math.PI / 2

                if (this.closest.angle > bit && angle < -bit) angle += Math.PI * 2
                else if (this.closest.angle < -bit && angle > bit) angle -= Math.PI * 2

                this.closest.fade += (fade - this.closest.fade) / 10
                this.closest.angle += this.closest.rot_speed
                this.closest.rot_speed *= this.closest.momentum
                this.closest.rot_speed += (angle - this.closest.angle) / this.closest.damping

                ctx.strokeStyle = rgb(
                    color[0],
                    color[1],
                    color[2],
                    this.closest.fade * color[3]
                )
                ctx.lineWidth = scale / 15
                ctx.save()
                ctx.beginPath()
                ctx.translate(
                    cvs.width / 2 - Math.cos(this.closest.angle) * smallest,
                    cvs.height / 2 - Math.sin(this.closest.angle) * smallest
                )
                ctx.rotate(this.closest.angle)
                ctx.moveTo(size, size)
                ctx.lineTo(0, 0)
                ctx.lineTo(size, -size)
                ctx.stroke()
                ctx.restore()
            }
            if (this.closest.type == 'point') arrowTo(this.closest.item, [200, 100, 10, 1])
            else if (this.closest.type == 'upgrade') arrowTo(this.closest.item, [10, 200, 0, 1])
        }
    }
}