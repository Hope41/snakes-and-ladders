'use strict'
const spoken = {}
function talk(type, one_off = false) {
    if (spoken[type]) return
    if (one_off) spoken[type] = true

    if (type == 'hello') {
        comment.chat('hero', [
        'Hello. My name is Drillo.',
        'I am on a mission to destroy the X-Ray Orb.',
        'Can you help me?',
        'Use the arrow keys to move.'])

        return
    }
    if (type == 'door') {
        let enemy = false
        for (let i = 0; i < game.effects.length; i ++) if (effectCoin(game.effects[i].type)) enemy = true

        comment.chat('hero', ['This door is locked.', 'Collect all the coins to unlock it.'])
        if (enemy) comment.chat('hero', ['Note that coins may still be trapped inside the larger enemies.'])

        return
    }
    if (type == 'door control') {
        comment.chat('hero', ['Press the down key to open the door'])
        return
    }
    if (type == 'point') {
        comment.chat('hero', [
            'That was a Coin Location upgrade!',
            'An arrow will point in the direction of the remaining coins.'
        ])
        return
    }
    if (type == 'pound') {
        comment.chat('hero', [
            'That was a Ground Pound upgrade!',
            'Press the down key whilst in the air to pound the ground.',
            'Use it to destroy enemies as it is twice as powerful!'
        ])
        return
    }
    if (type == 'jet') {
        comment.chat('hero', [
            'That was a Jetpack upgrade! Press the up key to fly.',
            'It also doubles ground pound efficiency.'
        ])
        return
    }
    if (type == 'health') {
        comment.chat('hero', [
            'That was a Health power up! It gives you an extra life.',
            'They will be useful for later.'
        ])
        return
    }
    if (type == 'shield') {
        comment.chat('hero', [
            'That was a Shield power up!',
            'Run into as many enemies as you can before it runs out!'
        ])
        return
    }
    if (type == 'super pound') {
        comment.chat('hero', [
            'That was a Super Pound power up!',
            'Your next ground pound will remove seven lives from every enemy.'
        ])
        return
    }
    if (type == 'effect') {
        comment.chat('hero', [
            'There are some dangerous side effects around here.',
            'You can jump on them to destroy them.'
        ])
        return
    }
    if (type == 'friend') {
        comment.chat('friend', ['Hello! Are you coming to destroy the X-Ray Orb?'])
        comment.chat('hero', ['Yep.'])
        comment.chat('friend', ['Well, I don\'t mind coming along to help.'])
        comment.chat('hero', ['Yes please, I was getting a bit lonely.'])
        comment.chat('friend', ['Yay! Let\'s go!'])

        return
    }
    if (type == 'orb1') {
        comment.chat('hero', ['Where are we?'])
        return
    }
    if (type == 'orb2') {
        comment.chat('hero', ['Oh no! My solar powered jetpack does not work in the dark!'])
        return
    }
    if (type == 'orb3') {
        comment.chat('hero', ['Friend? Where are you?'])
        comment.chat('orb', ['Don\'t worry. I have him safe.'])
        comment.chat('hero', ['!!!'])
        comment.chat('orb', [
            'I\'ve done all I can to prevent you from getting this far,',
            'But it must stop here.'
        ])
        comment.chat('hero', ['Who are you?'])
        comment.chat('orb', [
            'I am The X-Ray Orb.',
            'My mission is to destroy the world and you have been slowing me down!',
            'You don\'t know what you\'ve got yourself into.',
            'Prepare to face my revenge.',
            'GWAHAHAHAAAA!'
        ])
        comment.chat('hero', ['Oh no...'])

        return
    }
}

function indexToPos(index, width) {
    return {
        x: index % width,
        y: Math.floor(index / width)
    }
}

function posToIndex(x, y, width) {
    return x + y * width
}
 
