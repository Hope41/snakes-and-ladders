'use strict'

const LEVEL_SIZES = [
    10, 10, // 1 
    15, 15, // 2
    30, 30, // 3
    30, 30, // 4
    35, 35, // 5
    30, 30, // 6
    40, 40, // 7
    40, 40, // 8
    40, 40, // 9
    50, 50, // 10
    50, 50, // 11
]
class Game {
    constructor () {
        this.set()

        this.level = 1
        this.end_level = 12
        this.friend_level = 8
        this.end_timer = 0
        this.circle = 1
        this.exit = false

        this.hero = {health: hero.health}
        this.rememberUpgrade()
    }

    start() {
        setLevelEffects()
        map.set()
    }

    set() {
        this.effects = []
        this.points = []
        this.upgrades = []
        this.powers = []
        this.particles = []
        this.shots = []
        this.door = []
        this.orb = 0
        this.friend = 0

        this.points_max = 0
        this.upgrades_max = 0
        this.points_collected = 0
        this.upgrades_collected = 0

        this.effect_arr = []
        this.effect_index = 0
    }

    endLevel() {
        const light_point = this.orb ? {x: this.orb.x, y: this.orb.y} : {x: hero.x, y: hero.y}

        const dis_x = light_point.x - hero.x
        const dis_y = light_point.y - hero.y

        const _glow = Math.abs(dis_x * dis_x + dis_y * dis_y) / 40
        const glow = _glow > 5? 5 : _glow
        
        const grad = ctx.createRadialGradient(
            cvs.width / 2, cvs.height / 2, cvs.height / 40,
            cvs.width / 2, cvs.height / 2, cvs.width / (glow<1?1:glow)
        )

        grad.addColorStop(0, '#0000')
        grad.addColorStop(1, '#000')

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, cvs.width, cvs.height)

        if (!this.orb) {
            this.end_timer ++

            if (this.end_timer > 100) {
                const size = cvs.width > cvs.height ? cvs.width : cvs.height
                if (this.circle < size / 2) {
                    this.circle *= 1.04

                    ctx.fillStyle = rgb(255,255,255,this.circle/20)

                    ctx.beginPath()
                    ctx.arc(cvs.width / 2, cvs.height / 2, this.circle, 0, 7)
                    ctx.fill()
                }
                else {
                    this.exit = true
                    endGame()
                }
            }
        }
    }

    rememberUpgrade() {
        this.hero.upgrade_number = hero.upgrade_number
        this.hero.upgrade_past = [...hero.upgrade_past]
    }

    applyUpgrade() {
        hero.upgrade_number = this.hero.upgrade_number
        hero.upgrade_past = []
        for (let i = 0; i < this.hero.upgrade_past.length; i ++)
            hero.upgrade_past.push(this.hero.upgrade_past[i])
        hero.upgradeSort()
    }

    reloadLevel() {
        hero.set()
        if (this.hero.health < 5) this.hero.health = 5
        hero.health = this.hero.health

        this.set()
        this.applyUpgrade()

        map.reload()
    }

    nextLevel() {
        this.level ++
        screen.set()
        hero.set()

        this.hero.health = hero.health

        this.set()
        this.rememberUpgrade()
        map.set()
    }

    resize() {
        scale = calcScale()
        comment.setChatBox()
        screen.generateBackground()
    }

    update() {
        const talking = comment.active
        screen.drawBack()

        cam.update()

        if (this.orb) {
            if (this.orb.kill) this.orb = 0
            else {
                if (!talking) this.orb.update()

                const real = realPos(this.orb.x, this.orb.y)
                if (real.x > 0 && real.x < cvs.width &&
                    real.y > 0 && real.y < cvs.height)
                        this.orb.draw()
            }
        }

        map.draw()

        time += .4

        const real_ = realPos(this.door.x, this.door.y)
        if (real_.x > -this.door.width * scale && real_.x < cvs.width &&
            real_.y > -this.door.height * scale && real_.y < cvs.height) {
                if (talking) this.door.draw()
                else this.door.update()
        }

        screen.drawMid()
        
        for (let i = 0; i < this.particles.length; i ++) {
            const item = this.particles[i]

            if (item.kill) {
                this.particles.splice(i, 1)
                i --
            }

            item.update()
        }

        for (let i = 0; i < this.effects.length; i ++) {
            const item = this.effects[i]

            // remove side effect
            if (item.kill) {
                this.effects.splice(i, 1)
                i --
            }

            // check if they are on the screen
            const real = realPos(item.x, item.y)
            if (real.x > -item.width * scale && real.x < cvs.width &&
                real.y > -item.height * scale && real.y < cvs.height) {
                    if (talking) item.draw()
                    else item.update()
            }

            else if (item.do_kill && !item.remain_dead) item.kill = true
        }
        
        if (talking) hero.draw()
        else hero.update()


        if (this.friend) {
            const item = this.friend
            const real = realPos(item.x, item.y)
            if (real.x > -item.width * scale && real.x < cvs.width &&
                real.y > -item.height * scale && real.y < cvs.height) {

                    if (talking) item.draw()
                    else {
                        item.update()
                        item.draw()
                    }
                }
            else item.update()
        }


        for (let i = 0; i < this.points.length; i ++) {
            const item = this.points[i]

            if (item.kill) {
                this.points.splice(i, 1)
                i --
            }
            const real = realPos(item.x, item.y)

            if (real.x > -item.width * scale && real.x < cvs.width &&
                real.y > -item.height * scale && real.y < cvs.height) {
                    if (talking) item.draw()
                    else item.update()
            }
        }

        for (let i = 0; i < this.upgrades.length; i ++) {
            const item = this.upgrades[i]

            if (item.kill) {
                this.upgrades.splice(i, 1)
                i --
            }
            const real = realPos(item.x, item.y)

            if (real.x > -item.width * scale && real.x < cvs.width &&
                real.y > -item.height * scale && real.y < cvs.height) {
                    if (talking) item.draw()
                    else item.update()
            }
        }

        for (let i = 0; i < this.powers.length; i ++) {
            const item = this.powers[i]

            if (item.kill) {
                this.powers.splice(i, 1)
                i --
            }
            const real = realPos(item.x, item.y)

            if (real.x > -item.width * scale && real.x < cvs.width &&
                real.y > -item.height * scale && real.y < cvs.height) {
                    if (talking) item.draw()
                    else item.update()
            }
        }

        for (let i = 0; i < this.shots.length; i ++) {
            const item = this.shots[i]

            // remove side effect
            if (item.kill) {
                this.shots.splice(i, 1)
                i --
            }

            // check if they are on the screen
            const real = realPos(item.x, item.y)
            if (real.x > -item.width * scale && real.x < cvs.width &&
                real.y > -item.height * scale && real.y < cvs.height)
                    item.draw()
            item.update()
        }

        screen.update()
        screen.draw()

        if (this.level == this.end_level) this.endLevel()

        if (talking) comment.update()
    }
}
