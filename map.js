'use strict'
const AIR = 0
const TEMPORARY_AIR = 1
const BLOCK = 2
const LADDER = 3
const TEMPORARY_LADDER = 4
const CHAT_BOX = 5

// gap between each chamber
const GAP = 0

function inItem (item, index = 0) {
    /* if the inputted item is an array, inItem()
    finds the specified thing inside it. Otherwise,
    it just returns the item again. This function
    is used for getting data from every block. */

    if (item.length) {
        if (index >= item.length) throw 'map.js inItem() Index must be within the array!'
        return item[index]
    }
    return item
}

function chatBox(x, y, width, height, text) {
    for (let i = 0; i < width * height; i ++) {
        const pos = indexToPos(i, width)
        const index = posToIndex(x + pos.x, y + pos.y, map.width)
        if (index > map.chat_array.length || index < 0) continue

        map.chat_array[index] = [CHAT_BOX, text]
    }
}

class Map {
    constructor() {
        this.array = []
        this.chat_array = []
        this.actors = []

        this.width = 0
        this.height = 0
    }

    reload() {
        if (game.level == game.end_level) this.end_generate()
        else {
            this.actors.forEach(item => {
                if (item[2] == 'effect') makeSideEffect(item[0], item[1], item[3])
                else if (item[2] == 'friend') makeFriend(item[0], item[1])
                else if (item[2] == 'point') {
                    game.points.push(new Point(item[0], item[1]))
                    game.points_max ++
                }
                else if (item[2] == 'upgrade') {
                    game.upgrades.push(new Upgrade(item[0], item[1]))
                    game.upgrades_max ++
                }
                else if (item[2] == 'door') game.door = new Door(item[0], item[1])
            })
        }
    }

    makeBlock() {
        const _cvs = document.createElement('canvas')
        const _ctx = _cvs.getContext('2d')

        const h_blocks = 10
        const v_blocks = 10
        _cvs.width = h_blocks
        _cvs.height = v_blocks

        const size_x = _cvs.width / h_blocks
        const size_y = _cvs.height / v_blocks

        // concrete
        const visibilaty = .2
        const main = 10
        const base = main + 120 * (1 + visibilaty - screen.bg[3])
        const transparency = .8
        const alpha_bleed = .2
        const color_bleed = .2
        const r = screen.bg[0] * color_bleed
        const g = screen.bg[1] * color_bleed
        const b = screen.bg[2] * color_bleed

        for (let x = 0; x < h_blocks; x ++) {
            for (let y = 0; y < v_blocks; y ++) {
                _ctx.fillStyle = rgb(
                    base + r,
                    base + g,
                    base + b,
                    transparency + random(-alpha_bleed, alpha_bleed, 0)
                )

                _ctx.fillRect(x * size_x, y * size_y, size_x, size_y)

                // moss
                if (!random(0, random(20, 100))) {
                    _ctx.fillStyle = rgb(random(30, 50), random(50, 150), 0, random(.2, .4, 0))
                    _ctx.fillRect(x * size_x, y * size_y, size_x, size_y)
                }

                // flower
                if (!random(0, 600)) {
                    const core = {x: x - 2, y: y - 2}
                    const petal = {
                        top: {x: core.x, y: core.y - 1},
                        bottom: {x: core.x, y: core.y + 1},
                        left: {x: core.x - 1, y: core.y},
                        right: {x: core.x + 1, y: core.y}
                    }

                    _ctx.fillStyle = rgb(random(150, 230), random(0, 60), random(50, 120), .2)
                    _ctx.fillRect(petal.top.x * size_x, petal.top.y * size_y, size_x, size_y)
                    _ctx.fillRect(petal.bottom.x * size_x, petal.bottom.y * size_y, size_x, size_y)
                    _ctx.fillRect(petal.left.x * size_x, petal.left.y * size_y, size_x, size_y)
                    _ctx.fillRect(petal.right.x * size_x, petal.right.y * size_y, size_x, size_y)

                    _ctx.fillStyle = rgb(random(200, 220), random(140, 160), 0, .5)
                    _ctx.fillRect(core.x * size_x, core.y * size_y, size_x, size_y)
                }
            }
        }

        return _cvs
    }

    makeScaryBlock() {
        const _cvs = document.createElement('canvas')
        const _ctx = _cvs.getContext('2d')

        const h_blocks = 7
        const v_blocks = 7
        _cvs.width = h_blocks
        _cvs.height = v_blocks

        const size_x = _cvs.width / h_blocks
        const size_y = _cvs.height / v_blocks

        for (let x = 0; x < h_blocks; x ++) {
            for (let y = 0; y < v_blocks; y ++) {
                const gray = random(60, 65)

                _ctx.fillStyle = rgb(gray, gray, gray)
                _ctx.fillRect(x * size_x, y * size_y, size_x, size_y)
            }
        }

        return _cvs
    }