function makePowerUpArr() {
    const arr = []
    // GENERATE
    for (let i = 0; i < hero.powers.length; i ++) arr.push(i)

    // SHUFFLE
    for (let i = 0; i < arr.length; i ++) {
        // choose a random element
        const choice = arr[random(0, i + 1)]
        // get the current element
        const current = arr[i]

        // set current element to random one
        arr[current] = choice
        // set random element to current one
        arr[choice] = current
    }

    power_up_arr = [...arr]
}

function makePowerUp(thing) {
    power_up_time --

    if (thing.type == 0 || // ---> Stick
        thing.type == 1) // -----> Centipede
            return

    if (power_up_time <= 0) {
        if (power_up_arr.length <= 0) makePowerUpArr()

        /*
        type 0 ---> health
        type 1 ---> shield
        type 2 ---> super pound
        */

        const add = types => {
            const x = thing.x + thing.width / 2
            const type = types[power_up_arr[power_up_arr.length - 1] % types.length]
            power_up_arr.pop()

            game.powers.push(
                new Power(
                    x - .15,
                    random(thing.y + thing.height / 2, thing.y + thing.height, 0),
                    thing.speed_x,
                    type
                )
            )
        }

        if (thing.type == 2) add([0]) // -----------> Creeper
        else if (thing.type == 3) add([1]) // ------> Chunk
        else if (thing.type == 4) add([1, 2]) // ---> Monster
        else if (thing.type == 6) add([2]) // ------> Crab
        else if (thing.type == 7) add([2]) // ------> Hammer

        power_up_time = random(power_up_range.min, power_up_range.max)
    }
}

function transitionLinear(a, b, decimal) {
    if (decimal > 1) decimal = 1
    if (decimal < 0) decimal = 0

    const dist = b - a
    return a + dist * decimal
}

function moveToward(a, b, speed, calc = {x: true, y: true}) {
    const dist_x = a.x - b.x
    const dist_y = a.y - b.y
    const angle = Math.atan2(dist_y, dist_x)
    if (calc.x) a.x -= Math.cos(angle) * speed
    if (calc.y) a.y -= Math.sin(angle) * speed

    const half = speed / 2

    if (a.x < b.x + half && a.x > b.x - half) a.x = b.x
    if (a.y < b.y + half && a.y > b.y - half) a.y = b.y
    if (a.x == b.x && a.y == b.y) return 'hit'
    return 'moving'
}

function randomColor() {
    return [random(0, 255), random(0, 255), random(0, 255)]
}

function translate(x, y) {
    return ctx.translate(x * scale, y * scale)
}

function posToIndex(x, y, width) {
    return Math.floor(x) + Math.floor(y) * width
}

function rgb(red, green, blue, alpha = 1) {
    return 'rgb('+red+','+green+','+blue+','+alpha+')'
}

function colorChange(seed) {
    const color = [0, 0, 0]

    const third = (Math.PI * 2) / 3
    const half = 122.5

    const red = 0
    const green = -third
    const blue = -third * 2

    color[0] = half + Math.sin(seed + red) * half
    color[1] = half + Math.sin(seed + green) * half
    color[2] = half + Math.sin(seed + blue) * half

    return color
}

function rotateSmooth(current, goal, base) {
    const quart = Math.PI / 2
    if (current > base.max - quart && goal < base.min + quart) current -= Math.PI * 2
    else if (current < base.min + quart && goal > base.max - quart) current += Math.PI * 2

    return current
}

function realPos(x, y, w = 0, h = 0) {
    x = (x - cam.x) * scale + cvs.width / 2
    y = (y - cam.y) * scale + cvs.height / 2
    w = w * scale
    h = h * scale
    return {x, y, w, h}
}

function fakePos(x, y) {
    return {
        x: (x - cvs.width / 2) / scale + cam.x,
        y: (y - cvs.height / 2) / scale + cam.y
    }
}

function onScreen(x, y, width, height) {
    const real = realPos(x, y)
    if (real.x > -width * scale && x < cvs.width &&
        real.y > -height * scale && y < cvs.height)
            return true
}

function random(min, max, int = 1) {
    const value = Math.random() * (max - min) + min

    return int ? Math.floor(value) : value
}

function fillImage(image, x, y, w, h) {
    const real = realPos(x, y)

    ctx.drawImage(image, real.x, real.y, w * scale, h * scale)
}

function rotFillImage(image, x, y, w, h) {
    ctx.drawImage(image, x * scale, y * scale, w * scale, h * scale)
}

function fillRect(x, y, width, height, stroke = false) {
    const real = realPos(x, y)

    if (stroke) ctx.strokeRect(real.x, real.y, width * scale, height * scale)
    else ctx.fillRect(real.x, real.y, width * scale, height * scale)
}

function rotFillRect(x, y, width, height, stroke = false) {
    if (stroke) ctx.strokeRect(x * scale, y * scale, width * scale, height * scale)
    else ctx.fillRect(x * scale, y * scale, width * scale, height * scale)
}

function flipRect(x, y, width, height, origin_x, origin_y, flip_x, flip_y, stroke = false, details = false, draw = true) {
    let X = origin_x + x * flip_x
    let Y = origin_y + y * flip_y
    const W = width * flip_x
    const H = height * flip_y

    if (draw) fillRect(X, Y, W, H, stroke)
    if (details) return {x: X, y: Y, width: W, height: H}
}

function rotFlipRect(x, y, width, height, origin_x, origin_y, flip_x, flip_y, stroke = false, details = false, draw = true) {
    let X = origin_x + x * flip_x
    let Y = origin_y + y * flip_y
    const W = width * flip_x
    const H = height * flip_y

    if (draw) rotFillRect(X, Y, W, H, stroke)
    if (details) return {x: X, y: Y, width: W, height: H}
}

function flip (thing, flip, normal) {
    return thing * (flip / normal)
}

function line(arr, width = .01) {
    for (let i = 0; i < arr.length; i += 2) {
        const real1 = realPos(arr[i], arr[i + 1])
        const real2 = realPos(arr[i + 2], arr[i + 3])

        const dist_x = real2.x - real1.x
        const dist_y = real2.y - real1.y

        const angle = Math.atan2(dist_y, dist_x)
        const dist = Math.sqrt(
            (dist_x * dist_x) +
            (dist_y * dist_y)
        )
        const thinkness = width * scale

        ctx.save()
        ctx.translate(real1.x, real1.y)
        ctx.rotate(angle)
        ctx.fillRect(0, -thinkness / 2, dist, thinkness)
        ctx.restore()
    }
}

function lineFill(arr) {
    ctx.beginPath()

    for (let i = 0; i < arr.length; i += 2) {
        const real = realPos(arr[i], arr[i + 1])

        ctx.lineTo(real.x, real.y)
    }

    ctx.fill()
}

function fillText(words, x, y) {
    const real = realPos(x, y)
    ctx.fillText(words, real.x, real.y)
}

function merge(obj1, obj2, gravity, fly = 0, speed_x = 0) {
    /* Detects the smallest overlap of the
    object2 with object1. It is useful for
    stopping the object1 from going through
    solid objects like the ground. */

    const margin = {
        left: (obj1.x + obj1.width) - obj2.x,
        right: obj1.x - (obj2.x + obj2.width),
        top: (obj1.y + obj1.height) - obj2.y,
        bottom: obj1.y - (obj2.y + obj2.height)
    }

    const smallest_x =
        margin.left < -margin.right ?
        margin.left : margin.right
    const smallest_y =
        margin.top < -margin.bottom ?
        margin.top : margin.bottom

    if (Math.abs(smallest_x) - speed_x < (Math.abs(smallest_y) - (smallest_y > 0 ? gravity : fly)))
        return {x: smallest_x, y: 0}
    return {x: 0, y: smallest_y}
}

function collide(obj1, obj2) {
    /* Detects if object1 is
    colliding with object2.*/

    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    )
}