    set() {
        let world = {width: 0, height: 0}

        // Set basic world size
        const end = (game.level == game.end_level)
        if (end) world = {width: 65, height: 17}
        else {
            const lev = game.level - 1
            world = {width: LEVEL_SIZES[lev * 2], height: LEVEL_SIZES[lev * 2 + 1]}
        }

        // Get size range for each chamber
        const EFFECT = EFFECT_TYPES[getLevelEffects()[0]]
        const MIN_WIDTH = Math.ceil(EFFECT.width.max) * 2
        const MIN_HEIGHT = Math.ceil(EFFECT.height.max)
        const CHAMBER_W = {min: MIN_WIDTH + 1, max: MIN_WIDTH + 10}
        const CHAMBER_H = {min: MIN_HEIGHT + 3, max: MIN_HEIGHT + 5}

        // Change the world size if it's too small
        const W_MIN = (CHAMBER_W.max + GAP) * 3
        const H_MIN = (CHAMBER_H.max + GAP) * 2
        if (world.width < W_MIN) world.width = W_MIN
        if (world.height < H_MIN) world.height = H_MIN
        this.width = world.width
        this.height = world.height

        for (let i = 0; i < world.width * world.height; i ++) this.chat_array[i] = AIR

        if (end) this.end_generate()
        else {
            setLevelEffects()
            this.generate(CHAMBER_W, CHAMBER_H)
        }
    }