function findBlock(x, y, x_add, y_add) {
    x = Math.floor(x) + x_add
    y = Math.floor(y) + y_add

    return map.array[x + y * map.width]
}

function calcScale() {
    return (cvs.width + cvs.height) / 30
}

function resize() {
    cvs.width = innerWidth * dpr
    cvs.height = (innerHeight + 1) * dpr

    game.resize()

    const quart = cvs.width / 4
    arrow.width = quart
    arrow.height = cvs.height
    const y = cvs.height - arrow.height

    left.x = 0
    left.y = y
    right.x = quart
    right.y = y
    down.x = quart * 2
    down.y = y
    up.x = quart * 3
    up.y = y
}

function startGame() {
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, cvs.width, cvs.height)
    
    start.time ++
    start.box = cvs.width < cvs.height ? cvs.width : cvs.height

    const SIZE = start.box
    const Y = cvs.height / 2 - SIZE / 2
    const ALPHA = start.time / 100

    const write = (text, size, y, style = 'bold italic ') => {
        ctx.font = style + (size * SIZE) + 'px sans-serif'
        ctx.fillText(
            text, cvs.width / 2 - ctx.measureText(text).width / 2,
            Y + SIZE * y
        )
    }

    ctx.fillStyle = rgb(110,0,0,ALPHA)
    write('SNAKES AND LADDERS', .08, .45)
    write('A Platform Game By Joachim Ford', .04, .49)

    const control = MOBILE ?
        'Use The Arrow Buttons To Opperate The Game' :
        'Use The Arrow Keys To Opperate The Game'
    ctx.fillStyle = rgb(0,0,0,ALPHA)
    write(control, .034, .6, '')

    const begin = MOBILE ?
        'Click Anywhere To Start' :
        'Press An Arrow Key To Start'
    ctx.fillStyle = rgb(0,0,150+Math.sin(start.time/10)*300,ALPHA)
    write(begin, .04, .7)

    const fake = fakePos(cvs.width / 2, Y + SIZE * .2)
    hero.x = fake.x - hero.width / 2
    hero.y = fake.y
    hero.speed_x = .2
    hero.walk += .3
    hero.draw()
    const _fake = fakePos(cvs.width / 3, 0)
    ctx.fillStyle = '#000'
    fillRect(_fake.x, hero.y + hero.height, fake.x * 2 - _fake.x * 2, .03)

    if (!key.down && !key.up && !key.left && !key.right) requestAnimationFrame(startGame)
    else {
        hero.speed_x = 0
        hero.walk = 0
        hero.set()
        update()
    }
}

function update() {
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    ctx.fillStyle = rgb(screen.bg[0], screen.bg[1], screen.bg[2], screen.bg[3])
    ctx.fillRect(0, 0, cvs.width, cvs.height)

    game.update()

    if (MOBILE) {
        const point = (x, type, angle) => {
            const size = cvs.height < cvs.width ? (cvs.width + cvs.height) / 20 : cvs.width / 10
            const y_lift = size / 10

            const draw = y_offset => {
                ctx.save()
                ctx.translate(x + arrow.width / 2, cvs.height - size / 2 + y_offset - y_lift)
                ctx.rotate(angle * Math.PI / 180)
    
                ctx.beginPath()
                ctx.moveTo(-size / 2, 0)
                ctx.lineTo(size / 2, -size / 2)
                ctx.lineTo(size / 2, size / 2)
                ctx.fill()
    
                ctx.restore()
            }

            const sine = 50 + Math.sin(time / 10) * 50
            const COLOR = comment.active ? rgb(153 - sine, 153 + sine, 153 - sine) : '#999'

            ctx.fillStyle = type ? COLOR : '#555'
            draw(0)

            if (!type) {
                ctx.fillStyle = COLOR
                draw(-scale / 10)
            }
        }

        point(left.x, key.left, 0)
        point(up.x, key.up, 90)
        point(down.x, key.down, 270)
        point(right.x, key.right, 180)
    }

    if (!game.exit) requestAnimationFrame(update)
}

function endGame() {
    ctx.clearRect(0, 0, cvs.width, cvs.height)

    end.alpha += .01
    const COLOR = rgb(0,0,0,end.alpha)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, cvs.width, cvs.height)

    const write = (text, size, y) => {
        ctx.font = 'bold italic ' + size + 'px sans-serif'
        ctx.fillText(text, cvs.width / 2 - ctx.measureText(text).width / 2, y)
    }

    ctx.fillStyle = rgb(153,0,0,end.alpha)
    write('SNAKES AND LADDERS', scale / 1.5, cvs.height / 2)
    write('A Game By Joachim Ford', scale / 3, cvs.height / 2 + scale / 3)

    const fake = fakePos(cvs.width / 2, cvs.height / 2 - scale * 2)
    hero.x = fake.x - hero.width / 2
    hero.y = fake.y

    hero.color = COLOR
    hero.speed_x = .2
    hero.walk += .3
    hero.draw()

    const _fake = fakePos(cvs.width / 3, 0)
    ctx.fillStyle = COLOR
    fillRect(_fake.x, hero.y + hero.height, fake.x * 2 - _fake.x * 2, .03)

    requestAnimationFrame(endGame)
}

function device() {
    const tap = (e, value) => {
        e.preventDefault()

        const touch = (mouse, obj, type) => {
            const point = {x: mouse.clientX * dpr, y: mouse.clientY * dpr, width: 0, height: 0}
            const box = {x: obj.x, y: obj.y, width: arrow.width, height: arrow.height}
            if (collide(point, box)) key[type] = value
        }

        for (let i = 0; i < e.changedTouches.length; i ++) {
            const mouse = e.changedTouches[i]
            // detect collision with the mouse and the boxes
            touch(mouse, left, 'left')
            touch(mouse, up, 'up')
            touch(mouse, down, 'down')
            touch(mouse, right, 'right')
        }
    }
    const press = (e, value) => {
        if (e.repeat) return
    
        if (e.key == 'ArrowUp') key.up = value
        if (e.key == 'ArrowDown') key.down = value
        if (e.key == 'ArrowLeft') key.left = value
        if (e.key == 'ArrowRight') key.right = value
        if (e.key == 'w') key.up = value
        if (e.key == 's') key.down = value
        if (e.key == 'a') key.left = value
        if (e.key == 'd') key.right = value
        if (e.key == 'z') key.up = value
        if (e.key == 'q') key.left = value
    }
    onkeydown = e => press(e, 1)
    onkeyup = e => press(e, 0)
    if (MOBILE) {
        ontouchstart = e => tap(e, 1)
        ontouchend = e => tap(e, 0)
    }
}

const key = {
    up: false,
    down: false,
    left: false,
    right: false,

    w: false,
    a: false,
    s: false,
    d: false,

    z: false,
    q: false
}

const cvs = document.createElement('canvas')
const ctx = cvs.getContext('2d')
const hero = new Drillo()
const map = new Map()
const game = new Game()
const cam = new Camera(0, 0)
const screen = new Screen()
const comment = new Talk()
let scale = 0
let time = 0
const end = {alpha: 0}
const start = {time: 0, box: 0}
const dpr = devicePixelRatio

talk('hello')

game.start()

// Side Effect Power-Up Details
const power_up_range = {min: 2, max: 4}
let power_up_time = random(power_up_range.min, power_up_range.max)
let power_up_arr = []

const MOBILE = 'ontouchstart' in window
const arrow = {width: 0, height: 0}
const left = {x: 0, y: 0}
const up = {x: 0, y: 0}
const down = {x: 0, y: 0}
const right = {x: 0, y: 0}
device()

document.body.appendChild(cvs)
addEventListener('resize', resize)
resize()
startGame()