    generate(WIDTH, HEIGHT) {
        // Generate Block Image
        const block_images = []
        const amount_of_images = 20
        for (let i = 0; i < amount_of_images; i ++)
            block_images.push(this.makeBlock())

        // setting
        const width = this.width
        const height = this.height
        this.actors = []
        this.array = []
        const coin_gap = {min: 1, max: 3}

        for (let i = 0; i < width * height; i ++)
            this.array[i] = [
                BLOCK, // ---------------------------------------> type
                random(0, 4), // --------------------------------> rotation
                block_images[random(0, amount_of_images)] // ----> image
            ]

        // define chamber variables
        let chamber_x = 1
        let chamber_y = 1
        let chamber_width = 1
        let chamber_height = 1
        const chambers = []
        const grid = {width: 0, height: 0}

        // create progress functions
        const makeChambers = () => {
            while (true) {
                grid.width ++

                if (grid.width * (WIDTH.max + GAP) + (WIDTH.max + GAP) * 2 >= width) {
                    grid.width ++
                    break
                }
            }
            while (true) {
                grid.height ++

                if (grid.height * (HEIGHT.max + GAP) + (HEIGHT.max + GAP) * 2 >= height) {
                    grid.height ++
                    break
                }
            }

            while (true) {
                // make a chamber
                for (let n = 0; n < chamber_width * chamber_height; n ++) {
                    const pos = indexToPos(n, chamber_width)

                    this.array[
                        (chamber_x + pos.x) +
                        (chamber_y + pos.y) * width
                    ] = AIR
                }

                // add it to an array
                chambers.push([
                    posToIndex(chamber_x, chamber_y, width),
                    chamber_width,
                    chamber_height
                ])

                // calculate next chamber
                const analysis =
                    (chamber_x + (WIDTH.max + GAP) * 2 > width) ?
                        (chamber_y + (HEIGHT.max + GAP) * 2 > height) ?
                            'End Loop' : 'New Line' : 'All Clear'

                if (analysis == 'End Loop') break
                if (analysis == 'All Clear') chamber_x += WIDTH.max + GAP
                else if (analysis == 'New Line') {
                    chamber_x = 1
                    chamber_y += HEIGHT.max + GAP
                }
                chamber_width = random(WIDTH.min, WIDTH.max)
                chamber_height = random(HEIGHT.min, HEIGHT.max)
                // don't make it outside the array
                if (chamber_height > height - 2) chamber_height = height - 2
            }
        }
        const makeTunnels = () => {
            let scout = {}
            const makeTunnel = (begin, end) => {
                scout.x = begin.x
                scout.y = begin.y

                const tunnel_length = Math.abs(begin.x - end.x) + Math.abs(begin.y - end.y)
                let moving = 'right'

                const objectsBeside = (index, objects) => {
                    let correct = false
    
                    for (let i = 0; i < objects.length; i ++) {
                        if (this.array[index - 1] == objects[i] &&
                            this.array[index + 1] == objects[i])
                                correct = true
                    }
    
                    if (correct) return true
                    return false
                }

                // tunnels and ladders
                for (let n = 0; n < tunnel_length; n ++) {
                    const index = posToIndex(scout.x, scout.y, width)
                    if (inItem(this.array[index], 0) == BLOCK) this.array[index] = AIR

                    if (scout.x < end.x) {
                        scout.x ++
                        moving = 'right'
                    }
                    else if (scout.x > end.x) {
                        scout.x --
                        moving = 'left'
                    }
                    else if (scout.y < end.y) {
                        scout.y ++
                        if (objectsBeside(index, [AIR, LADDER]) && moving == 'down')
                            this.array[index] = LADDER

                        moving = 'down'
                    }
                    else if (scout.y > end.y) {
                        scout.y --

                        moving = 'up'
                    }
                }
            }

            // when to make a down tunnel
            let drop_range = {min: 2, max: 4}
            let drop = random(drop_range.min, drop_range.max)

            // positions
            let upgrade_pos = random(3, grid.width)
            let make_coin = random(coin_gap.min, coin_gap.max)

            // make a tunnel for each chamber
            for (let i = 0; i < chambers.length; i ++) {
                const start = chambers[i]
                const right = (i + 1) % grid.width == 0 ? -1 : chambers[i + 1]
                const down = i + grid.width >= chambers.length ? -1 : chambers[i + grid.width]
                scout = indexToPos(start[0], width)

                const tunnelDown = () => {
                    makeTunnel(
                        indexToPos(
                            start[0] + // -----------------> start chamber index
                            (start[2] - 1) * width + // ---> plus height
                            random(0, start[1]), // -------> plus random x pos
                            width
                        ),
                        indexToPos(
                            down[0] + // -------------> down chamber index
                            down[2] * width + // -----> plus height (so that ladders work)
                            random(0, down[1]), // ---> plus random x pos
                            width
                        )
                    )
                }
                const tunnelRight = () => {
                    makeTunnel(
                        indexToPos(
                            start[0] + // ---------------------> start chamber index
                            start[1] - 1 + // -----------------> plus width
                            random(0, start[2]) * width, // ---> plus random y pos
                            width
                        ),
                        indexToPos(
                            right[0] + // ---------------------> right chamber index
                            random(0, right[2]) * width, // ---> plus random y pos
                            width
                        )
                    )
                }

                // right border
                if (i % grid.width == grid.width - 1) tunnelDown()

                else {
                    drop --

                    // right tunnel
                    if ((drop > 0 || i >= grid.width * (grid.height - 1)) && right != -1) tunnelRight()
                    // down tunnel
                    else if (down != -1) {
                        if (drop <= 0) drop = random(drop_range.min, drop_range.max)
                        tunnelDown()
                    }
                }

                /* ---- POSITION ASSETS ----
                
                Remember: start[0] refers to the index 
                of the top-right corner of each chamber,
                start[1] is the width of the chamber,
                and start[2] is the height. */

                upgrade_pos --
                const pos = indexToPos(start[0], width)

                // FRIENDS
                if (i == 1) {
                    if (game.level == 1)
                        chatBox(pos.x - 1, pos.y, 1, 1, 'effect')
                    else if (game.level == game.friend_level) {
                        makeFriend(pos.x - 1, pos.y)
                        this.actors.push([pos.x - 1, pos.y, 'friend'])
                        chatBox(pos.x - 4, pos.y, 3, 1, 'friend')
                    }
                    else if (game.level > game.friend_level) {
                        makeFriend(1, 1)
                        this.actors.push([1, 1, 'friend'])
                    }
                }

                // OTHER ACTORS
                if (start[1] != 1 && start[2] != 1) {
                    // EFFECTS
                    const type = nextSideEffect()
                    const type_width = Math.ceil(EFFECT_TYPES[type].width.max)
    
                    let effect_x = pos.x + random(0, start[1] - type_width)
                    const effect_y = pos.y + start[2]

                    if (type_width == 1 && this.array[effect_x + (effect_y + 1) * width] == AIR) {
                        if (effect_x < pos.x + start[1] - type_width - 1) effect_x ++
                        else effect_x --
                    }

                    makeSideEffect(effect_x, effect_y, type)
                    this.actors.push([effect_x, effect_y, 'effect', type])

                    // UPGRADES
                    if (upgrade_pos == 0 && game.level > 2 && hero.upgrade_number < hero.upgrades.length - 1) {
                        const upgrade_x = pos.x + random(0, start[1]) + .5
                        const upgrade_y = pos.y + start[2] - .8
                        game.upgrades.push(new Upgrade(upgrade_x, upgrade_y))
                        game.upgrades_max ++
                        this.actors.push([upgrade_x, upgrade_y, 'upgrade'])
                    }

                    // POINTS
                    else {
                        for (let i = 0; i < start[1]; i ++) {
                            make_coin --

                            if (make_coin <= 0) {
                                const point_x = pos.x + .5 + i
                                const point_y = pos.y + start[2] - random(.7, .9, 0)
                                game.points.push(new Point(point_x, point_y))
                                game.points_max ++
                                this.actors.push([point_x, point_y, 'point'])

                                make_coin = random(coin_gap.min, coin_gap.max)
                            }
                        }
                    }
                }
                // DOOR
                if (i == chambers.length - 1) {
                    const door_x = pos.x + start[1] - .85
                    const door_y = pos.y + start[2] - 1
                    game.door = new Door(door_x, door_y)
                    this.actors.push([door_x, door_y, 'door'])
                    chatBox(door_x, door_y, 1, 1, 'door control')
                }
            }
        }
        const reverseGeneration = () => {
            const noObjectsAround = (index, objects) => {
                let correct = true

                for (let i = 0; i < objects.length; i ++) {
                    if (this.array[index - 1] == objects[i] ||
                        this.array[index + 1] == objects[i] ||
                        this.array[index - width] == objects[i] ||
                        this.array[index + width] == objects[i])
                            correct = false
                }

                if (correct) return true
                return false
            }
            for (let i = 0; i < this.array.length; i ++) {
                if (inItem(this.array[i], 0) == BLOCK) {
                    if (noObjectsAround(i, [AIR, LADDER, TEMPORARY_LADDER]))
                        this.array[i] = TEMPORARY_AIR
                }
            }
            for (let i = 0; i < this.array.length; i ++)
                if (this.array[i] == TEMPORARY_AIR)
                    this.array[i] = AIR
        }

        makeChambers()
        makeTunnels()
        reverseGeneration()
    }

    end_generate() {
        const effect_x = 60
        const effect_y = 14
        const orb_x = 40
        const orb_y = 16

        screen.generateBackground()
        // Generate Block Image
        const b = [BLOCK, 0, this.makeScaryBlock()]

        const level = [
            0,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,
            b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,0,0,0,0,0,0,0,0,b,
            0,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,0,0,0,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,0,0,0,0,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,0,0,0,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,0,0,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,0,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,b,b,b,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,b,b,b,b,b,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,3,0,0,0,0,0,0,0,b,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b
        ]
    
        makeSideEffect(effect_x, effect_y, 7)

        game.orb = new Orb(orb_x, orb_y)
        chatBox(5, 1, 3, 1, 'orb1')
        chatBox(10, 1, 3, 1, 'orb2')
        chatBox(30, 16, 5, 1, 'orb3')

        hero.jet = {}
        hero.upgrade_past = []
        hero.upgrade_past.push(hero.upgrades[2])
        hero.upgradeSort()

        game.rememberUpgrade()

        this.array = [...level]
    }

    draw() {
        const h_half = cvs.width / 2 / scale
        const v_half = cvs.height / 2 / scale

        const top = Math.floor(cam.y - v_half)
        const bottom = Math.floor(cam.y + v_half) + 1
        const left = Math.floor(cam.x - h_half)
        const right = Math.floor(cam.x + h_half) + 1

        const LEFT = (left > 0 ? left : 0)
        const RIGHT = (right < this.width ? right : this.width)
        const TOP = (top > 0 ? top : 0)
        const BOTTOM = (bottom < this.height ? bottom : this.height)

        ctx.imageSmoothingEnabled = false

        for (let x = LEFT; x < RIGHT; x ++) {
            for (let y = TOP; y < BOTTOM; y ++) {
                const item = this.array[x + y * this.width]

                if (item == LADDER) {
                    const rungs = 3
                    const size = .05

                    ctx.fillStyle = '#333'
                    for (let i = 1; i < rungs + (this.array[x + (y + 1) * this.width] == LADDER ? 1 : 0); i ++)
                        fillRect(x + .1, y + i / rungs, .7, size)

                    fillRect(x + .1, y, size, 1)
                    fillRect(x + .8, y, size, 1)
                }


                else if (inItem(item, 0) == BLOCK) {
                    const real = realPos(x + .5, y + .5)

                    ctx.save()
                    ctx.translate(real.x, real.y)
                    ctx.rotate(inItem(item, 1) * (Math.PI / 2))
                    rotFillImage(inItem(item, 2), -.5, -.5, 1, 1)
                    ctx.restore()
                }
            }
        }

        // for (let i = 0; i < this.chat_array.length; i ++) {
        //     const item = this.chat_array[i]
        //     const pos = indexToPos(i, this.width)

            
        //     if (inItem(item, 0) == CHAT_BOX) {
        //         ctx.fillStyle = '#0f03'
        //         fillRect(pos.x, pos.y, 1, 1)
        //     }
        // }
    }
}